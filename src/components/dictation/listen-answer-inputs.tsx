"use client";

import type { PublicListenQuestion } from "@/lib/dictation/types";
import { countWords, MAX_QA_ANSWER_CHARS } from "@/lib/dictation/listen-answer";
import { useTranslations } from "@/i18n/provider";

type Props = {
  questions: PublicListenQuestion[];
  answers: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
  disabled?: boolean;
};

export function ListenAnswerInputs({ questions, answers, onChange, disabled }: Props) {
  const { t } = useTranslations("dictation");
  return (
    <ol className="space-y-3">
      {questions.map((q) => {
        const value = answers[q.id] ?? "";
        const words = countWords(value);
        const over = q.maxWords != null && words > q.maxWords;
        const inputId = `qa-${q.id}`;
        const hintId = `${inputId}-hint`;
        return (
          <li key={q.id} className="min-w-0 space-y-1.5">
            <label htmlFor={inputId} className="flex min-w-0 gap-2 text-base font-medium text-zinc-900">
              <span className="shrink-0 tabular-nums text-wewin-navy">{q.index + 1}.</span>
              <span className="min-w-0 break-words">{q.prompt}</span>
            </label>
            <input
              id={inputId}
              value={value}
              onChange={(e) => onChange(q.id, e.target.value)}
              disabled={disabled}
              maxLength={MAX_QA_ANSWER_CHARS}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              lang="en"
              aria-describedby={q.maxWords != null ? hintId : undefined}
              aria-invalid={over || undefined}
              placeholder={t("qaPlaceholder", "Câu trả lời của bạn (tiếng Anh)…")}
              className={`w-full rounded-xl border-2 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none transition-colors focus:border-wewin-navy focus:ring-2 focus:ring-wewin-accent-blue-bg disabled:opacity-60 ${
                over ? "border-rose-400" : value.trim() ? "border-wewin-navy/50" : "border-zinc-200"
              }`}
            />
            {q.maxWords != null ? (
              <p id={hintId} className={`text-xs ${over ? "text-rose-600" : "text-zinc-500"}`}>
                {t(
                  "qaWordLimit",
                  { n: q.maxWords, count: words },
                  "Tối đa {n} từ — đang dùng {count} từ",
                )}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
