"use client";

import { Headphones, RotateCcw } from "lucide-react";
import type { DictationSubmitResult, DictationWordResult } from "@/lib/dictation/types";
import { useTranslations } from "@/i18n/provider";
import { formatClock } from "@/lib/dictation/format";

type Props = {
  result: DictationSubmitResult;
  submittedText: string;
  title?: string;
  onReplay?: () => void;
  onRetry?: () => void;
};

function uniq(words: string[]): string[] {
  return [...new Set(words)];
}

function Word({ r, youWrote, nearMiss }: { r: DictationWordResult; youWrote: (w: string) => string; nearMiss: string }) {
  switch (r.status) {
    case "correct":
      return <span className="rounded bg-emerald-50 px-1 text-emerald-700">{r.expected}</span>;
    case "missing":
      return (
        <span className="rounded bg-orange-50 px-1 text-orange-700 underline decoration-orange-400 decoration-dotted underline-offset-4">
          {r.expected}
        </span>
      );
    case "extra":
      return <span className="rounded px-1 text-zinc-400 line-through">{r.actual}</span>;
    case "incorrect":
      return (
        <span
          className="inline-flex flex-col items-center rounded bg-rose-50 px-1 leading-tight"
          title={youWrote(r.actual)}
        >
          <span className="text-rose-700">{r.expected}</span>
          <span className="text-xs text-rose-500">
            <span className="line-through">{r.actual}</span>
            {r.nearMiss ? <span className="ml-1">({nearMiss})</span> : null}
          </span>
        </span>
      );
  }
}

/** Reference transcript coloured by alignment status, with a legend. */
export function AlignedTranscript({
  wordResults,
  title,
  actualLabel,
}: {
  wordResults: DictationWordResult[];
  title: string;
  actualLabel: (word: string) => string;
}) {
  const { t } = useTranslations("dictation");
  const legend = [
    { label: t("legendCorrect", "Đúng"), cls: "bg-emerald-50 text-emerald-700" },
    { label: t("legendIncorrect", "Sai"), cls: "bg-rose-50 text-rose-700" },
    { label: t("legendMissing", "Thiếu"), cls: "bg-orange-50 text-orange-700" },
    { label: t("legendExtra", "Thừa"), cls: "text-zinc-400 line-through" },
  ];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <ul className="flex flex-wrap gap-1.5 text-xs">
          {legend.map((l) => (
            <li key={l.label} className={`rounded px-1.5 py-0.5 font-medium ${l.cls}`}>
              {l.label}
            </li>
          ))}
        </ul>
      </div>
      <p
        onCopy={(e) => e.preventDefault()}
        className="flex select-none flex-wrap items-start gap-x-1 gap-y-2 rounded-xl border border-zinc-200 bg-white p-3 text-base leading-relaxed"
      >
        {wordResults.map((r, i) => (
          <Word key={i} r={r} youWrote={actualLabel} nearMiss={t("nearMiss", "gần đúng")} />
        ))}
      </p>
    </div>
  );
}

export function DictationResult({ result, submittedText, title, onReplay, onRetry }: Props) {
  const { t } = useTranslations("dictation");
  const { errorSummary: errors } = result;
  const hasMistakes =
    errors.missing.length + errors.incorrect.length + errors.extra.length > 0;
  const youWrote = (word: string) => t("youWrote", { word }, "Bạn viết: {word}");

  const stats = [
    { label: t("score", "Điểm"), value: `${result.score}/100` },
    {
      label: t("correctWords", "Đúng"),
      value: t("wordsOf", { correct: result.correctCount, total: result.totalWords }, "{correct}/{total} từ"),
    },
    { label: t("duration", "Thời gian"), value: formatClock(result.durationSeconds) },
  ];

  return (
    <section className="card-outline space-y-5 p-4 sm:p-5">
      <h2 className="break-words text-lg font-bold text-zinc-900">
        {title ?? t("resultTitle", "Kết quả")}
      </h2>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

      <AlignedTranscript
        wordResults={result.wordResults}
        title={t("transcriptTitle", "Đáp án (đối chiếu với bài làm)")}
        actualLabel={youWrote}
      />

      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-zinc-900">{t("yourAnswer", "Bài làm của bạn")}</h3>
        <p className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
          {submittedText}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          {t("mistakesTitle", "Lỗi của lần làm này")}
        </h3>
        {hasMistakes ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: t("missingTitle", "Từ bị sót"), cls: "bg-orange-50 text-orange-700", items: uniq(errors.missing) },
              {
                title: t("incorrectTitle", "Từ viết sai"),
                cls: "bg-rose-50 text-rose-700",
                items: uniq(errors.incorrect.map((x) => `${x.actual} → ${x.expected}`)),
              },
              { title: t("extraTitle", "Từ thêm không có trong audio"), cls: "bg-zinc-100 text-zinc-600", items: uniq(errors.extra) },
            ].map((group) => (
              <div key={group.title} className="min-w-0 rounded-xl border border-zinc-200 p-3">
                <p className="text-xs font-semibold text-zinc-600">
                  {group.title} ({group.items.length})
                </p>
                {group.items.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {group.items.map((w) => (
                      <li key={w} className={`break-all rounded px-1.5 py-0.5 text-sm ${group.cls}`}>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-400">—</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-emerald-700">
            {t("noMistakes", "Không có lỗi nào — tuyệt vời!")}
          </p>
        )}
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
