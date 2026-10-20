"use client";

import { Info, RotateCcw } from "lucide-react";
import type { ShadowingAttemptResult } from "@/lib/shadowing/types";
import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";
import { AlignedTranscript } from "@/components/dictation/dictation-result";

type Props = {
  result: ShadowingAttemptResult;
  sampleAudioUrl?: string;
  title?: string;
  onRetry?: () => void;
};

export function ShadowingResult({ result, sampleAudioUrl, title, onRetry }: Props) {
  const { t, locale } = useTranslations("shadowing");
  const heard = (word: string) => t("heardAs", { word }, "Hệ thống nghe: {word}");

  const stats = [
    { label: t("contentScore", "Điểm khớp nội dung"), value: `${result.score}/100` },
    {
      label: t("correctWords", "Đúng"),
      value: t("wordsOf", { correct: result.correctCount, total: result.totalWords }, "{correct}/{total} từ"),
    },
    { label: t("substitutions", "Sai khác"), value: String(result.substitutionCount) },
    { label: t("deletions", "Thiếu"), value: String(result.deletionCount) },
    { label: t("insertions", "Thừa"), value: String(result.insertionCount) },
  ];

  return (
    <section className="card-outline space-y-5 p-4 sm:p-5">
      <h2 className="break-words text-lg font-bold text-zinc-900">
        {title ?? t("resultTitle", "Kết quả")}
      </h2>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`min-w-0 rounded-xl px-3 py-2.5 ${
              i === 0
                ? "col-span-2 bg-wewin-navy text-white sm:col-span-1"
                : "bg-wewin-accent-blue-bg text-wewin-navy"
            }`}
          >
            <dt className={`text-xs ${i === 0 ? "text-white/80" : "text-zinc-600"}`}>{s.label}</dt>
            <dd className="mt-0.5 break-words text-lg font-bold tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <p className="flex gap-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-wewin-navy" />
        <span>
          {t(
            "scoreDisclaimer",
            "Điểm này cho biết phần hệ thống nhận diện được khớp với câu mẫu bao nhiêu, không phải điểm phát âm.",
          )}
        </span>
      </p>

      <AlignedTranscript
        wordResults={result.wordResults}
        title={t("transcriptTitle", "Câu mẫu (đối chiếu với phần bạn đọc)")}
        actualLabel={heard}
      />

      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-zinc-900">{t("recognizedTitle", "Hệ thống nghe được")}</h3>
        <p className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
          {result.recognizedText}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sampleAudioUrl ? (
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-sm font-semibold text-zinc-900">{t("sampleAudio", "Audio mẫu")}</h3>
            <audio src={sampleAudioUrl} controls preload="none" className="w-full" />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-sm font-semibold text-zinc-900">{t("yourRecording", "Bản ghi của bạn")}</h3>
          {result.recordingUrl ? (
            <>
              <audio src={result.recordingUrl} controls preload="none" className="w-full" />
              {result.recordingExpiresAt ? (
                <p className="text-xs text-zinc-500">
                  {t(
                    "recordingKeptUntil",
                    { date: new Date(result.recordingExpiresAt).toLocaleDateString(localeToIntl(locale)) },
                    "Bản ghi được lưu đến {date}",
                  )}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              {t("recordingGone", "Bản ghi đã hết hạn lưu trữ.")}
            </p>
          )}
        </div>
      </div>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          <RotateCcw className="h-4 w-4" />
          {t("retry", "Đọc lại")}
        </button>
      ) : null}
    </section>
  );
}
