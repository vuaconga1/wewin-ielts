"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslations } from "@/i18n/provider";
import {
  isSpeakingAnswered,
  speakingAnswerMark,
  speakingTimingFor,
  type SpeakingExamItem,
} from "@/lib/practice/speaking-exam";
import { isMicBlockedByPermissionsPolicy } from "@/components/practice/speaking-mic-setup";

type Phase = "prep" | "recording" | "done";

export type SpeakingExamDeskHandle = {
  /** In-memory recordings keyed by question number (for AI upload). */
  getAudioBlobs: () => Map<number, Blob>;
};

type Props = {
  items: SpeakingExamItem[];
  answers: Record<string, string>;
  onAnswer: (number: number, value: string) => void;
  onRequestSubmit: () => void;
  /** Optional: parent tracks current question for status. */
  onFocusQuestion?: (number: number) => void;
};

function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export const SpeakingExamDesk = forwardRef<SpeakingExamDeskHandle, Props>(
  function SpeakingExamDesk(
    { items, answers, onAnswer, onRequestSubmit, onFocusQuestion },
    ref,
  ) {
  const { t } = useTranslations("practice");

  const firstUnanswered = items.findIndex(
    (it) => !isSpeakingAnswered(answers[String(it.number)]),
  );
  const startIndex = firstUnanswered >= 0 ? firstUnanswered : 0;
  const startItem = items[startIndex];
  const startTiming = startItem
    ? speakingTimingFor(startItem.partKind)
    : null;

  const [index, setIndex] = useState(startIndex);
  const [phase, setPhase] = useState<Phase>("prep");
  const [phaseLeft, setPhaseLeft] = useState(startTiming?.prepSec ?? 0);
  const [notes, setNotes] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobUrlByNumberRef = useRef<Map<number, string>>(new Map());
  const blobByNumberRef = useRef<Map<number, Blob>>(new Map());
  const recordingStartedAtRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    getAudioBlobs: () => new Map(blobByNumberRef.current),
  }));
  const advancingRef = useRef(false);
  const [advancing, setAdvancing] = useState(false);
  const phaseTransitionRef = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  const item = items[index] ?? null;
  const timing = item ? speakingTimingFor(item.partKind) : null;
  const total = items.length;
  const answeredCount = items.filter((it) =>
    isSpeakingAnswered(answers[String(it.number)]),
  ).length;
  const isLast = index >= total - 1;

  const stopTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((tr) => tr.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopRecorder = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      if (!rec || rec.state === "inactive") {
        resolve(null);
        return;
      }
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm";
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: mime })
            : null;
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        stopTracks();
        setRecording(false);
        resolve(blob);
      };
      try {
        rec.stop();
      } catch {
        mediaRecorderRef.current = null;
        stopTracks();
        setRecording(false);
        resolve(null);
      }
    });
  }, [stopTracks]);

  const startRecorder = useCallback(async () => {
    setMicError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError(
        t(
          "speakingMicUnsupported",
          "Recording is not supported in this browser.",
        ),
      );
      setRecording(false);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMimeType();
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(250);
      recordingStartedAtRef.current = Date.now();
      setRecording(true);
      return true;
    } catch (err) {
      setMicError(
        isMicBlockedByPermissionsPolicy(err)
          ? t(
              "speakingMicPolicyBlocked",
              "This page blocked the microphone via Permissions-Policy. That restriction is fixed — hard-refresh (Ctrl+Shift+R), then try again.",
            )
          : t(
              "speakingMicDenied",
              "Microphone access denied. Allow the mic, then continue.",
            ),
      );
      setRecording(false);
      return false;
    }
  }, [t]);

  // Boot first item prep timer
  useEffect(() => {
    const boot = items[startIndex];
    if (!boot) {
      setReady(true);
      return;
    }
    const bootTiming = speakingTimingFor(boot.partKind);
    setPhase("prep");
    setPhaseLeft(bootTiming.prepSec);
    setNotes("");
    setReplayUrl(blobUrlByNumberRef.current.get(boot.number) ?? null);
    onFocusQuestion?.(boot.number);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      void stopRecorder();
      stopTracks();
      for (const url of blobUrlByNumberRef.current.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      }
      blobUrlByNumberRef.current.clear();
      blobByNumberRef.current.clear();
    };
  }, [stopRecorder, stopTracks]);

  const saveAndAdvance = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    const current = items[indexRef.current];
    if (!current) {
      advancingRef.current = false;
      setAdvancing(false);
      return;
    }

    let durationSec = 0;
    if (recordingStartedAtRef.current != null) {
      durationSec = (Date.now() - recordingStartedAtRef.current) / 1000;
    }
    recordingStartedAtRef.current = null;

    const blob = await stopRecorder();
    if (blob && blob.size > 0) {
      const prevUrl = blobUrlByNumberRef.current.get(current.number);
      if (prevUrl) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch {
          /* ignore */
        }
      }
      const url = URL.createObjectURL(blob);
      blobUrlByNumberRef.current.set(current.number, url);
      blobByNumberRef.current.set(current.number, blob);
      setReplayUrl(url);
    }

    onAnswer(
      current.number,
      speakingAnswerMark({
        durationSec,
        partKind: current.partKind,
      }),
    );

    const nextIdx = indexRef.current + 1;
    if (nextIdx >= items.length) {
      setPhase("done");
      setPhaseLeft(0);
      advancingRef.current = false;
      setAdvancing(false);
      onRequestSubmit();
      return;
    }

    const next = items[nextIdx]!;
    const nextTiming = speakingTimingFor(next.partKind);
    setIndex(nextIdx);
    setPhase("prep");
    setPhaseLeft(nextTiming.prepSec);
    setNotes("");
    setMicError(null);
    setReplayUrl(blobUrlByNumberRef.current.get(next.number) ?? null);
    onFocusQuestion?.(next.number);
    phaseTransitionRef.current = false;
    advancingRef.current = false;
    setAdvancing(false);
  }, [items, onAnswer, onFocusQuestion, onRequestSubmit, stopRecorder]);

  const beginRecordingPhase = useCallback(async () => {
    if (!item || !timing) return;
    if (phaseTransitionRef.current) return;
    phaseTransitionRef.current = true;
    setPhase("recording");
    setPhaseLeft(timing.answerSec);
    await startRecorder();
    phaseTransitionRef.current = false;
  }, [item, startRecorder, timing]);

  // Phase countdown
  useEffect(() => {
    if (!ready) return;
    if (!item || !timing) return;
    if (phase === "done") return;

    if (phaseLeft > 0) {
      const timer = setTimeout(() => {
        setPhaseLeft((s) => s - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // phaseLeft === 0
    if (phase === "prep") {
      void beginRecordingPhase();
      return;
    }
    if (phase === "recording") {
      void saveAndAdvance();
    }
  }, [
    ready,
    phase,
    phaseLeft,
    item,
    timing,
    beginRecordingPhase,
    saveAndAdvance,
  ]);

  if (!item || !timing || total === 0) {
    return (
      <div className="cdi-pane min-w-0 border border-zinc-400/70 bg-white p-4 text-sm text-zinc-600">
        {t(
          "speakingEmptyStem",
          "No prompt text for this question — check the topic section above if available.",
        )}
      </div>
    );
  }

  const partLabel = t(
    `speakingPart${item.partKind}` as "speakingPart1",
    item.partKind === 1
      ? "Part 1"
      : item.partKind === 2
        ? "Part 2"
        : "Part 3",
  );

  const phaseLabel =
    phase === "prep"
      ? t("speakingPhasePrep", "Preparation")
      : phase === "recording"
        ? t("speakingPhaseRecording", "Recording")
        : t("speakingPhaseDone", "Done");

  const micStatus = recording
    ? t("speakingMicRecording", "Microphone: recording")
    : phase === "prep"
      ? t("speakingMicOff", "Microphone: off")
      : micError
        ? t("speakingMicError", "Microphone: unavailable")
        : t("speakingMicOff", "Microphone: off");

  const packLabel =
    items.filter((it) => it.packIndex === item.packIndex).length > 0
      ? t(
          "speakingSetProgress",
          {
            n: item.packIndex + 1,
            total: Math.max(...items.map((it) => it.packIndex)) + 1,
          },
          "Set {n}/{total}",
        )
      : null;

  const qInPart =
    items.filter(
      (it) => it.packIndex === item.packIndex && it.partKind === item.partKind,
    ).length;
  const qIndexInPart =
    items
      .filter(
        (it) => it.packIndex === item.packIndex && it.partKind === item.partKind,
      )
      .findIndex((it) => it.number === item.number) + 1;

  const showNotes = timing.allowNotes;
  const notesEditable = phase === "prep" && timing.allowNotes;

  return (
    <div className="cdi-pane mx-auto flex w-full max-w-3xl min-w-0 flex-col border border-zinc-400/70 bg-white shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-300 bg-[#eceff2] px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {packLabel ? `${packLabel} · ` : null}
            {partLabel}
          </p>
          <p className="text-xs font-medium text-zinc-700">
            {t(
              "speakingQuestionProgress",
              {
                current: qIndexInPart,
                total: qInPart,
                overall: index + 1,
                overallTotal: total,
              },
              "Question {current}/{total} · {overall}/{overallTotal} overall",
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-sm border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              phase === "recording"
                ? "border-red-700 bg-red-700 text-white"
                : phase === "prep"
                  ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
                  : "border-zinc-400 bg-zinc-100 text-zinc-700"
            }`}
          >
            {phaseLabel}
          </span>
          <span
            className={`min-w-[4.5rem] border px-2.5 py-1 text-center font-mono text-base font-bold tabular-nums ${
              phase === "recording"
                ? "border-red-300 bg-[#fff5f5] text-red-800"
                : "border-[#1a3a6b]/40 bg-white text-[#1a3a6b]"
            }`}
            aria-live="polite"
            aria-label={t("speakingPhaseTimer", "Phase time remaining")}
          >
            {formatMmSs(phaseLeft)}
          </span>
        </div>
      </div>

      <div className="space-y-4 px-3 py-4 sm:px-5 sm:py-6">
        {item.topic ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {item.topic}
          </p>
        ) : null}

        <div
          className={`rounded-sm border border-zinc-400 border-l-[3px] border-l-[#1a3a6b] bg-[#f7f8fa] px-3 py-4 text-base leading-relaxed text-zinc-900 sm:px-4 sm:text-[17px] ${
            item.partKind === 2 ? "whitespace-pre-wrap" : "break-words"
          }`}
        >
          {item.stem}
        </div>

        {phase === "prep" ? (
          <p className="text-sm text-zinc-600">
            {timing.allowNotes
              ? t(
                  "speakingPrepWithNotes",
                  "Prepare your answer. You may take notes. Recording starts automatically when time is up.",
                )
              : t(
                  "speakingPrepNoNotes",
                  "Read the question. No notes. The microphone will start automatically when preparation ends.",
                )}
          </p>
        ) : null}

        {phase === "recording" ? (
          <p className="text-sm font-medium text-red-800">
            {t(
              "speakingAnswerNow",
              "Speak now. Press Next when you finish, or wait until time is up.",
            )}
          </p>
        ) : null}

        {showNotes ? (
          <div className="min-w-0">
            <label
              htmlFor="speaking-notes"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-600"
            >
              {t("speakingNotes", "Notes")}
              {!notesEditable ? (
                <span className="ml-1 font-normal normal-case tracking-normal text-zinc-500">
                  ({t("speakingNotesReadOnly", "read-only while speaking")})
                </span>
              ) : null}
            </label>
            <textarea
              id="speaking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              readOnly={!notesEditable}
              rows={5}
              placeholder={
                notesEditable
                  ? t(
                      "speakingNotesPlaceholder",
                      "Jot key points here (prep only)…",
                    )
                  : undefined
              }
              className={`w-full min-w-0 resize-y rounded-sm border px-3 py-2 text-sm leading-relaxed outline-none ${
                notesEditable
                  ? "border-zinc-400 bg-white text-zinc-900 focus:border-[#1a3a6b]"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700"
              }`}
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center gap-3 border border-zinc-200 bg-[#f7f8fa] px-3 py-2.5">
          <span
            className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
              recording ? "animate-pulse bg-red-600" : "bg-zinc-400"
            }`}
            aria-hidden
          />
          <span className="text-sm font-medium text-zinc-800">{micStatus}</span>
          <span className="text-xs text-zinc-500">
            {t(
              "speakingAnsweredCount",
              { answered: answeredCount, total },
              "Answered {answered}/{total}",
            )}
          </span>
        </div>

        {micError ? (
          <p className="break-words rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {micError}
          </p>
        ) : null}

        {replayUrl && phase !== "recording" ? (
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {t("speakingReplay", "Your recording (this session)")}
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={replayUrl} className="w-full max-w-md" />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-zinc-300 bg-[#eceff2] px-3 py-3 sm:px-4">
        <p className="text-xs text-zinc-500">
          {phase === "prep"
            ? t(
                "speakingPrepHint",
                "Mic is off during preparation.",
              )
            : t(
                "speakingNextHint",
                "Next saves your answer and moves on.",
              )}
        </p>
        <button
          type="button"
          disabled={phase === "prep" || phase === "done" || advancing}
          onClick={() => void saveAndAdvance()}
          className="shrink-0 rounded-sm border border-[#1a3a6b] bg-[#1a3a6b] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#152f57] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLast
            ? t("speakingFinishLast", "Finish & submit")
            : t("speakingNextQuestion", "Next question")}
        </button>
      </div>
    </div>
  );
  },
);
