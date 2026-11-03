"use client";

import {
  ChevronLeft,
  ChevronRight,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";

export function ShadowingControlBar({
  currentIndex,
  totalSentences,
  playing,
  timed,
  aligned,
  disabled = false,
  isRecording = false,
  recordDisabled = false,
  onReplay,
  onPrev,
  onNext,
  onTogglePlay,
  onRecord,
  className = "",
}: {
  currentIndex: number;
  totalSentences: number;
  playing: boolean;
  timed: boolean;
  aligned: boolean;
  disabled?: boolean;
  isRecording?: boolean;
  recordDisabled?: boolean;
  onReplay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onRecord?: () => void;
  className?: string;
}) {
  const { t } = useTranslations("shadowing");

  const sideBtn =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-40";
  const navBtn =
    "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-30";

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/90 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-md xl:static xl:border-t xl:border-slate-100 xl:bg-slate-50/60 xl:p-3 xl:shadow-none ${className}`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 xl:max-w-none">
        {/* Replay current sentence button */}
        <button
          type="button"
          onClick={onReplay}
          disabled={disabled || !timed}
          className={sideBtn}
          title={t("replaySentenceHint", "Nghe lại câu này (R)")}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">{t("replaySentence", "Nghe lại")}</span>
        </button>

        {/* Center Navigation & Play/Pause */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disabled || currentIndex === 0}
            aria-label={t("prevSentence", "Câu trước")}
            className={navBtn}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            disabled={disabled}
            aria-label={playing ? t("pause", "Tạm dừng") : t("play", "Phát")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-wewin-navy text-white shadow-md ring-2 ring-wewin-navy/20 transition-all hover:bg-wewin-navy-hover active:scale-95 disabled:opacity-50"
          >
            {playing ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 translate-x-0.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={disabled || currentIndex === totalSentences - 1}
            aria-label={t("nextSentence", "Câu sau")}
            className={navBtn}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Record / Stop Button */}
        {onRecord ? (
          <button
            type="button"
            onClick={onRecord}
            disabled={recordDisabled}
            className={`${sideBtn} ${
              isRecording
                ? "border-rose-300 bg-rose-50 text-rose-600 font-bold ring-2 ring-rose-400/30"
                : ""
            }`}
          >
            {isRecording ? (
              <Square className="h-4 w-4 text-rose-600 animate-pulse fill-current" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isRecording ? t("stop", "Dừng") : t("record", "Ghi âm")}
            </span>
          </button>
        ) : (
          <span className="min-w-11 sm:min-w-16" />
        )}
      </div>

      {/* Sentence counter and hints */}
      <p className="mt-1.5 text-center text-[11px] text-slate-400">
        {t(
          "sentenceCounter",
          { n: currentIndex + 1, total: totalSentences },
          `Câu ${currentIndex + 1} / ${totalSentences}`,
        )}
        <span className="hidden sm:inline"> · {t("shortcutsHint", "Space phát / dừng · ←/→ đổi câu · R nghe lại · M micro")}</span>
      </p>

      {timed && !aligned ? (
        <p className="mt-0.5 text-center text-[11px] text-slate-400">
          {t("estimatedTiming", "Thời điểm từng câu được ước lượng theo độ dài, có thể lệch vài giây.")}
        </p>
      ) : null}
    </div>
  );
}

