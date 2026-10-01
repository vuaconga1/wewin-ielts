"use client";

import type { MutableRefObject } from "react";
import { useTranslations } from "@/i18n/provider";
import {
  getCoveredNumbers,
  isMultiSelectQuestion,
} from "@/lib/practice/multi-select";
import {
  choiceLabelsAreWords,
  dropdownChoiceLabel,
  optionBankIsLetterOnly,
  optionBankUsesWordGrid,
  type ChoiceOption,
} from "@/lib/practice/shared-choice";
import {
  formatQuestionStem,
  shouldHideStemBesideNotes,
} from "@/lib/ui/question-type-label";

type ChoiceQuestion = {
  number: number;
  type: string;
  content: {
    stem?: string;
    options?: ChoiceOption[];
    selectCount?: number;
    covers?: number[];
    pairedFrom?: number;
    blank?: boolean;
  };
};

type Props = {
  questions: ChoiceQuestion[];
  answers: Record<string, string>;
  onChange: (n: number, value: string) => void;
  currentNumber: number | null;
  questionRefs: MutableRefObject<Map<number, HTMLElement>>;
  onFocusQuestion: (n: number) => void;
  compactStem?: boolean;
  /** Paper label for a shared bank, such as "List of Headings". */
  bankTitle?: string;
};

function sameText(label: string, text: string): boolean {
  return label.localeCompare(text, undefined, { sensitivity: "accent" }) === 0;
}

function showStem(question: ChoiceQuestion, compactStem: boolean): boolean {
  const raw = question.content.stem ?? "";
  const stem = formatQuestionStem(raw, question.number);
  const options = question.content.options ?? [];
  const hide = shouldHideStemBesideNotes({
    compactStem,
    questionType: question.type,
    stem: raw,
    optionCount: options.length,
  });
  return Boolean(stem) && !hide;
}

export function OptionBank({
  options,
  title,
}: {
  options: ChoiceOption[];
  title?: string;
}) {
  if (optionBankIsLetterOnly(options)) return null;

  if (optionBankUsesWordGrid(options)) {
    const yearGrid = options.every((opt) => /^\d{3,4}$/.test(opt.text.trim()));
    const cols = yearGrid ? 4 : 3;
    const lastRowStart =
      options.length - ((options.length % cols) || cols);
    return (
      <div className="overflow-hidden border border-zinc-700 bg-white">
        {title ? (
          <p className="border-b border-zinc-700 px-2 py-2 text-center text-sm font-bold text-zinc-900">
            {title}
          </p>
        ) : null}
        <div className={yearGrid ? "grid grid-cols-4" : "grid grid-cols-1 sm:grid-cols-3"}>
        {options.map((opt, index) => {
          const label = opt.label.trim();
          const text = opt.text.trim();
          const endOfRow = (index + 1) % cols === 0;
          const notLastRow = index < lastRowStart;
          return (
            <div
              key={`${label}-${text}`}
              className={`flex min-w-0 items-start gap-2 px-2.5 py-2 text-sm leading-relaxed text-zinc-900 ${
                notLastRow ? "border-b border-zinc-300" : ""
              } ${
                endOfRow ? "" : "sm:border-r sm:border-zinc-300"
              }`}
            >
              <span className="shrink-0 font-bold">{label}</span>
              <span className="min-w-0 break-words">{text}</span>
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 border border-zinc-700 bg-white">
      {title ? (
        <p className="break-words border-b border-zinc-700 px-2 py-2 text-center text-sm font-bold text-zinc-900">
          {title}
        </p>
      ) : null}
      {options.map((opt) => {
        const label = opt.label.trim();
        const text = opt.text.trim();
        const wordOnly = !text || sameText(label, text);
        return (
          <div
            key={`${label}-${text}`}
            className="flex min-w-0 items-start gap-3 border-b border-zinc-200 px-3 py-2 text-sm leading-relaxed text-zinc-900 last:border-b-0"
          >
            {wordOnly ? (
              <span className="min-w-0 break-words font-semibold">{label}</span>
            ) : (
              <>
                <span className="w-8 shrink-0 font-semibold tabular-nums">
                  {label}
                </span>
                <span className="min-w-0 break-words">{text}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnswerSelect({
  number,
  options,
  value,
  active,
  wide,
  onChange,
  onFocus,
}: {
  number: number;
  options: ChoiceOption[];
  value: string;
  active: boolean;
  wide: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
}) {
  const { t } = useTranslations("practice");
  return (
    <select
      value={options.some((opt) => opt.label === value) ? value : ""}
      aria-label={t("chooseAnswerFor", { n: number }, "Đáp án câu {n}")}
      onFocus={onFocus}
      onChange={(e) => onChange(e.target.value)}
      className={`shrink-0 rounded-sm border bg-white px-2 py-2 text-sm font-semibold text-zinc-900 outline-none ${
        wide ? "w-full sm:w-44" : "w-full sm:w-24"
      } ${
        active
          ? "border-[#1a3a6b] ring-1 ring-[#1a3a6b]/40"
          : "border-zinc-400 focus:border-[#1a3a6b]"
      }`}
    >
      <option value="">{t("chooseAnswer", "Chọn")}</option>
      {options.map((opt) => (
        <option key={opt.label} value={opt.label}>
          {dropdownChoiceLabel(opt)}
        </option>
      ))}
    </select>
  );
}

export function SharedChoiceAnswers({
  questions,
  answers,
  onChange,
  currentNumber,
  questionRefs,
  onFocusQuestion,
  compactStem = false,
  bankTitle,
}: Props) {
  const options = questions[0]?.content.options ?? [];
  if (options.length < 2) return null;
  const wide = choiceLabelsAreWords(options);

  return (
    <div className="min-w-0 space-y-4 border-b border-zinc-200 pb-5 last:border-0 last:pb-0">
      <OptionBank options={options} title={bankTitle} />
      <div className="space-y-4">
        {questions.map((question) => {
          const multi = isMultiSelectQuestion(question.content);
          const covers = multi
            ? getCoveredNumbers(question.number, question.content)
            : [question.number];
          const stem = formatQuestionStem(
            question.content.stem ?? "",
            question.number,
          );
          const visibleStem = showStem(question, compactStem);
          return (
            <div
              key={question.number}
              ref={(el) => {
                for (const n of covers) {
                  if (el) questionRefs.current.set(n, el);
                  else questionRefs.current.delete(n);
                }
              }}
              data-q={question.number}
              className="min-w-0 space-y-2"
            >
              {multi && visibleStem ? (
                <p className="min-w-0 break-words whitespace-pre-wrap text-sm text-zinc-800">
                  {stem}
                </p>
              ) : null}
              {covers.map((n) => (
                <div
                  key={n}
                  className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                >
                  {multi || !visibleStem ? (
                    <span className="pt-2 font-semibold tabular-nums text-zinc-800">
                      {n}.
                    </span>
                  ) : (
                    <p className="min-w-0 flex-1 break-words whitespace-pre-wrap text-sm text-zinc-800">
                      <span className="mr-1.5 font-semibold tabular-nums">
                        {n}.
                      </span>
                      {stem}
                    </p>
                  )}
                  <AnswerSelect
                    number={n}
                    options={options}
                    value={answers[String(n)] ?? ""}
                    active={currentNumber === n}
                    wide={wide}
                    onFocus={() => onFocusQuestion(n)}
                    onChange={(value) => onChange(n, value)}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
