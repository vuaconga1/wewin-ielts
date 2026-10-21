"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Timer } from "lucide-react";
import { formatClock } from "@/lib/dictation/format";
import type {
  DictationSubmitResult,
  FillBlankSubmitResult,
  ListenAnswerSubmitResult,
  PublicDictationExercise,
} from "@/lib/dictation/types";
import { useTranslations } from "@/i18n/provider";
import { DictationResult } from "@/components/dictation/dictation-result";
import { DictationHistory } from "@/components/dictation/dictation-history";
import { FillBlankInputs } from "@/components/dictation/fill-blank-inputs";
import { FillBlankResult } from "@/components/dictation/fill-blank-result";
import { ListenAnswerInputs } from "@/components/dictation/listen-answer-inputs";
import { ListenAnswerResult } from "@/components/dictation/listen-answer-result";

type SubmitResult = DictationSubmitResult | FillBlankSubmitResult | ListenAnswerSubmitResult;

/** Playing from (almost) the start counts as a new listen; resume after pause does not. */
const FRESH_START_SEC = 0.3;

type Session = {
  startedAtMs: number | null;
  listenCount: number;
  text: string;
  answers: Record<string, string>;
};

const EMPTY_SESSION: Session = { startedAtMs: null, listenCount: 0, text: "", answers: {} };

/** Unsubmitted attempts are discarded so history only holds checked answers. */
function abandonAttempt(attemptId: string) {
  const url = `/api/dictation/attempts/${attemptId}/abandon`;
  if (navigator.sendBeacon?.(url)) return;
  void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
}

