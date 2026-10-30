"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mic,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { transcriptLines } from "@/lib/shadowing/transcript";
import type { CueTiming } from "@/lib/shadowing/cues";
import { useSentencePlayback } from "@/components/shadowing/use-sentence-playback";

type FontSize = "sm" | "base" | "lg";

export function ShadowingTranscript({
  transcript,
  timings = null,
  audioRef,
  disabled = false,
  onRecord,
  recordDisabled = false,
  className = "",
}: {
  transcript: string;
  /** Aligned sentence timings; when absent they are estimated from the audio duration. */
  timings?: CueTiming[] | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Locks sentence navigation and shortcuts, e.g. while the learner is recording. */
  disabled?: boolean;
  onRecord?: () => void;
  recordDisabled?: boolean;
  className?: string;
}) {
  const { t } = useTranslations("shadowing");
  const lines = useMemo(() => transcriptLines(transcript), [transcript]);
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const { index, playing, timed, aligned, goTo, replay, togglePlay } = useSentencePlayback({
    lines,
    timings,
    audioRef,
    disabled,
  });

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const list = listRef.current;
    const item = itemRefs.current[index];
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: "smooth" });
    }
  }, [index]);

  const totalWords = useMemo(() => {
    return transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [transcript]);

  const fontSizeClass = {
    sm: "text-sm sm:text-base leading-relaxed",
    base: "text-base sm:text-[17px] leading-relaxed",
    lg: "text-lg sm:text-xl leading-relaxed",
  }[fontSize];

  const navBtn =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-40";
  const sideBtn =
    "flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold text-slate-600 transition-all hover:bg-white hover:text-slate-900 active:scale-95 disabled:opacity-40";

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <BookOpen className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
              Transcript
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{lines.length} câu</span>
              <span>•</span>
              <span>{totalWords} từ</span>
            </div>
          </div>
        </div>

        {/* Font size controls */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")}
            disabled={fontSize === "sm"}
            title="Thu nhỏ chữ"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="px-1.5 text-xs font-bold uppercase text-slate-600">
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")}
            disabled={fontSize === "lg"}
            title="Phóng to chữ"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Transcript Sentence Cards (tip text removed per user request) */}
      <div ref={listRef} className="max-h-[calc(100vh-320px)] min-h-[300px] overflow-y-auto p-3 sm:p-4">
        <div className={`space-y-2.5 ${fontSizeClass}`}>
          {lines.map((line, idx) => {
            const isHighlighted = index === idx;
            const sentenceNum = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (!disabled) goTo(idx);
                }}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                  isHighlighted
                    ? "border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-200"
                    : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                }`}
              >
                {/* Sentence Number Badge */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                    isHighlighted
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                  }`}
                >
                  {sentenceNum}
                </span>

                {/* Sentence Content */}
                <div className="min-w-0 flex-1">
                  {line.speaker ? (
                    <span className="mr-1.5 inline-block rounded bg-wewin-navy/10 px-1.5 py-0.5 text-xs font-bold text-wewin-navy">
                      {line.speaker}:
                    </span>
                  ) : null}
                  <span
                    className={
                      isHighlighted
                        ? "font-semibold text-slate-900"
                        : "text-slate-800"
                    }
                  >
                    {line.text}
                  </span>
                </div>

                {/* Active Indicator Icon */}
                {isHighlighted ? (
                  <span className="shrink-0 text-indigo-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sentence controls */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={replay}
            disabled={disabled || !timed}
            className={sideBtn}
            title={t("replaySentenceHint", "Nghe lại câu này (R)")}
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t("replaySentence", "Nghe lại")}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={disabled || index === 0}
              aria-label={t("prevSentence", "Câu trước")}
              className={navBtn}
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={disabled}
              aria-label={playing ? t("pause", "Tạm dừng") : t("play", "Phát")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-wewin-navy text-white shadow-sm ring-2 ring-wewin-navy/20 transition-all hover:bg-wewin-navy-hover active:scale-95 disabled:opacity-50"
            >
              {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 translate-x-0.5 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={disabled || index === lines.length - 1}
              aria-label={t("nextSentence", "Câu sau")}
              className={navBtn}
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {onRecord ? (
            <button type="button" onClick={onRecord} disabled={recordDisabled} className={sideBtn}>
              <Mic className="h-4 w-4" />
              <span>{t("record", "Ghi âm")}</span>
            </button>
          ) : (
            <span className="min-w-14" />
          )}
        </div>

        <p className="mt-1.5 text-center text-[11px] text-slate-400">
          {t("sentenceCounter", { n: index + 1, total: lines.length }, `Câu ${index + 1} / ${lines.length}`)}
          <span className="hidden sm:inline"> · {t("shortcutsHint", "Space phát / dừng · ←/→ đổi câu · R nghe lại câu")}</span>
        </p>
        {timed && !aligned ? (
          <p className="mt-0.5 text-center text-[11px] text-slate-400">
            {t("estimatedTiming", "Thời điểm từng câu được ước lượng theo độ dài, có thể lệch vài giây.")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
