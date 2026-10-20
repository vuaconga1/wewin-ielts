"use client";

import { Check, CircleDashed, Headphones, RotateCcw, X } from "lucide-react";
import type { ListenAnswerSubmitResult, ListenQuestionResult } from "@/lib/dictation/types";
import { useTranslations } from "@/i18n/provider";
import { formatClock } from "@/lib/dictation/format";

type Props = {
  result: ListenAnswerSubmitResult;
  title?: string;
  onReplay?: () => void;
  onRetry?: () => void;
};

const STYLE: Record<ListenQuestionResult["status"], string> = {
  correct: "border-emerald-300 bg-emerald-50 text-emerald-800",
  incorrect: "border-rose-300 bg-rose-50 text-rose-800",
  blank: "border-orange-300 bg-orange-50 text-orange-800",
};

function StatusIcon({ status }: { status: ListenQuestionResult["status"] }) {
  if (status === "correct") return <Check className="h-4 w-4 shrink-0" aria-hidden />;
  if (status === "incorrect") return <X className="h-4 w-4 shrink-0" aria-hidden />;
  return <CircleDashed className="h-4 w-4 shrink-0" aria-hidden />;
}

export function ListenAnswerResult({ result, title, onReplay, onRetry }: Props) {
  const { t } = useTranslations("dictation");
  const statusLabel = (s: ListenQuestionResult["status"]) =>
    s === "correct" ? t("gapCorrect", "Đúng") : s === "incorrect" ? t("gapIncorrect", "Sai") : t("gapBlank", "Bỏ trống");
  const reasonLabel = (r: ListenQuestionResult) =>
    r.reason === "TOO_MANY_WORDS"
      ? t("qaReasonTooManyWords", "Câu trả lời dài hơn số từ cho phép.")
      : r.reason === "WRONG_OPTION"
        ? t("qaReasonWrongOption", "Câu trả lời nhắc tới cả phương án sai.")
        : r.reason === "NEGATED"
          ? t("qaReasonNegated", "Câu trả lời mang nghĩa phủ định.")
          : null;

  const stats = [
    { label: t("score", "Điểm"), value: `${result.score}/100` },
    {
      label: t("qaCorrect", "Câu đúng"),
      value: t(
        "questionsOf",
        { correct: result.correctCount, total: result.totalQuestions },
        "{correct}/{total} câu",
      ),
    },
    { label: t("listens", "Lượt nghe"), value: String(result.listenCount) },
    { label: t("duration", "Thời gian"), value: formatClock(result.durationSeconds) },
  ];

  return (
    <section className="card-outline space-y-5 p-4 sm:p-5">
      <h2 className="break-words text-lg font-bold text-zinc-900">{title ?? t("resultTitle", "Kết quả")}</h2>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`min-w-0 rounded-xl px-3 py-2.5 ${
              i === 0 ? "bg-wewin-navy text-white" : "bg-wewin-accent-blue-bg text-wewin-navy"
            }`}
          >
            <dt className={`text-xs ${i === 0 ? "text-white/80" : "text-zinc-600"}`}>{s.label}</dt>
            <dd className="mt-0.5 break-words text-lg font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900">{t("qaDetailTitle", "Chi tiết từng câu")}</h3>
        <ol className="space-y-2">
          {result.questionResults.map((r, i) => {
            const reason = reasonLabel(r);
            return (
              <li key={r.questionId} className={`min-w-0 rounded-xl border px-3 py-2.5 text-sm ${STYLE[r.status]}`}>
                <p className="flex min-w-0 items-start gap-1.5 font-semibold">
                  <span className="shrink-0 tabular-nums">{i + 1}.</span>
                  <StatusIcon status={r.status} />
                  <span className="min-w-0 break-words">{r.prompt}</span>
                  <span className="sr-only">{statusLabel(r.status)}</span>
                </p>
                <div className="mt-1 space-y-0.5 break-words pl-5">
                  {r.status !== "blank" ? (
                    <p>{t("qaYouAnswered", { submitted: r.submitted }, "Bạn trả lời: {submitted}")}</p>
                  ) : (
                    <p>{statusLabel(r.status)}</p>
                  )}
                  {r.status !== "correct" ? (
                    <p className="font-semibold">{t("gapAnswer", { expected: r.expected }, "Đáp án: {expected}")}</p>
                  ) : null}
                  {reason ? <p className="text-xs">{reason}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <details className="rounded-xl border border-zinc-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
          {t("qaTranscriptTitle", "Xem transcript")}
        </summary>
        <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-zinc-800">
          {result.transcript}
        </p>
      </details>

      {onReplay || onRetry ? (
        <div className="flex flex-wrap gap-3">
          {onReplay ? (
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              <Headphones className="h-4 w-4" />
              {t("replay", "Nghe lại")}
            </button>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
            >
              <RotateCcw className="h-4 w-4" />
              {t("retry", "Làm lại")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