export function DictationPlayer({ exercise }: { exercise: PublicDictationExercise }) {
  const { t } = useTranslations("dictation");
  const { settings } = exercise;
  const fillSegments = exercise.mode === "FILL_BLANK" ? (exercise.segments ?? []) : null;
  const questions = exercise.mode === "QUESTION_ANSWER" ? (exercise.questions ?? []) : null;
  const itemIds =
    fillSegments?.flatMap((s) => (s.type === "gap" ? [s.id] : [])) ??
    questions?.map((q) => q.id) ??
    [];
  const answerMode = Boolean(fillSegments || questions);
  const audioRef = useRef<HTMLAudioElement>(null);
  const attemptIdRef = useRef<string | null>(null);
  const startPromise = useRef<Promise<string | null> | null>(null);
  const leftRef = useRef(false);

  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const filledCount = itemIds.filter((id) => session.answers[id]?.trim()).length;

  useEffect(() => {
    leftRef.current = false;
    const audio = audioRef.current;
    // Metadata can load before hydration, so the onLoadedMetadata handler never sees it.
    if (audio && audio.readyState >= 1 && Number.isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
    const discard = () => {
      const id = attemptIdRef.current;
      attemptIdRef.current = null;
      if (id) abandonAttempt(id);
    };
    const onPageHide = () => {
      discard();
      audioRef.current?.pause();
      setSession(EMPTY_SESSION);
      setResult(null);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      leftRef.current = true;
      discard();
    };
  }, []);

  const timerRunning = session.startedAtMs != null && !result;
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const errorMessage = useCallback(
    (code: string | undefined, fallbackKey: string, fallback: string) =>
      code ? t(`errors.${code}`, t(`errors.${fallbackKey}`, fallback)) : t(`errors.${fallbackKey}`, fallback),
    [t],
  );

  const ensureAttempt = useCallback(async (): Promise<string | null> => {
    if (attemptIdRef.current) return attemptIdRef.current;
    if (!startPromise.current) {
      startPromise.current = (async () => {
        try {
          const res = await fetch(`/api/dictation/${exercise.slug}/start`, { method: "POST" });
          const data = (await res.json()) as { attemptId?: string; code?: string };
          if (!res.ok || !data.attemptId) {
            setError(errorMessage(data.code, "startFailed", "Không bắt đầu được lượt làm bài. Thử lại."));
            return null;
          }
          if (leftRef.current) {
            abandonAttempt(data.attemptId);
            return null;
          }
          attemptIdRef.current = data.attemptId;
          return data.attemptId;
        } catch {
          setError(errorMessage(undefined, "startFailed", "Không bắt đầu được lượt làm bài. Thử lại."));
          return null;
        } finally {
          startPromise.current = null;
        }
      })();
    }
    return startPromise.current;
  }, [errorMessage, exercise.slug]);

  const limitReached =
    settings.maxListenCount != null && session.listenCount >= settings.maxListenCount;

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setNotice(null);
    const fresh = audio.ended || audio.currentTime < FRESH_START_SEC;
    if (!result && fresh) {
      if (limitReached) {
        setNotice(t("limitReached", "Bạn đã dùng hết số lần nghe."));
        return;
      }
      setSession((s) => ({
        ...s,
        listenCount: s.listenCount + 1,
        startedAtMs: s.startedAtMs ?? Date.now(),
      }));
      void ensureAttempt();
    }
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      setError(t("audioError", "Không phát được audio. Vui lòng thử lại."));
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setPosition(value);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || result) return;
    setError(null);
    if (session.listenCount === 0) {
      setError(t("playFirst", "Hãy nghe audio trước khi kiểm tra."));
      return;
    }
    if (answerMode) {
      if (filledCount === 0) {
        setError(
          questions
            ? t("qaEmpty", "Bạn chưa trả lời câu hỏi nào.")
            : t("emptyGaps", "Bạn chưa điền ô trống nào."),
        );
        return;
      }
      const left = itemIds.length - filledCount;
      if (
        left > 0 &&
        !window.confirm(
          questions
            ? t(
                "qaConfirmBlankSubmit",
                { n: left },
                "Còn {n} câu chưa trả lời. Các câu này sẽ được tính là bỏ trống. Vẫn nộp bài?",
              )
            : t(
                "confirmBlankSubmit",
                { n: left },
                "Còn {n} ô chưa điền. Các ô này sẽ được tính là bỏ trống. Vẫn nộp bài?",
              ),
        )
      ) {
        return;
      }
    } else if (!session.text.trim()) {
      setError(t("emptyAnswer", "Bạn chưa nhập nội dung."));
      return;
    }
    setSubmitting(true);
    try {
      const attemptId = await ensureAttempt();
      if (!attemptId) return;
      const payload = answerMode
        ? { answers: session.answers, listenCount: session.listenCount }
        : { text: session.text, listenCount: session.listenCount };
      const res = await fetch(`/api/dictation/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as SubmitResult & { code?: string };
      if (!res.ok) {
        if (data.code === "ALREADY_SUBMITTED" || data.code === "NOT_FOUND") {
          attemptIdRef.current = null;
        }
        setError(errorMessage(data.code, "submitFailed", "Không chấm được bài. Thử lại."));
        return;
      }
      attemptIdRef.current = null;
      audioRef.current?.pause();
      setResult(data);
      setHistoryKey((k) => k + 1);
    } catch {
      setError(errorMessage(undefined, "submitFailed", "Không chấm được bài. Thử lại."));
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setSession(EMPTY_SESSION);
    setResult(null);
    setError(null);
    setNotice(null);
    setPosition(0);
  }

  function replay() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() =>
      setError(t("audioError", "Không phát được audio. Vui lòng thử lại.")),
    );
  }

  const elapsedSec =
    session.startedAtMs != null ? Math.max(0, (now - session.startedAtMs) / 1000) : 0;

  return (
    <div className="w-full min-w-0 space-y-4">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {exercise.title}
          </h1>
          {exercise.level ? (
            <span className="shrink-0 rounded-full bg-wewin-accent-blue-bg px-2.5 py-0.5 text-xs font-bold text-wewin-navy">
              {exercise.level}
            </span>
          ) : null}
        </div>
        <p className="mt-1 break-words text-sm text-zinc-600">
          {exercise.instructions ||
            (fillSegments
              ? t("fillDefaultInstructions", "Nghe audio và điền từ hoặc cụm từ còn thiếu vào từng ô trống.")
              : t("defaultInstructions", "Nghe và chép lại chính xác câu bạn nghe được."))}
        </p>
      </header>

      <section className="card-outline space-y-3 p-4 sm:p-5">
        <audio
          ref={audioRef}
          src={exercise.audioUrl}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onDurationChange={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d)) setDuration(d);
          }}
          onError={() => setError(t("audioError", "Không phát được audio. Vui lòng thử lại."))}
        />

        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlay()}
            disabled={!result && !playing && limitReached && position < FRESH_START_SEC}
            aria-label={playing ? t("pause", "Tạm dừng") : t("play", "Phát")}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wewin-navy text-white hover:bg-wewin-navy-hover disabled:opacity-50"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(position, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!duration}
              aria-label={t("play", "Phát")}
              className="w-full accent-wewin-navy"
            />
            <div className="flex justify-between text-xs tabular-nums text-zinc-500">
              <span>{formatClock(position)}</span>
              <span>{formatClock(duration)}</span>
            </div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 self-start text-sm tabular-nums text-zinc-600"
            title={t("timerHint", "Bắt đầu tính khi bạn phát audio lần đầu.")}
          >
            <Timer className="h-4 w-4" />
            {formatClock(result ? result.durationSeconds : elapsedSec)}
          </span>
        </div>

        {notice ? <p className="text-sm text-amber-800">{notice}</p> : null}
      </section>

      {result?.mode === "FILL_BLANK" ? (
        <FillBlankResult result={result} onReplay={replay} onRetry={retry} />
      ) : result?.mode === "QUESTION_ANSWER" ? (
        <ListenAnswerResult result={result} onReplay={replay} onRetry={retry} />
      ) : result ? (
        <DictationResult
          result={result}
          submittedText={session.text}
          onReplay={replay}
          onRetry={retry}
        />
      ) : fillSegments ? (
        <form onSubmit={onSubmit} className="card-outline space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("fillInputTitle", "Điền vào chỗ trống")}
            </h2>
            <span className="rounded-full bg-wewin-accent-blue-bg px-2.5 py-0.5 text-xs font-bold tabular-nums text-wewin-navy" aria-live="polite">
              {t("filledProgress", { filled: filledCount, total: itemIds.length }, "Đã điền {filled}/{total} ô")}
            </span>
          </div>
          <FillBlankInputs
            segments={fillSegments}
            answers={session.answers}
            onChange={(gapId, value) =>
              setSession((s) => ({ ...s, answers: { ...s.answers, [gapId]: value } }))
            }
            disabled={submitting}
          />
          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? t("checking", "Đang chấm…") : t("submitFill", "Nộp bài")}
          </button>
        </form>
      ) : questions ? (
        <form onSubmit={onSubmit} className="card-outline space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900">{t("qaInputTitle", "Trả lời câu hỏi")}</h2>
            <span
              className="rounded-full bg-wewin-accent-blue-bg px-2.5 py-0.5 text-xs font-bold tabular-nums text-wewin-navy"
              aria-live="polite"
            >
              {t(
                "qaProgress",
                { filled: filledCount, total: itemIds.length },
                "Đã trả lời {filled}/{total} câu",
              )}
            </span>
          </div>
          <ListenAnswerInputs
            questions={questions}
            answers={session.answers}
            onChange={(questionId, value) =>
              setSession((s) => ({ ...s, answers: { ...s.answers, [questionId]: value } }))
            }
            disabled={submitting}
          />
          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? t("checking", "Đang chấm…") : t("submitFill", "Nộp bài")}
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="card-outline space-y-3 p-4 sm:p-5">
          <label htmlFor="dictation-input" className="block text-sm font-semibold text-zinc-900">
            {t("inputLabel", "Nội dung bạn nghe được")}
          </label>
          <textarea
            id="dictation-input"
            value={session.text}
            onChange={(e) => {
              const text = e.target.value;
              setSession((s) => ({ ...s, text }));
            }}
            rows={6}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            placeholder={t("placeholder", "Gõ lại câu bạn nghe được…")}
            className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-base leading-relaxed outline-none focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg"
          />
          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? t("checking", "Đang chấm…") : t("check", "Kiểm tra")}
          </button>
        </form>
      )}

      <DictationHistory slug={exercise.slug} mode={exercise.mode} refreshKey={historyKey} />
    </div>
  );
}
