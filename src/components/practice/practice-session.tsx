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
  TestEndedOverlay,
} from "@/components/practice/submit-confirm-dialog";
import { countWords } from "@/lib/scoring";
import { friendlyError } from "@/lib/ui/friendly-error";
import {
  formatQuestionStem,
  isBlankQuestionType,
  isRedundantGapStem,
} from "@/lib/ui/question-type-label";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { useTranslations } from "@/i18n/provider";

type Question = {
  number: number;
  type: string;
  content: {
    stem?: string;
    options?: { label: string; text: string }[];
    minWords?: number;
    hint?: string;
    sample?: string;
  };
};

type Part = {
  title: string;
  order: number;
  content?: string;
  meta?: Record<string, unknown>;
  questions: Question[];
};

type Props = {
  attemptId: string;
  testTitle: string;
  skill: string;
  timeLimitMinutes: number | null;
  startedAt: string;
  initialAnswers: Record<string, string>;
  parts: Part[];
  audioFiles?: string[];
  /** Filtered attempt containing only previously wrong questions */
  retryWrong?: boolean;
};

const SAVE_DEBOUNCE_MS = 700;

function localKey(attemptId: string) {
  return `wewin-attempt:${attemptId}`;
}

function remainingSeconds(
  startedAt: string,
  timeLimitMinutes: number | null,
): number | null {
  if (!timeLimitMinutes) return null;
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  return Math.max(0, timeLimitMinutes * 60 - elapsed);
}

