"use client";

import { Check, CircleDashed, Headphones, RotateCcw, X } from "lucide-react";
import type { FillBlankGapResult, FillBlankSubmitResult } from "@/lib/dictation/types";
import { useTranslations } from "@/i18n/provider";
import { formatClock } from "@/lib/dictation/format";

type Props = {
  result: FillBlankSubmitResult;
  title?: string;
  onReplay?: () => void;
  onRetry?: () => void;
};

const STYLE: Record<FillBlankGapResult["status"], string> = {
  correct: "border-emerald-300 bg-emerald-50 text-emerald-800",
  incorrect: "border-rose-300 bg-rose-50 text-rose-800",
  blank: "border-orange-300 bg-orange-50 text-orange-800",
};

function StatusIcon({ status }: { status: FillBlankGapResult["status"] }) {
  if (status === "correct") return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (status === "incorrect") return <X className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}

export function FillBlankResult({ result, title, onReplay, onRetry }: Props) {
  const { t } = useTranslations("dictation");
  const statusLabel = (s: FillBlankGapResult["status"]) =>
    s === "correct"
      ? t("gapCorrect", "Đúng")
      : s === "incorrect"
        ? t("gapIncorrect", "Sai")
        : t("gapBlank", "Bỏ trống");

  const stats = [
    { label: t("score", "Điểm"), value: `${result.score}/100` },
    {
      label: t("correctGaps", "Ô đúng"),
      value: t("gapsOf", { correct: result.correctCount, total: result.totalGaps }, "{correct}/{total} ô"),
    },
    { label: t("listens", "Lượt nghe"), value: String(result.listenCount) },
    { label: t("duration", "Thời gian"), value: formatClock(result.durationSeconds) },
  ];

  return (
    <section onCopy={(e) => e.preventDefault()} className="card-outline select-none space-y-5 p-4 sm:p-5">
      <h2 className="break-words text-lg font-bold text-zinc-900">
        {title ?? t("resultTitle", "Kết quả")}
      </h2>

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

      {result.segments ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {t("fillTranscriptTitle", "Transcript hoàn chỉnh")}
            </h3>
            <ul className="flex flex-wrap gap-1.5 text-xs">
              {(["correct", "incorrect", "blank"] as const).map((s) => (
                <li
                  key={s}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium ${STYLE[s]}`}
                >
                  <StatusIcon status={s} />
                  {statusLabel(s)}
                </li>
              ))}
            </ul>
          </div>
          <p className="whitespace-pre-wrap break-words rounded-xl border border-zinc-200 bg-white p-3 text-base leading-[2.2] text-zinc-800">
            {result.segments.map((seg, i) => {
              if (seg.type === "text") return <span key={i}>{seg.text}</span>;
              const r = seg.result;
              return (
                <span
                  key={i}
                  title={statusLabel(r.status)}
                  className={`mx-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 align-baseline leading-normal ${STYLE[r.status]}`}
                >
                  <sup className="text-[0.65rem] font-bold">{seg.index + 1}</sup>
                  <StatusIcon status={r.status} />
                  <span className="font-semibold">{r.expected}</span>
                  {r.status === "incorrect" ? (
                    <span className="text-sm text-rose-600 line-through">{r.submitted}</span>
                  ) : null}
                  <span className="sr-only">{statusLabel(r.status)}</span>
                </span>
              );
            })}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900">{t("gapDetailTitle", "Chi tiết từng ô")}</h3>
        <ol className="grid gap-2 sm:grid-cols-2">
          {result.gapResults.map((r, i) => (
            <li key={r.gapId} className={`min-w-0 rounded-xl border px-3 py-2 text-sm ${STYLE[r.status]}`}>
              <p className="flex items-center gap-1.5 font-semibold">
                <span className="tabular-nums">{i + 1}.</span>
                <StatusIcon status={r.status} />
                {statusLabel(r.status)}
              </p>
              <p className="mt-0.5 break-words">
                {r.status === "correct"
                  ? r.expected
                  : r.status === "incorrect"
                    ? t("gapYouWrote", { submitted: r.submitted, expected: r.expected }, "Bạn nhập: {submitted} — Đáp án: {expected}")
                    : t("gapAnswer", { expected: r.expected }, "Đáp án: {expected}")}
              </p>
            </li>
          ))}
        </ol>
      </div>

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
