"use client";

import type { FillBlankSegment } from "@/lib/dictation/types";
import { MAX_ANSWER_CHARS } from "@/lib/dictation/fill-blank";
import { useTranslations } from "@/i18n/provider";

type Props = {
  segments: FillBlankSegment[];
  answers: Record<string, string>;
  onChange: (gapId: string, value: string) => void;
  disabled?: boolean;
};

const MIN_CH = 7;
const MAX_CH = 28;

/** Transcript with inline inputs; Tab / Shift+Tab move between gaps in reading order. */
export function FillBlankInputs({ segments, answers, onChange, disabled }: Props) {
  const { t } = useTranslations("dictation");
  return (
    <p className="whitespace-pre-wrap break-words text-base leading-[2.6] text-zinc-800 sm:text-lg sm:leading-[2.6]">
      {segments.map((seg, i) => {
        if (seg.type === "text") return <span key={i}>{seg.text}</span>;
        const value = answers[seg.id] ?? "";
        const width = Math.min(MAX_CH, Math.max(MIN_CH, value.length + 2));
        return (
          <span key={seg.id} className="mx-0.5 inline-flex max-w-full items-baseline align-baseline">
            <sup className="mr-0.5 select-none text-[0.65rem] font-bold text-wewin-navy">
              {seg.index + 1}
            </sup>
            <input
              value={value}
              onChange={(e) => onChange(seg.id, e.target.value)}
              disabled={disabled}
              maxLength={MAX_ANSWER_CHARS}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label={t("gapLabel", { n: seg.index + 1 }, "Ô trống {n}")}
              style={{ width: `${width}ch` }}
              className={`max-w-full rounded-md border-2 bg-white px-1.5 py-0.5 text-center text-base leading-normal text-zinc-900 outline-none transition-colors focus:border-wewin-navy focus:bg-wewin-accent-blue-bg/40 focus:ring-2 focus:ring-wewin-accent-blue-bg disabled:opacity-60 ${
                value.trim() ? "border-wewin-navy/50" : "border-dashed border-zinc-300"
              }`}
            />
          </span>
        );
      })}
    </p>
  );
}
