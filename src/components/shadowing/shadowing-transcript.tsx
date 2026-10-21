"use client";

import { useMemo, useState } from "react";
import { BookOpen, Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { transcriptLines } from "@/lib/shadowing/transcript";
import { useTranslations } from "@/i18n/provider";

type FontSize = "sm" | "base" | "lg";

export function ShadowingTranscript({
  transcript,
  className = "",
}: {
  transcript: string;
  className?: string;
}) {
  const { t } = useTranslations("shadowing");
  const lines = useMemo(() => transcriptLines(transcript), [transcript]);
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const totalWords = useMemo(() => {
    return transcript
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [transcript]);

  const fontSizeClass = {
    sm: "text-sm leading-relaxed",
    base: "text-base leading-loose",
    lg: "text-lg leading-loose",
  }[fontSize];

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md ${className}`}
    >
      {/* Transcript Header with stats & font size toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                {t("readAlongTitle", "Transcript")}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {totalWords} từ
              </span>
            </div>
          </div>
        </div>

        {/* Reader Tools: Text Size */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-0.5">
          <button
            type="button"
            onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")}
            disabled={fontSize === "sm"}
            aria-label="Thu nhỏ chữ"
            title="Cỡ chữ nhỏ hơn"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-6 text-center text-xs font-semibold uppercase text-slate-700">
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")}
            disabled={fontSize === "lg"}
            aria-label="Phóng to chữ"
            title="Cỡ chữ lớn hơn"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-40"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-slate-500">
        <p className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Bấm vào câu bất kỳ để làm nổi bật khi đọc theo</span>
        </p>
        {highlightedIndex !== null && (
          <button
            type="button"
            onClick={() => setHighlightedIndex(null)}
            className="font-medium text-wewin-navy hover:underline"
          >
            Bỏ chọn
          </button>
        )}
      </div>

      {/* Transcript Text Body */}
      <div
        className={`mt-3 min-h-0 max-h-[440px] flex-1 space-y-2 overflow-y-auto pr-2 ${fontSizeClass}`}
      >
        {lines.map((line, i) => {
          const isSelected = highlightedIndex === i;
          const isMuted = highlightedIndex !== null && !isSelected;

          return (
            <div
              key={i}
              onClick={() => setHighlightedIndex(isSelected ? null : i)}
              className={`group relative cursor-pointer rounded-xl p-2.5 transition-all duration-150 ${
                isSelected
                  ? "border-l-4 border-wewin-navy bg-sky-50/70 pl-3 font-medium text-slate-900 shadow-2xs"
                  : isMuted
                    ? "opacity-50 hover:opacity-85 hover:bg-slate-50 text-slate-600"
                    : "hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="break-words">
                {line.speaker ? (
                  <span className="mr-2 inline-flex items-center rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs font-bold text-slate-700">
                    {line.speaker}
                  </span>
                ) : null}
                <span>{line.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
