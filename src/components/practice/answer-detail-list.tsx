"use client";

import type { GradedQuestion } from "@/lib/scoring";
import { formatAnswerDisplay, isAnswerCorrect } from "@/lib/scoring";
import { formatQuestionStem, isRedundantGapStem } from "@/lib/ui/question-type-label";
import { useTranslations } from "@/i18n/provider";

type Props = {
  items: GradedQuestion[];
  onOpenDetail: (item: GradedQuestion) => void;
};

function optionClass(
  opt: { label: string; text: string },
  item: GradedQuestion,
): string {
  if (item.status === "no_key") return "border-zinc-200";
  const isCorrectOpt =
    isAnswerCorrect(opt.label, item.correctAnswer) ||
    isAnswerCorrect(opt.text, item.correctAnswer);
  const user = item.userAnswer.trim();
  const isUserOpt =
    Boolean(user) &&
    (isAnswerCorrect(user, opt.label) ||
      user.toLowerCase() === opt.label.toLowerCase() ||
      user.toLowerCase() === opt.text.toLowerCase());

  if (isCorrectOpt) return "border-emerald-200 bg-emerald-50";
  if (isUserOpt && item.status === "wrong") return "border-red-200 bg-red-50";
  return "border-zinc-200";
}

export function AnswerDetailList({ items, onOpenDetail }: Props) {
  const { t } = useTranslations("result");
  const bySection = new Map<string, GradedQuestion[]>();
  for (const item of items) {
    const key = `${item.sectionOrder}::${item.sectionTitle}`;
    const list = bySection.get(key) ?? [];
    list.push(item);
    bySection.set(key, list);
  }

  return (
    <div className="space-y-8">
      {[...bySection.entries()].map(([key, sectionItems]) => {
        const title = key.split("::")[1] ?? t("partFallback");
        return (
          <section key={key}>
            <h3 className="mb-4 text-base font-semibold text-wewin-navy">
              {title}
            </h3>
            <div className="space-y-6 divide-y divide-wewin-border">
              {sectionItems.map((item) => {
                const options = item.options ?? [];
                const hasOptions = options.length >= 2;
                // Hide sliding-window gap fragments; notes already shown in part.
                const formatted = formatQuestionStem(item.stem, item.questionNumber);
                const stem =
                  formatted &&
                  !isRedundantGapStem(item.stem) &&
                  !isRedundantGapStem(formatted)
                    ? formatted
                    : "";
                return (
                  <article
                    key={`${item.sectionOrder}-${item.questionNumber}`}
                    id={`answer-q-${item.questionNumber}`}
                    className="min-w-0 pt-6 first:pt-0"
                  >
                    <div className="flex gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wewin-accent-blue-bg text-sm font-semibold text-wewin-navy">
                        {item.questionNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        {stem ? (
                          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                            {stem}
                          </p>
                        ) : (
                          <p className="text-sm italic text-zinc-400">
                            {t("noPrompt")}
                          </p>
                        )}

                        {hasOptions ? (
                          <div className="mt-3 space-y-2">
                            {options.map((opt) => (
                              <div
                                key={opt.label}
                                className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm ${optionClass(opt, item)}`}
                              >
                                <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-current opacity-40" />
                                <span className="min-w-0 break-words">
                                  <strong className="mr-1">{opt.label}.</strong>
                                  {opt.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 grid gap-1 break-words text-sm sm:grid-cols-2">
                            <p>
                              {t("youChose")}{" "}
                              <span className="font-semibold">
                                {item.userAnswer.trim() || t("blank")}
                              </span>
                            </p>
                            <p>
                              {t("correctAnswer")}{" "}
                              <span className="font-semibold text-emerald-700">
                                {item.status === "no_key"
                                  ? "—"
                                  : formatAnswerDisplay(item.correctAnswer)}
                              </span>
                            </p>
                          </div>
                        )}

                        {hasOptions &&
                        item.status !== "correct" &&
                        item.status !== "no_key" ? (
                          <p className="mt-2 text-sm font-semibold text-emerald-700">
                            {t("correctAnswer")}{" "}
                            {formatAnswerDisplay(item.correctAnswer)}
                          </p>
                        ) : null}

                        {item.explanation ? (
                          <details className="mt-3 text-sm">
                            <summary className="cursor-pointer font-medium text-wewin-navy">
                              {t("explanation")}
                            </summary>
                            <p className="mt-2 break-words whitespace-pre-wrap text-zinc-600">
                              {item.explanation}
                            </p>
                          </details>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => onOpenDetail(item)}
                          className="mt-3 text-sm font-medium text-wewin-navy hover:underline"
                        >
                          {t("detailLink")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
