"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useRouter } from "next/navigation";
import { AudioPlayer, parseTimestamp } from "@/components/practice/audio-player";
import { CdiExamShell } from "@/components/practice/cdi-exam-shell";
import {
  QuestionNavigator,
  type NavQuestion,
} from "@/components/practice/question-navigator";
import {
  SubmitConfirmDialog,
  LeaveConfirmDialog,
  TestEndedOverlay,
} from "@/components/practice/submit-confirm-dialog";
import { renderRichText } from "@/components/practice/rich-text";
import { SharedChoiceAnswers } from "@/components/practice/shared-choice-answers";
import {
  sanitizeHighlights,
  type PassageHighlight,
} from "@/lib/practice/passage-highlights";
import {
  getCoveredNumbers,
  isPairedSatellite,
} from "@/lib/practice/multi-select";
import { clusterSharedChoices } from "@/lib/practice/shared-choice";
import { splitWritingPrompt } from "@/lib/practice/writing-prompt";
import { countWords } from "@/lib/scoring";
import { friendlyError } from "@/lib/ui/friendly-error";
import { cancelNavProgress, startNavProgress } from "@/lib/client/nav-progress";
import { formatQuestionStem } from "@/lib/ui/question-type-label";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import nextDynamic from "next/dynamic";
import type { SpeakingExamDeskHandle } from "@/components/practice/speaking-exam-desk";
import {
  SpeakingMicSetup,
  speakingMicStorageKey,
  speakingClockStorageKey,
} from "@/components/practice/speaking-mic-setup";
import {
  buildSpeakingExamQueue,
  filterSpeakingExamQueue,
  isSpeakingAnswered,
  parseSpeakingPartKinds,
} from "@/lib/practice/speaking-exam";
import { useTranslations } from "@/i18n/provider";
import {
  QuestionInput,
  ReadingOrNotesSplit,
  defaultMinWords,
  type Part,
} from "@/components/practice/question-workspace";

const SpeakingExamDesk = nextDynamic(
  () =>
    import("@/components/practice/speaking-exam-desk").then(
      (m) => m.SpeakingExamDesk,
    ),
  { ssr: false },
);


type Props = {
  attemptId: string;
  testTitle: string;
  skill: string;
  timeLimitMinutes: number | null;
  startedAt: string;
  initialAnswers: Record<string, string>;
  initialHighlights?: PassageHighlight[];
  parts: Part[];
  audioFiles?: string[];
  /** Filtered attempt containing only previously wrong questions */
  retryWrong?: boolean;
  /** Speaking: selected IELTS Part 1/2/3 (not imported pack order). */
  speakingPartKinds?: number[];
};

const SAVE_DEBOUNCE_MS = 700;

function localKey(attemptId: string) {
  return `wewin-attempt:${attemptId}`;
}

function partsHaveDuplicateNumbers(parts: Part[]): boolean {
  const seen = new Set<number>();
  for (const p of parts) {
    for (const q of p.questions) {
      if (seen.has(q.number)) return true;
      seen.add(q.number);
    }
  }
  return false;
}

/** Assign unique 1..N numbers across parts (Speaking topics often restart at 1). */
function withGlobalQuestionNumbers(parts: Part[]): Part[] {
  let n = 1;
  return parts.map((p) => ({
    ...p,
    questions: p.questions.map((q) => ({
      ...q,
      number: n++,
    })),
  }));
}

function migrateAnswersAfterRenumber(
  partsBefore: Part[],
  partsAfter: Part[],
  answers: Record<string, string>,
): Record<string, string> {
  const next: Record<string, string> = {};
  const oldQs = partsBefore.flatMap((p) => p.questions);
  const newQs = partsAfter.flatMap((p) => p.questions);
  const consumed = new Map<number, number>();
  for (let i = 0; i < newQs.length; i++) {
    const newKey = String(newQs[i]!.number);
    if ((answers[newKey] ?? "").trim()) {
      next[newKey] = answers[newKey]!;
      continue;
    }
    const oldNum = oldQs[i]?.number;
    if (oldNum == null) continue;
    const used = consumed.get(oldNum) ?? 0;
    const oldKey = String(oldNum);
    if (used === 0 && (answers[oldKey] ?? "").trim()) {
      next[newKey] = answers[oldKey]!;
    }
    consumed.set(oldNum, used + 1);
  }
  return next;
}