export function PracticeSession({
  attemptId,
  testTitle,
  skill,
  timeLimitMinutes,
  startedAt,
  initialAnswers,
  parts,
  audioFiles,
  retryWrong = false,
}: Props) {
  const router = useRouter();
  const { t } = useTranslations("practice");
  const ts = useTranslations("skills").t;
  const te = useTranslations("errors").t;
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [activePart, setActivePart] = useState(0);
  const [currentNumber, setCurrentNumber] = useState<number | null>(
    () => parts[0]?.questions[0]?.number ?? null,
  );
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    remainingSeconds(startedAt, timeLimitMinutes),
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [testEnded, setTestEnded] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const hydrated = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());

  const isReading = skill === "READING";
  const isListening = skill === "LISTENING";
  const isWriting = skill === "WRITING";
  const isSpeaking = skill === "SPEAKING";
  const isLr = isReading || isListening;
  const audioSrc = audioFiles?.[0];
  const skillLabel = ts(skill, skill);

  const navQuestions: NavQuestion[] = useMemo(
    () =>
      parts.flatMap((p, partIndex) =>
        p.questions.map((q) => ({ number: q.number, partIndex })),
      ),
    [parts],
  );
  const allQuestions = useMemo(
    () => navQuestions.map((q) => q.number),
    [navQuestions],
  );
  const answeredCount = allQuestions.filter(
    (n) => (answers[String(n)] ?? "").trim() !== "",
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
        savedAt?: string;
      };
      if (parsed.answers && Object.keys(parsed.answers).length > 0) {
        setAnswers((prev) => {
          const serverKeys = Object.keys(prev).filter((k) => (prev[k] ?? "").trim());
          const localKeys = Object.keys(parsed.answers!).filter(
            (k) => (parsed.answers![k] ?? "").trim(),
          );
          if (localKeys.length >= serverKeys.length) return parsed.answers!;
          return { ...parsed.answers, ...prev };
        });
      }
      if (Array.isArray(parsed.flagged)) {
        setFlagged(new Set(parsed.flagged.filter((n) => Number.isFinite(n))));
      }
    } catch {
      /* ignore */
    }
    hydrated.current = true;
  }, [attemptId]);

  const persistDraft = useCallback(
    async (next: Record<string, string>, nextFlagged?: Set<number>) => {
      const flags = nextFlagged ?? flagged;
      try {
        localStorage.setItem(
          localKey(attemptId),
          JSON.stringify({
            answers: next,
            flagged: Array.from(flags),
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
          body: JSON.stringify({ answers: next }),
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
      void persistDraft(answers);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [answers, persistDraft]);

  useEffect(() => {
    if (secondsLeft == null) return;
    if (secondsLeft <= 0) {
      void submit(true);
      return;
    }
    const timer = setTimeout(
      () => setSecondsLeft((s) => (s == null ? s : s - 1)),
      1000,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function setAnswer(num: number, value: string) {
    setAnswers((prev) => ({ ...prev, [String(num)]: value }));
    setCurrentNumber(num);
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
    const first = allQuestions.find(
      (n) => (answers[String(n)] ?? "").trim() === "",
    );
    setConfirmOpen(false);
    if (first != null) goToQuestion(first);
  }

  async function submit(fromTimer = false) {
    if (submitting) return;
    if (!fromTimer) {
      setConfirmOpen(true);
      return;
    }
    await doSubmit();
  }

  async function doSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setConfirmOpen(false);
    setError(null);
    setTestEnded(true);
    try {
      const res = await fetch(`/api/practice/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        const mapped = friendlyError(data.error, t("submitFailed"), te);
        if (data.error) console.warn("[practice/submit]", data.error);
        setError(mapped);
        setSubmitting(false);
        setTestEnded(false);
        return;
      }
      try {
        localStorage.removeItem(localKey(attemptId));
      } catch {
        /* ignore */
      }
      router.push(data.redirect);
    } catch (e) {
      console.warn("[practice/submit]", e);
      setError(friendlyError(e, t("submitNetwork"), te));
      setSubmitting(false);
      setTestEnded(false);
    }
  }

  const part = parts[activePart];
  const clipStart = parseTimestamp(part?.meta?.audiostart ?? part?.meta?.audioStart);
  const clipEnd = parseTimestamp(part?.meta?.audioend ?? part?.meta?.audioEnd);
  const showContentPanel =
    Boolean(part?.content) && isLr && !isWriting && !isSpeaking;

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
    parts.length > 1 ? (
      <div className="mx-auto flex max-w-[1400px] min-w-0 gap-1 overflow-x-auto px-2 py-1.5 sm:px-3">
        {parts.map((p, idx) => (
          <button
            type="button"
            key={p.order}
            onClick={() => {
              setActivePart(idx);
              const first = p.questions[0]?.number;
              if (first != null) setCurrentNumber(first);
            }}
            className={`shrink-0 border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              idx === activePart
                ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
                : "border-zinc-400 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span className="line-clamp-1 max-w-[10rem] normal-case tracking-normal sm:max-w-[14rem]">
              {p.title}
            </span>
          </button>
        ))}
      </div>
    ) : null;

  const toolbar =
    isListening && audioSrc ? (
      <AudioPlayer
        src={audioSrc}
        clipStart={clipStart}
        clipEnd={clipEnd}
        compact
        label={part ? `${t("audioPart", "Audio")} · ${part.title}` : undefined}
      />
    ) : null;

  const footer =
    isLr && navQuestions.length > 0 ? (
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
      />
    ) : isWriting || isSpeaking ? (
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
      />
    ) : null;

  return (
    <>
      <CdiExamShell
        skillLabel={skillLabel}
        testTitle={testTitle}
        partTitle={part?.title}
        statusLine={statusLine}
        clock={clock}
        secondsLeft={secondsLeft}
        submitLabel={submitLabel}
        submitting={submitting}
        onSubmitClick={() => void submit(false)}
        toolbar={toolbar}
        partTabs={partTabs}
        footer={footer}
      >
        {error ? (
          <div className="mb-2">
            <FriendlyErrorAlert message={error.message} detail={error.detail} />
          </div>
        ) : null}

        {showContentPanel && part?.content ? (
          <div className="cdi-split grid min-h-0 min-w-0 flex-1 gap-0 lg:grid-cols-2 lg:items-stretch">
            <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-[#f7f8fa] lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
              <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
                {isReading
                  ? t("passage", "Passage")
                  : t("notes", "Notes / task text")}
              </div>
              <div className="break-words px-3 py-3 text-sm leading-relaxed whitespace-pre-wrap text-zinc-800 sm:px-4">
                {isReading ? passageOnly(part.content) : part.content}
              </div>
            </div>
            <div className="cdi-pane min-w-0 border border-t-0 border-zinc-400/70 bg-white lg:border-t lg:border-l-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
              <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold text-zinc-800">
                {part.title}
              </div>
              <div className="space-y-5 p-3 sm:p-4">
                {part.questions.map((q) => (
                  <div
                    key={q.number}
                    ref={(el) => {
                      if (el) questionRefs.current.set(q.number, el);
                      else questionRefs.current.delete(q.number);
                    }}
                    data-q={q.number}
                    className={
                      currentNumber === q.number
                        ? "rounded-sm ring-2 ring-[#1a3a6b]/35 ring-offset-1"
                        : undefined
                    }
                    onFocusCapture={() => setCurrentNumber(q.number)}
                  >
                    <QuestionInput
                      question={q}
                      skill={skill}
                      value={answers[String(q.number)] ?? ""}
                      onChange={(v) => setAnswer(q.number, v)}
                      compactStem={Boolean(part.content)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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
        ) : (
          <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-white">
            <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold text-zinc-800">
              {part?.title}
            </div>
            <div className="space-y-5 p-3 sm:p-4">
              {part?.questions.map((q) => (
                <div
                  key={q.number}
                  ref={(el) => {
                    if (el) questionRefs.current.set(q.number, el);
                    else questionRefs.current.delete(q.number);
                  }}
                  className={
                    currentNumber === q.number
                      ? "rounded-sm ring-2 ring-[#1a3a6b]/35 ring-offset-1"
                      : undefined
                  }
                  onFocusCapture={() => setCurrentNumber(q.number)}
                >
                  <QuestionInput
                    question={q}
                    skill={skill}
                    value={answers[String(q.number)] ?? ""}
                    onChange={(v) => setAnswer(q.number, v)}
                  />
                </div>
              ))}
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
      <TestEndedOverlay visible={testEnded} />
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
  const stem = formatQuestionStem(q.content.stem ?? "", q.number);
  const minWords = defaultMinWords(q, skill);
  const words = countWords(value);
  const ok = minWords > 0 && words >= minWords;

  return (
    <div className="cdi-split grid min-h-[70vh] min-w-0 flex-1 gap-0 lg:grid-cols-2">
      <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-[#f7f8fa] lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
        <div className="sticky top-0 z-[1] border-b border-zinc-300 bg-[#eceff2] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-700">
          {t("writingTask", "Writing task")}
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
          {stem ? (
            <div className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
              {stem}
            </div>
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

function passageOnly(content: string): string {
  const idx = content.search(/\nQuestions?\s+\d+/i);
  if (idx > 80) return content.slice(0, idx).trim();
  return content;
}

function defaultMinWords(question: Question, skill: string): number {
  if (typeof question.content.minWords === "number") return question.content.minWords;
  if (question.type !== "ESSAY" && skill !== "WRITING") return 0;
  return question.number === 1 ? 150 : 250;
}

function QuestionInput({
  question,
  skill,
  value,
  onChange,
  compactStem = false,
}: {
  question: Question;
  skill: string;
  value: string;
  onChange: (v: string) => void;
  /**
   * Render contract: when part.content already shows notes/passage with
   * numbered blanks, the answer panel is number + input (+ MCQ options).
   * Never reprint notes fragments. Empty/minimal stems from import are the
   * primary fix; isRedundantGapStem is a safety net for older data.
   */
  compactStem?: boolean;
}) {
  const { t } = useTranslations("practice");
  const options = question.content.options ?? [];
  const rawStem = question.content.stem ?? "";
  const stem = formatQuestionStem(rawStem, question.number);
  const isEssay = question.type === "ESSAY";
  const isSpeaking = question.type === "SPEAKING_PROMPT";
  const isBlank = isBlankQuestionType(question.type);
  const minWords = defaultMinWords(question, skill);
  const words = countWords(value);
  const hint = question.content.hint;
  const hideBesideNotes =
    compactStem &&
    isBlank &&
    options.length < 2 &&
    (/_____/.test(stem) ||
      isRedundantGapStem(rawStem) ||
      isRedundantGapStem(stem));
  const showStem = Boolean(stem) && !hideBesideNotes;

  if (isEssay) {
    const ok = minWords > 0 && words >= minWords;
    return (
      <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <p className="mb-2 text-sm font-medium text-zinc-900">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-sm bg-[#e8eaed] text-xs font-semibold text-zinc-800">
            {question.number}
          </span>
          {t("writingTask", "Writing task")}
        </p>
        {stem && (
          <div className="mb-3 break-words whitespace-pre-wrap border border-zinc-300 border-l-[3px] border-l-[#1a3a6b] bg-[#f7f8fa] px-3 py-3 text-sm text-zinc-800">
            {stem}
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={14}
          placeholder={t("writingPlaceholder", "Write your essay…")}
          className="w-full min-w-0 rounded-sm border border-zinc-400 px-3 py-2 text-sm leading-relaxed"
        />
        <p
          className={`mt-2 text-xs font-medium ${
            ok
              ? "text-zinc-800"
              : minWords > 0 && words > 0
                ? "text-amber-800"
                : "text-zinc-500"
          }`}
        >
          {t("wordCount", {
            count: words,
            min: minWords || 0,
          }, "{count} words · minimum {min}")}
        </p>
      </div>
    );
  }

  if (isSpeaking) {
    return (
      <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
        <p className="mb-2 text-sm font-medium text-zinc-900">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-sm bg-[#e8eaed] text-xs font-semibold text-zinc-800">
            {question.number}
          </span>
          {t("speakingPrompt", "Speaking prompt")}
        </p>
        {stem && (
          <div className="mb-3 break-words whitespace-pre-wrap border border-zinc-300 border-l-[3px] border-l-[#1a3a6b] bg-[#f7f8fa] px-3 py-3 text-sm text-zinc-800">
            {stem}
          </div>
        )}
        {hint ? (
          <details className="mb-3 border border-dashed border-zinc-400 bg-[#f7f8fa] px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-zinc-800">
              {t("sampleHint", "Tips / sample (if any)")}
            </summary>
            <p className="mt-2 break-words whitespace-pre-wrap text-zinc-600">
              {hint}
            </p>
          </details>
        ) : null}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder={t("notesPlaceholder", "Self-study notes…")}
          className="w-full min-w-0 rounded-sm border border-zinc-400 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">
          {t("speakingNote", "Speak from the prompt… No AI scoring.")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
      <div className="mb-2 flex min-w-0 items-start gap-2">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#e8eaed] text-xs font-semibold text-zinc-800">
          {question.number}
        </span>
        {showStem ? (
          <p className="min-w-0 flex-1 break-words whitespace-pre-wrap pt-0.5 text-sm text-zinc-700">
            {stem}
          </p>
        ) : null}
      </div>

      {options.length >= 2 ? (
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.label}
              className={`flex min-w-0 cursor-pointer items-start gap-2 border px-3 py-2 text-sm ${
                value === opt.label
                  ? "border-[#1a3a6b] bg-[#eef2f7]"
                  : "border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <input
                type="radio"
                name={`q-${question.number}`}
                className="mt-0.5 shrink-0"
                checked={value === opt.label}
                onChange={() => onChange(opt.label)}
              />
              <span className="min-w-0 break-words">
                <strong className="mr-1">{opt.label}.</strong>
                {opt.text}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("answerPlaceholder", "Enter answer…")}
          aria-label={t("answerPlaceholder", "Enter answer…")}
          className="w-full max-w-md min-w-0 rounded-sm border border-zinc-400 px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
