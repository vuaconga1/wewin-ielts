"use client";

import { useTranslations } from "@/i18n/provider";

export type NavQuestion = {
  number: number;
  partIndex: number;
};

type Props = {
  questions: NavQuestion[];
  answers: Record<string, string>;
  flagged: Set<number>;
  currentNumber: number | null;
  onSelect: (number: number) => void;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** When true, show Review control (L/R). */
  showReview?: boolean;
};

function isAnswered(answers: Record<string, string>, n: number) {
  return (answers[String(n)] ?? "").trim() !== "";
}

export function QuestionNavigator({
  questions,
  answers,
  flagged,
  currentNumber,
  onSelect,
  onToggleFlag,
  onPrev,
  onNext,
  showReview = true,
}: Props) {
  const { t } = useTranslations("practice");
  const currentFlagged =
    currentNumber != null ? flagged.has(currentNumber) : false;
  const idx = questions.findIndex((q) => q.number === currentNumber);
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < questions.length - 1;

  return (
    <div className="cdi-nav border-t border-zinc-400/40 bg-[#e8eaed]">
      <div className="mx-auto flex max-w-[1400px] min-w-0 flex-wrap items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3">
        {showReview ? (
          <button
            type="button"
            onClick={onToggleFlag}
            disabled={currentNumber == null}
            className={`shrink-0 rounded border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide disabled:opacity-40 ${
              currentFlagged
                ? "border-amber-700 bg-amber-100 text-amber-950"
                : "border-zinc-500 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
            aria-pressed={currentFlagged}
          >
            {t("review", "Review")}
          </button>
        ) : (
          <span className="w-0 shrink-0 sm:w-[4.5rem]" aria-hidden />
        )}

        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-zinc-500 bg-white text-sm font-bold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40"
          aria-label={t("prevQuestion", "Previous question")}
        >
          ‹
        </button>

        <div
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5"
          role="navigation"
          aria-label={t("questionNav", "Question navigator")}
        >
          {questions.map((q) => {
            const answered = isAnswered(answers, q.number);
            const isFlag = flagged.has(q.number);
            const isCurrent = q.number === currentNumber;
            const shape = isFlag ? "rounded-full" : "rounded-sm";
            return (
              <button
                type="button"
                key={q.number}
                onClick={() => onSelect(q.number)}
                className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-semibold tabular-nums ${shape} ${
                  isCurrent
                    ? "border-[#1a3a6b] bg-[#1a3a6b] text-white"
                    : "border-zinc-500 bg-white text-zinc-900 hover:bg-zinc-100"
                }`}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={
                  isFlag
                    ? t("qFlagged", { n: q.number }, "Question {n} (marked for review)")
                    : t("qNumber", { n: q.number }, "Question {n}")
                }
              >
                {q.number}
                {answered ? (
                  <span
                    className={`absolute bottom-0.5 left-1/2 h-0.5 w-3.5 -translate-x-1/2 ${
                      isCurrent ? "bg-white" : "bg-zinc-800"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-zinc-500 bg-white text-sm font-bold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40"
          aria-label={t("nextQuestion", "Next question")}
        >
          ›
        </button>
      </div>
    </div>
  );
}
