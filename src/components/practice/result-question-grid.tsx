"use client";

import type { AnswerStatus, GradedQuestion } from "@/lib/scoring";
import { useTranslations } from "@/i18n/provider";

type Props = {
  items: GradedQuestion[];
  onSelect: (item: GradedQuestion) => void;
};

function circleClass(status: AnswerStatus): string {
  switch (status) {
    case "correct":
      return "border-emerald-500 text-emerald-700 hover:bg-emerald-50";
    case "wrong":
      return "border-red-500 text-red-700 hover:bg-red-50";
    case "skipped":
    case "no_key":
    default:
      return "border-zinc-300 text-zinc-500 hover:bg-zinc-50";
  }
}

export function ResultQuestionGrid({ items, onSelect }: Props) {
  const { t } = useTranslations("result");

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={`${item.sectionOrder}-${item.questionNumber}`}
          type="button"
          onClick={() => onSelect(item)}
          title={t("questionTooltip", { n: item.questionNumber })}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors ${circleClass(item.status)}`}
        >
          {item.questionNumber}
        </button>
      ))}
    </div>
  );
}