function remainingSeconds(
  clockStartedAt: string,
  timeLimitMinutes: number | null,
): number | null {
  if (!timeLimitMinutes) return null;
  const elapsed = Math.floor(
    (Date.now() - new Date(clockStartedAt).getTime()) / 1000,
  );
  return Math.max(0, timeLimitMinutes * 60 - elapsed);
}

function fullDurationSeconds(timeLimitMinutes: number | null): number | null {
  if (!timeLimitMinutes) return null;
  return timeLimitMinutes * 60;
}

export function PracticeSession({
  attemptId,
  testTitle,
  skill,
  timeLimitMinutes,
  startedAt,
  initialAnswers,
  initialHighlights = [],
  parts,
  audioFiles,
  retryWrong = false,
  speakingPartKinds,
}: Props) {
  const router = useRouter();
  const { t } = useTranslations("practice");
  const ts = useTranslations("skills").t;
  const te = useTranslations("errors").t;

  const shouldRenumber =
    skill === "SPEAKING" ||
    skill === "WRITING" ||
    partsHaveDuplicateNumbers(parts);

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (!shouldRenumber) return initialAnswers;
    return migrateAnswersAfterRenumber(
      parts,
      withGlobalQuestionNumbers(parts),
      initialAnswers,
    );
  });
  const [activePart, setActivePart] = useState(0);
  const [currentNumber, setCurrentNumber] = useState<number | null>(() => {
    const sp = shouldRenumber ? withGlobalQuestionNumbers(parts) : parts;
    return sp[0]?.questions[0]?.number ?? null;
  });
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set());
  const [highlights, setHighlights] = useState<PassageHighlight[]>(() =>
    sanitizeHighlights(initialHighlights),
  );
  /**
   * Speaking: freeze at full duration (static — SSR/client match during mic setup).
   * Other skills: null until client sync — avoids Date.now() hydration mismatch.
   */
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    skill === "SPEAKING" ? fullDurationSeconds(timeLimitMinutes) : null,
  );
  /** False until client arms the clock; Speaking stays false until mic setup completes. */
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [endedFromTimeout, setEndedFromTimeout] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const hydrated = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());
  /** Blocks double submit (timer + manual) and leave/abandon races. */
  const submittingRef = useRef(false);
  /** True after successful submit or confirmed abandon — skip leave guards. */
  const allowUnloadRef = useRef(false);
  const speakingDeskRef = useRef<SpeakingExamDeskHandle | null>(null);
  const leavePendingRef = useRef<{ href?: string; historyBack?: boolean } | null>(
    null,
  );

  const isReading = skill === "READING";
  const isListening = skill === "LISTENING";
  const isWriting = skill === "WRITING";
  const isSpeaking = skill === "SPEAKING";
  const isLr = isReading || isListening;
  const skillLabel = ts(skill, skill);

  const speakingQueue = useMemo(
    () =>
      isSpeaking
        ? filterSpeakingExamQueue(
            buildSpeakingExamQueue(parts),
            parseSpeakingPartKinds(speakingPartKinds),
          )
        : [],
    [isSpeaking, parts, speakingPartKinds],
  );

  /** Once per attemptId in this tab — skip mic gate on refresh mid-exam. */
  const [speakingMicReady, setSpeakingMicReady] = useState(() => {
    if (!isSpeaking || typeof window === "undefined") return !isSpeaking;
    try {
      return sessionStorage.getItem(speakingMicStorageKey(attemptId)) === "1";
    } catch {
      return false;
    }
  });
  /** True if mic was already cleared before this mount (refresh mid-exam). */
  const speakingMicReadyOnMountRef = useRef(speakingMicReady);

  const sessionParts = useMemo(
    () => (shouldRenumber ? withGlobalQuestionNumbers(parts) : parts),
    [parts, shouldRenumber],
  );

  const navQuestions: NavQuestion[] = useMemo(
    () =>
      isSpeaking
        ? speakingQueue.map((it) => ({
            number: it.number,
            partIndex: it.packIndex,
            partLabel: t(
              `speakingPart${it.partKind}` as "speakingPart1",
              `Part ${it.partKind}`,
            ),
          }))
        : sessionParts.flatMap((p, partIndex) =>
            p.questions.map((q) => ({
              number: q.number,
              partIndex,
              partLabel: t("partShort", { n: partIndex + 1 }, "P{n}"),
            })),
          ),
    [isSpeaking, speakingQueue, sessionParts, t],
  );
  const allQuestions = useMemo(
    () => navQuestions.map((q) => q.number),
    [navQuestions],
  );
  const answeredCount = allQuestions.filter((n) =>
    isSpeaking
      ? isSpeakingAnswered(answers[String(n)])
      : (answers[String(n)] ?? "").trim() !== "",
  ).length;
  const unansweredCount = allQuestions.length - answeredCount;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey(attemptId));
      if (!raw) {
        hydrated.current = true;
        return;
      }
      const parsed = JSON.parse(raw) as {
        answers?: Record<string, string>;
        flagged?: number[];
        highlights?: unknown;
        savedAt?: string;
      };
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        const localAnswers = shouldRenumber
          ? migrateAnswersAfterRenumber(
              parts,
              withGlobalQuestionNumbers(parts),
              parsed.answers,
            )
          : parsed.answers;
        setAnswers((prev) => {
          const serverKeys = Object.keys(prev).filter((k) => (prev[k] ?? "").trim());
          const localKeys = Object.keys(localAnswers).filter(
            (k) => (localAnswers[k] ?? "").trim(),
          );
          if (localKeys.length >= serverKeys.length) return localAnswers;
          return { ...localAnswers, ...prev };
        });
      }
      if (Array.isArray(parsed.flagged)) {
        setFlagged(new Set(parsed.flagged.filter((n) => Number.isFinite(n))));
      }
      if (Array.isArray(parsed.highlights)) {
        const localMarks = sanitizeHighlights(parsed.highlights);
        setHighlights((prev) => (localMarks.length >= prev.length ? localMarks : prev));
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [attemptId, parts, shouldRenumber]);

  const persistDraft = useCallback(
    async (
      next: Record<string, string>,
      nextFlagged?: Set<number>,
      nextHighlights?: PassageHighlight[],
    ) => {
      const flags = nextFlagged ?? flagged;
      const marks = nextHighlights ?? highlightsRef.current;
      try {
        localStorage.setItem(
          localKey(attemptId),
          JSON.stringify({
            answers: next,
            flagged: Array.from(flags),
            highlights: marks,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* quota */
      }
      setSaveState("saving");
      try {
        const res = await fetch(`/api/practice/${attemptId}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: next, highlights: marks }),
        });
        if (!res.ok) {
          setSaveState("error");
          console.warn("[practice/save] failed", res.status);
          return;
        }
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
        console.warn("[practice/save]", e);
      }
    },
    [attemptId, flagged],
  );

  useEffect(() => {
    if (!hydrated.current) return;
    const timer = setTimeout(() => {
      void persistDraft(answers, undefined, highlights);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [answers, highlights, persistDraft]);

  /**
   * Arm the exam countdown on the client only.
   * Speaking: frozen at full duration until mic setup → Start Part 1.
   * Other skills: tick from attempt startedAt (unchanged).
   */
  useEffect(() => {
    if (timeLimitMinutes == null) {
      setSecondsLeft(null);
      setTimerActive(false);
      return;
    }

    const full = timeLimitMinutes * 60;

    if (isSpeaking) {
      if (!speakingMicReady) {
        setSecondsLeft(full);
        setTimerActive(false);
        return;
      }

      let clockAt: string | null = null;
      try {
        clockAt = sessionStorage.getItem(speakingClockStorageKey(attemptId));
      } catch {
        /* ignore */
      }

      if (!clockAt) {
        // Mic ready but no clock key yet:
        // - Just clicked Start Part 1 (mic setup should have written clock; race fallback → now)
        // - Legacy refresh mid-exam (mic was ready on mount) → attempt startedAt
        if (speakingMicReadyOnMountRef.current) {
          clockAt = startedAt;
        } else {
          clockAt = new Date().toISOString();
        }
        try {
          sessionStorage.setItem(speakingClockStorageKey(attemptId), clockAt);
        } catch {
          /* ignore */
        }
      }

      setSecondsLeft(remainingSeconds(clockAt, timeLimitMinutes));
      setTimerActive(true);
      return;
    }

    setSecondsLeft(remainingSeconds(startedAt, timeLimitMinutes));
    setTimerActive(true);
  }, [
    isSpeaking,
    speakingMicReady,
    timeLimitMinutes,
    startedAt,
    attemptId,
  ]);

  useEffect(() => {
    if (!timerActive) return;
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) {
      void doSubmit({ fromTimeout: true });
      return;
    }
    const timer = setTimeout(
      () => setSecondsLeft((s) => (s == null ? s : s - 1)),
      1000,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, timerActive]);

  /** Browser close / refresh — native dialog; abandon on unload if still open. */
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowUnloadRef.current || submittingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onPageHide = () => {
      if (allowUnloadRef.current || submittingRef.current) return;
      try {
        const url = `/api/practice/${attemptId}/abandon`;
        if (typeof navigator.sendBeacon === "function") {
          navigator.sendBeacon(url);
        } else {
          void fetch(url, { method: "POST", keepalive: true });
        }
        localStorage.removeItem(localKey(attemptId));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [attemptId]);

  /** In-app link clicks + browser back → custom leave dialog. */
  useEffect(() => {
    history.pushState({ wewinPracticeGuard: true }, "", location.href);

    const requestLeave = (pending: {
      href?: string;
      historyBack?: boolean;
    }) => {
      if (allowUnloadRef.current || submittingRef.current) return;
      leavePendingRef.current = pending;
      setLeaveOpen(true);
      setConfirmOpen(false);
    };

    const onPopState = () => {
      if (allowUnloadRef.current || submittingRef.current) return;
      history.pushState({ wewinPracticeGuard: true }, "", location.href);
      requestLeave({ historyBack: true });
    };

    const onDocClick = (e: MouseEvent) => {
      if (allowUnloadRef.current || submittingRef.current) return;
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) {
        e.preventDefault();
        requestLeave({ href: url.href });
        return;
      }
      const samePath =
        url.pathname === location.pathname && url.search === location.search;
      if (samePath) return;
      e.preventDefault();
      cancelNavProgress();
      requestLeave({ href: `${url.pathname}${url.search}${url.hash}` });
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocClick, true);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onDocClick, true);
    };
  }, []);

  function setAnswer(num: number, value: string) {
    setAnswers((prev) => ({ ...prev, [String(num)]: value }));
    setCurrentNumber(num);
  }

  function patchAnswers(patch: Record<string, string>, focusNumber: number) {
    setAnswers((prev) => ({ ...prev, ...patch }));
    setCurrentNumber(focusNumber);
  }

  function goToQuestion(num: number) {
    const nav = navQuestions.find((q) => q.number === num);
    if (!nav) return;
    setActivePart(nav.partIndex);
    setCurrentNumber(num);
    requestAnimationFrame(() => {
      const el = questionRefs.current.get(num);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function goRelative(delta: number) {
    const idx = navQuestions.findIndex((q) => q.number === currentNumber);
    const next = navQuestions[idx + delta];
    if (next) goToQuestion(next.number);
  }

  function toggleFlag() {
    if (currentNumber == null) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentNumber)) next.delete(currentNumber);
      else next.add(currentNumber);
      try {
        localStorage.setItem(
          localKey(attemptId),
          JSON.stringify({
            answers: answersRef.current,
            flagged: Array.from(next),
            highlights: highlightsRef.current,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function reviewFirstUnanswered() {
    const first = allQuestions.find((n) =>
      isSpeaking
        ? !isSpeakingAnswered(answers[String(n)])
        : (answers[String(n)] ?? "").trim() === "",
    );
    setConfirmOpen(false);
    if (first != null) goToQuestion(first);
  }

  function submit() {
    if (submittingRef.current || allowUnloadRef.current) return;
    setConfirmOpen(true);
  }

  async function doSubmit(opts?: { fromTimeout?: boolean }) {
    if (submittingRef.current || allowUnloadRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);
    setLeaveOpen(false);
    setError(null);
    setEndedFromTimeout(Boolean(opts?.fromTimeout));
    setTestEnded(true);
    try {
      const res = await fetch(`/api/practice/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answersRef.current,
          highlights: highlightsRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const mapped = friendlyError(data.error, t("submitFailed"), te);
        if (data.error) console.warn("[practice/submit]", data.error);
        setError(mapped);
        submittingRef.current = false;
        setSubmitting(false);
        setTestEnded(false);
        setEndedFromTimeout(false);
        return;
      }
      allowUnloadRef.current = true;
      try {
        localStorage.removeItem(localKey(attemptId));
      } catch {
        /* ignore */
      }

      // AI scoring ONLY right after successful submit / timeout auto-submit.
      // Leave, abandon, refresh, or opening the result page must NOT call OpenAI.
      if ((isWriting || isSpeaking) && typeof data.aiScoreNonce === "string") {
        try {
          const nonce = data.aiScoreNonce as string;
          if (isWriting) {
            await fetch(`/api/practice/${attemptId}/ai-score`, {
              method: "POST",
              headers: { "x-wewin-ai-score-nonce": nonce },
            });
          } else {
            const blobs =
              speakingDeskRef.current?.getAudioBlobs() ?? new Map();
            const form = new FormData();
            for (const [num, blob] of blobs) {
              const ext = blob.type.includes("mp4")
                ? "mp4"
                : blob.type.includes("ogg")
                  ? "ogg"
                  : "webm";
              form.append(`audio_${num}`, blob, `q${num}.${ext}`);
            }
            // Always POST (even with empty FormData) to burn the one-time nonce
            // without leaving a reusable scoring token around.
            await fetch(`/api/practice/${attemptId}/ai-score`, {
              method: "POST",
              headers: { "x-wewin-ai-score-nonce": nonce },
              body: form,
            });
          }
        } catch (aiErr) {
          console.warn("[practice/ai-score]", aiErr);
        }
      }

      startNavProgress();
      router.push(data.redirect);
    } catch (e) {
      console.warn("[practice/submit]", e);
      setError(friendlyError(e, t("submitNetwork"), te));
      submittingRef.current = false;
      setSubmitting(false);
      setTestEnded(false);
      setEndedFromTimeout(false);
    }
  }

  async function confirmLeave() {
    if (leaving || submittingRef.current || allowUnloadRef.current) return;
    setLeaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice/${attemptId}/abandon`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          friendlyError(
            data.error,
            t("leaveFailed", "Could not end the attempt. Try again."),
            te,
          ),
        );
        setLeaving(false);
        return;
      }
      allowUnloadRef.current = true;
      try {
        localStorage.removeItem(localKey(attemptId));
      } catch {
        /* ignore */
      }
      const pending = leavePendingRef.current;
      leavePendingRef.current = null;
      setLeaveOpen(false);
      startNavProgress();
      if (pending?.href) {
        if (/^https?:\/\//i.test(pending.href)) {
          window.location.href = pending.href;
        } else {
          router.push(pending.href);
        }
      } else {
        // Browser back or unknown target — leave practice without re-entering the attempt.
        router.replace("/tests");
      }
    } catch (e) {
      console.warn("[practice/abandon]", e);
      setError(
        friendlyError(
          e,
          t("leaveFailed", "Could not end the attempt. Try again."),
          te,
        ),
      );
      setLeaving(false);
    }
  }

  function cancelLeave() {
    leavePendingRef.current = null;
    setLeaveOpen(false);
  }

  const part = sessionParts[activePart];
  const speakingCurrent = isSpeaking
    ? speakingQueue.find((it) => it.number === currentNumber) ??
      speakingQueue[0]
    : null;
  const speakingPartTitle = speakingCurrent
    ? t(
        `speakingPart${speakingCurrent.partKind}` as "speakingPart1",
        `Part ${speakingCurrent.partKind}`,
      )
    : null;
  const clipStart = parseTimestamp(part?.meta?.audiostart ?? part?.meta?.audioStart);
  const clipEnd = parseTimestamp(part?.meta?.audioend ?? part?.meta?.audioEnd);
  /** Prefer per-section audio on part.meta; else audioFiles[order]; else first file. */
  const audioSrc = (() => {
    if (!isListening) return undefined;
    const fromMeta = part?.meta?.audioUrl ?? part?.meta?.audio;
    if (typeof fromMeta === "string") return fromMeta.trim() || undefined;
    if (audioFiles?.length) {
      const byOrder = audioFiles[part?.order ?? activePart];
      if (byOrder) return byOrder;
      return audioFiles[0];
    }
    return undefined;
  })();
  const clock =
    secondsLeft == null
      ? null
      : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
          secondsLeft % 60,
        ).padStart(2, "0")}`;

  const submitLabel = isWriting
    ? t("submitWriting", "Submit writing")
    : isSpeaking
      ? t("endSpeaking", "Finish speaking practice")
      : t("submit", "Submit");

  const statusLine = (
    <>
      {retryWrong ? (
        <span className="mr-2 font-medium text-amber-200/90">
          {t("retryWrong", "Retry wrong answers")} ·
        </span>
      ) : null}
      {t("answered", {
        answered: answeredCount,
        total: allQuestions.length,
      }, "Answered {answered}/{total}")}
      <span className="ml-2 text-zinc-500">
        {saveState === "saving"
          ? t("saving", "· Saving…")
          : saveState === "saved"
            ? t("saved", "· Saved")
            : saveState === "error"
              ? t("localOnly", "· Not saved to server (still on this device)")
              : ""}
      </span>
    </>
  );

  const partTabs =
    !isSpeaking && sessionParts.length > 1 ? (
      <div className="mx-auto flex max-w-[1800px] min-w-0 gap-1 overflow-x-auto px-2 py-1.5 sm:px-3">
        {sessionParts.map((p, idx) => (
          <button
            type="button"
            key={`${p.order}-${idx}`}
            onClick={() => {
              setActivePart(idx);
              const first = p.questions[0]?.number;
              if (first != null) setCurrentNumber(first);
            }}
            className={`shrink-0 border px-3 py-1.5 text-xs font-semibold tracking-wide ${
              idx === activePart
                ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
                : "border-zinc-400 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span className="inline-flex max-w-[12rem] items-center gap-1.5 normal-case tracking-normal sm:max-w-[16rem]">
              <span className="tabular-nums opacity-90">
                {t("partShort", { n: idx + 1 }, "P{n}")}
              </span>
              {p.title?.trim() ? (
                <span className="line-clamp-1 font-medium">{p.title}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    ) : null;

  const toolbar =
    isListening && audioSrc ? (
      <AudioPlayer
        key={audioSrc}
        src={audioSrc}
        clipStart={clipStart}
        clipEnd={clipEnd}
        compact
        label={
          part
            ? `${t("audioPart", "Audio")} · ${part.title}`
            : t("audioPart", "Audio")
        }
      />
    ) : null;

  const footer =
    isSpeaking ? null : isLr && navQuestions.length > 0 ? (
      <QuestionNavigator
        questions={navQuestions}
        answers={answers}
        flagged={flagged}
        currentNumber={currentNumber}
        onSelect={goToQuestion}
        onToggleFlag={toggleFlag}
        onPrev={() => goRelative(-1)}
        onNext={() => goRelative(1)}
        showReview
        groupByPart={shouldRenumber || sessionParts.length > 1}
      />
    ) : isWriting ? (
      <QuestionNavigator
        questions={navQuestions}
        answers={answers}
        flagged={flagged}
        currentNumber={currentNumber}
        onSelect={goToQuestion}
        onToggleFlag={toggleFlag}
        onPrev={() => goRelative(-1)}
        onNext={() => goRelative(1)}
        showReview={false}
        groupByPart
      />
    ) : null;

  return (
    <>
      <CdiExamShell
        skillLabel={skillLabel}
        testTitle={testTitle}
        partTitle={isSpeaking ? speakingPartTitle : part?.title}
        statusLine={statusLine}
        clock={clock}
        secondsLeft={secondsLeft}
        submitLabel={submitLabel}
        submitting={submitting}
        onSubmitClick={() => void submit()}
        toolbar={toolbar}
        toolbarAfterTabs={isListening}
        partTabs={partTabs}
        footer={footer}
      >
        {error ? (
          <div className="mb-2">
            <FriendlyErrorAlert message={error.message} detail={error.detail} />
          </div>
        ) : null}

        {isLr && part && (part.questions.length > 0 || Boolean(part.content)) ? (
          <ReadingOrNotesSplit
            part={part}
            isReading={isReading}
            skill={skill}
            answers={answers}
            currentNumber={currentNumber}
            questionRefs={questionRefs}
            onFocusQuestion={setCurrentNumber}
            onChange={setAnswer}
            onPatchAnswers={patchAnswers}
            highlights={highlights.filter((item) => item.partOrder === part.order)}
            onHighlightsChange={(next) => {
              setHighlights((prev) => [
                ...prev.filter((item) => item.partOrder !== part.order),
                ...next,
              ]);
            }}
          />
        ) : isWriting && part ? (
          <WritingDesk
            part={part}
            answers={answers}
            currentNumber={currentNumber}
            questionRefs={questionRefs}
            onFocusQuestion={setCurrentNumber}
            onChange={setAnswer}
            skill={skill}
          />
        ) : isSpeaking && !speakingMicReady ? (
          <SpeakingMicSetup
            attemptId={attemptId}
            startPartLabel={
              speakingQueue[0]
                ? t(
                    `speakingPart${speakingQueue[0].partKind}` as "speakingPart1",
                    `Part ${speakingQueue[0].partKind}`,
                  )
                : undefined
            }
            onReady={() => setSpeakingMicReady(true)}
          />
        ) : isSpeaking ? (
          <SpeakingExamDesk
            ref={speakingDeskRef}
            items={speakingQueue}
            answers={answers}
            onAnswer={setAnswer}
            onFocusQuestion={setCurrentNumber}
            onRequestSubmit={() => void submit()}
          />
        ) : (
          <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-white">
            <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold text-zinc-800">
              {part?.title?.trim()
                ? part.title
                : t("partShort", { n: activePart + 1 }, "P{n}")}
            </div>
            <div className="space-y-5 p-3 sm:p-4">
              {clusterSharedChoices(
                (part?.questions ?? []).filter(
                  (q) => !isPairedSatellite(q.content),
                ),
              ).map((block) =>
                block.kind === "single" ? (
                  <div
                    key={block.question.number}
                    ref={(el) => {
                      const covers = getCoveredNumbers(
                        block.question.number,
                        block.question.content,
                      );
                      for (const n of covers) {
                        if (el) questionRefs.current.set(n, el);
                        else questionRefs.current.delete(n);
                      }
                    }}
                    onFocusCapture={() =>
                      setCurrentNumber(block.question.number)
                    }
                  >
                    <QuestionInput
                      question={block.question}
                      skill={skill}
                      answers={answers}
                      onChange={(v) => setAnswer(block.question.number, v)}
                      onPatchAnswers={patchAnswers}
                      active={
                        currentNumber != null &&
                        getCoveredNumbers(
                          block.question.number,
                          block.question.content,
                        ).includes(currentNumber)
                      }
                    />
                  </div>
                ) : (
                  <SharedChoiceAnswers
                    key={`bank-${block.questions[0]!.number}`}
                    questions={block.questions}
                    answers={answers}
                    onChange={setAnswer}
                    currentNumber={currentNumber}
                    questionRefs={questionRefs}
                    onFocusQuestion={setCurrentNumber}
                  />
                ),
              )}
            </div>
          </div>
        )}
      </CdiExamShell>

      <SubmitConfirmDialog
        open={confirmOpen}
        unanswered={unansweredCount}
        total={allQuestions.length}
        submitLabel={submitLabel}
        submitting={submitting}
        onConfirm={() => void doSubmit()}
        onCancel={() => setConfirmOpen(false)}
        onReviewUnanswered={isLr ? reviewFirstUnanswered : undefined}
      />
      <LeaveConfirmDialog
        open={leaveOpen}
        leaving={leaving}
        onConfirm={() => void confirmLeave()}
        onCancel={cancelLeave}
      />
      <TestEndedOverlay visible={testEnded} fromTimeout={endedFromTimeout} />
    </>
  );
}

function WritingDesk({
  part,
  answers,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  onChange,
  skill,
}: {
  part: Part;
  answers: Record<string, string>;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  onChange: (num: number, value: string) => void;
  skill: string;
}) {
  const { t } = useTranslations("practice");
  const q =
    part.questions.find((x) => x.number === currentNumber) ?? part.questions[0];
  if (!q) return null;
  const value = answers[String(q.number)] ?? "";
  const rawStem = q.content.stem ?? part.content ?? "";
  const stem = formatQuestionStem(rawStem, q.number);
  const blocks = splitWritingPrompt(stem || rawStem);
  const minWords = defaultMinWords(q, skill);
  const words = countWords(value);
  const ok = minWords > 0 && words >= minWords;
  const isGeneralLetter = q.content.variant === "WRITING_GENERAL_LETTER";
  const imageUrl =
    (typeof q.content.imageUrl === "string" && q.content.imageUrl.trim()) ||
    (typeof q.mediaUrl === "string" && q.mediaUrl.trim()) ||
    (typeof part.meta?.imageUrl === "string" && String(part.meta.imageUrl).trim()) ||
    "";

  return (
    <div className="cdi-split grid min-h-[70vh] min-w-0 flex-1 gap-0 lg:grid-cols-2">
      <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-[#f7f8fa] lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
          {part.title?.trim()
            ? part.title
            : t("writingTask", "Writing task")}
        </div>
        <div className="space-y-3 p-3 sm:p-4">
          {part.questions.length > 1 ? (
            <div className="flex flex-wrap gap-1">
              {part.questions.map((item) => (
                <button
                  type="button"
                  key={item.number}
                  onClick={() => onFocusQuestion(item.number)}
                  className={`border px-2.5 py-1 text-xs font-semibold ${
                    item.number === q.number
                      ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
                      : "border-zinc-400 bg-white text-zinc-700"
                  }`}
                >
                  {t("taskN", { n: item.number }, "Task {n}")}
                </button>
              ))}
            </div>
          ) : null}

          {isGeneralLetter ? (
            <p className="rounded-sm border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-[#1a3a6b]">
              {t("generalLetterTask", "General Training · Letter")}
            </p>
          ) : null}

          {blocks.timeLine ? (
            <p className="rounded-sm border border-zinc-300 bg-white px-3 py-2 text-base font-bold leading-relaxed text-zinc-900">
              {blocks.timeLine}
            </p>
          ) : null}

          {imageUrl ? (
            <>
              {blocks.beforeImage.length > 0 ? (
                <div className="rounded-sm border border-zinc-400 border-l-[3px] border-l-[#1a3a6b] bg-white px-3 py-3 text-base font-bold leading-relaxed text-zinc-900">
                  {blocks.beforeImage.map((line, i) => (
                    <p
                      key={`b-${i}-${line.slice(0, 24)}`}
                      className="mb-2 break-words last:mb-0"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
              <figure className="overflow-hidden rounded-sm border-2 border-zinc-500 bg-white shadow-sm">
                <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  {t("writingDiagram", "Diagram / figure")}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={t("writingDiagram", "Diagram / figure")}
                  className="mx-auto h-auto max-h-[min(32rem,60dvh)] w-auto max-w-full object-contain bg-white p-3 sm:p-4"
                />
              </figure>
              {blocks.afterImage.length > 0 ? (
                <div className="rounded-sm border border-zinc-400 bg-white px-3 py-3 text-base font-bold leading-relaxed text-zinc-900">
                  {blocks.afterImage.map((line, i) => (
                    <p
                      key={`a-${i}-${line.slice(0, 24)}`}
                      className="mb-2 break-words last:mb-0"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : blocks.promptLines.length > 0 ? (
            <div className="rounded-sm border border-zinc-400 border-l-[3px] border-l-[#1a3a6b] bg-white px-3 py-3 text-base font-bold leading-relaxed text-zinc-900">
              {blocks.promptLines.map((line, i) => (
                <p
                  key={`p-${i}-${line.slice(0, 24)}`}
                  className="mb-2 break-words last:mb-0"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : stem ? (
            <div className="break-words whitespace-pre-wrap rounded-sm border border-zinc-400 bg-white px-3 py-3 text-base font-bold leading-relaxed text-zinc-900">
              {renderRichText(stem, `writing-stem-${q.number}`)}
            </div>
          ) : null}

          {blocks.wordLine ? (
            <p className="rounded-sm border border-dashed border-zinc-400 bg-white px-3 py-2 text-base font-bold leading-relaxed text-zinc-900">
              {blocks.wordLine}
            </p>
          ) : null}
        </div>
      </div>
      <div
        ref={(el) => {
          if (el) questionRefs.current.set(q.number, el);
          else questionRefs.current.delete(q.number);
        }}
        className="cdi-pane flex min-w-0 flex-col border border-t-0 border-zinc-400/70 bg-white lg:border-t lg:border-l-0 lg:max-h-[calc(100vh-11rem)]"
      >
        <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
          {t("writingAnswer", "Your answer")}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(q.number, e.target.value)}
          onFocus={() => onFocusQuestion(q.number)}
          placeholder={t("writingPlaceholder", "Write your essay…")}
          className="min-h-[16rem] w-full min-w-0 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-sm leading-relaxed text-zinc-900 outline-none sm:px-4"
        />
        <p
          className={`border-t border-zinc-300 px-3 py-2 text-xs font-medium tabular-nums sm:px-4 ${
            ok
              ? "bg-[#eceff2] text-zinc-800"
              : minWords > 0 && words > 0
                ? "bg-amber-50 text-amber-900"
                : "bg-[#eceff2] text-zinc-600"
          }`}
        >
          {t("wordCount", {
            count: words,
            min: minWords || 0,
          }, "{count} words · minimum {min}")}
        </p>
      </div>
    </div>
  );
}
