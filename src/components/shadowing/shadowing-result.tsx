"use client";

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Info,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { ShadowingAttemptResult } from "@/lib/shadowing/types";
import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";
import { AlignedTranscript } from "@/components/dictation/dictation-result";
import { UserAudioPlayer } from "@/components/shadowing/shadowing-audio-player";

type Props = {
  result: ShadowingAttemptResult;
  sampleAudioUrl?: string;
  title?: string;
  onRetry?: () => void;
};

export function ShadowingResult({ result, sampleAudioUrl, title, onRetry }: Props) {
  const { t, locale } = useTranslations("shadowing");
  const heard = (word: string) => t("heardAs", { word }, "Hệ thống nghe: {word}");

  const score = result.score;
  const scoreConfig =
    score >= 80
      ? {
          badge: "Xuất sắc 🎉",
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          ring: "stroke-emerald-500",
          msg: "Khả năng phát âm và bắt nhịp câu rất chuẩn!",
        }
      : score >= 60
        ? {
            badge: "Khá tốt 👏",
            color: "text-sky-600 bg-sky-50 border-sky-200",
            ring: "stroke-sky-500",
            msg: "Bắt kịp phần lớn nội dung, chỉ sai lệch một số từ nhỏ.",
          }
        : {
            badge: "Cần luyện thêm 💪",
            color: "text-amber-600 bg-amber-50 border-amber-200",
            ring: "stroke-amber-500",
            msg: "Hãy nghe lại audio mẫu với tốc độ 0.75x để theo dõi kỹ hơn.",
          };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      {/* Top Banner / Score Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Award className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {title ?? t("resultTitle", "Kết quả")}
            </h2>
          </div>
          <p className="text-xs text-slate-500">{scoreConfig.msg}</p>
        </div>

        {/* Big Score Card */}
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xs ${scoreConfig.color}`}
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              {scoreConfig.badge}
            </div>
            <div className="font-mono text-2xl font-black tabular-nums">
              {score}
              <span className="text-sm font-semibold opacity-70">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed 4-Metric Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {/* Correct Words */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>{t("correctWords", "Từ đúng")}</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-950">
            {result.correctCount}
            <span className="text-xs font-normal text-emerald-700">/{result.totalWords} từ</span>
          </div>
        </div>

        {/* Substitutions */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>{t("substitutions", "Sai khác")}</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-rose-950">
            {result.substitutionCount}
          </div>
        </div>

        {/* Deletions */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <MinusCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>{t("deletions", "Bỏ sót")}</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-950">
            {result.deletionCount}
          </div>
        </div>

        {/* Insertions */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
            <span>{t("insertions", "Đọc thừa")}</span>
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900">
            {result.insertionCount}
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-wewin-accent-blue" />
        <span>
          {t(
            "scoreDisclaimer",
            "Điểm này cho biết phần hệ thống nhận diện được khớp với câu mẫu bao nhiêu, không phải điểm phát âm.",
          )}
        </span>
      </div>

      {/* Sentence word alignment */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3.5">
        <AlignedTranscript
          wordResults={result.wordResults}
          title={t("transcriptTitle", "Câu mẫu (đối chiếu với phần bạn đọc)")}
          actualLabel={heard}
        />
      </div>

      {/* Recognized Text Display */}
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-wewin-navy" />
          {t("recognizedTitle", "Hệ thống nghe được")}
        </h3>
        <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-200/80 bg-white p-3.5 text-sm leading-relaxed text-slate-800 shadow-2xs">
          {result.recognizedText || (
            <span className="italic text-slate-400">Không nghe rõ giọng đọc.</span>
          )}
        </p>
      </div>

      {/* Audio Comparison: Sample Audio vs Your Voice */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Đối chiếu âm thanh (Audio Comparison)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {sampleAudioUrl ? (
            <UserAudioPlayer
              src={sampleAudioUrl}
              label={t("sampleAudio", "Audio mẫu chuẩn")}
              className="border-sky-100 bg-sky-50/40"
            />
          ) : null}

          {result.recordingUrl ? (
            <div className="space-y-1">
              <UserAudioPlayer
                src={result.recordingUrl}
                label={t("yourRecording", "Bản ghi của bạn")}
                className="border-emerald-100 bg-emerald-50/40"
              />
              {result.recordingExpiresAt ? (
                <p className="text-[11px] text-slate-400">
                  {t(
                    "recordingKeptUntil",
                    { date: new Date(result.recordingExpiresAt).toLocaleDateString(localeToIntl(locale)) },
                    "Bản ghi được lưu đến {date}",
                  )}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
              {t("recordingGone", "Bản ghi đã hết hạn lưu trữ.")}
            </div>
          )}
        </div>
      </div>

      {/* Retry Action */}
      {onRetry ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-wewin-navy-hover active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            {t("retry", "Luyện lại bài này")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
