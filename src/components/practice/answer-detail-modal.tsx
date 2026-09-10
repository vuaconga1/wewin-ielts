"use client";

import { useEffect, useId, useRef } from "react";
import type { AnswerStatus, GradedQuestion } from "@/lib/scoring";
import { formatAnswerDisplay, isAnswerCorrect } from "@/lib/scoring";
import { formatQuestionStem, isRedundantGapStem } from "@/lib/ui/question-type-label";
import { useTranslations } from "@/i18n/provider";

type Props = {
  item: GradedQuestion | null;
  testTitle: string;
  open: boolean;
  onClose: () => void;
};

function statusClass(status: AnswerStatus): string {
  switch (status) {
    case "correct":
      return "text-emerald-700";
    case "wrong":
      return "text-red-700";
    case "skipped":
      return "text-zinc-500";
    default:
      return "text-zinc-500";
  }
}

function optionHighlight(
  opt: { label: string; text: string },
  item: GradedQuestion,
): "correct" | "wrong" | null {
  if (item.status === "no_key") return null;
  const isCorrectOpt =
    isAnswerCorrect(opt.label, item.correctAnswer) ||
    isAnswerCorrect(opt.text, item.correctAnswer);
  const user = item.userAnswer.trim();
  const isUserOpt =
    Boolean(user) &&
    (isAnswerCorrect(user, opt.label) ||
      user.toLowerCase() === opt.label.toLowerCase() ||
      user.toLowerCase() === opt.text.toLowerCase());

  if (isCorrectOpt) return "correct";
  if (isUserOpt && item.status === "wrong") return "wrong";
  return null;
}

export function AnswerDetailModal({ item, testTitle, open, onClose }: Props) {
  const { t } = useTranslations("result");
  const { t: tc } = useTranslations("common");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  function statusLabel(status: AnswerStatus): string {
    switch (status) {
      case "correct":
        return t("statusCorrect");
      case "wrong":
        return t("statusWrong");
      case "skipped":
        return t("statusSkipped");
      default:
        return t("statusNoKey");
    }
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  const options = item.options ?? [];
  const hasOptions = options.length >= 2;
  const formatted = formatQuestionStem(item.stem, item.questionNumber);
  const stem =
    formatted &&
    !isRedundantGapStem(item.stem) &&
    !isRedundantGapStem(formatted)
      ? formatted
      : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/45"
        aria-label={tc("close")}
        onClick={onClose}
      />
      <div className="relative flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        <header className="flex shrink-0 items-start gap-3 border-b border-wewin-border px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-lg font-bold text-wewin-navy sm:text-xl"
            >
              {t("detailTitle", { n: item.questionNumber })}
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{testTitle}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {item.sectionTitle}
              <span className={`ml-2 font-semibold ${statusClass(item.status)}`}>
                · {statusLabel(item.status)}
              </span>
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-wewin-navy"
            aria-label={tc("close")}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
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
                <p className="text-sm italic text-zinc-400">{t("noPrompt")}</p>
              )}
            </div>
          </div>

          {hasOptions ? (
            <div className="mt-4 space-y-2">
              {options.map((opt) => {
                const hl = optionHighlight(opt, item);
                return (
                  <div
                    key={opt.label}
                    className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                      hl === "correct"
                        ? "border-emerald-200 bg-emerald-50"
                        : hl === "wrong"
                          ? "border-red-200 bg-red-50"
                          : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        hl === "correct"
                          ? "border-emerald-600 bg-emerald-600"
                          : hl === "wrong"
                            ? "border-red-500 bg-red-500"
                            : "border-zinc-300"
                      }`}
                      aria-hidden
                    >
                      {(hl === "correct" || hl === "wrong") && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="min-w-0 break-words text-zinc-800">
                      <strong className="mr-1">{opt.label}.</strong>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 grid gap-2 break-words text-sm sm:grid-cols-2">
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-zinc-500">{t("youChose")} </span>
                <span className="font-semibold text-zinc-800">
                  {item.userAnswer.trim() || t("blank")}
                </span>
              </p>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-zinc-500">{t("correctAnswer")} </span>
                <span className="font-semibold text-emerald-800">
                  {item.status === "no_key"
                    ? "—"
                    : formatAnswerDisplay(item.correctAnswer)}
                </span>
              </p>
            </div>
          )}

          {hasOptions && item.status !== "correct" && item.status !== "no_key" ? (
            <p className="mt-3 text-sm font-semibold text-emerald-700">
              {t("correctAnswer")} {formatAnswerDisplay(item.correctAnswer)}
            </p>
          ) : null}

          {item.explanation ? (
            <details className="mt-5 rounded-lg border border-wewin-navy/15 bg-wewin-accent-blue-bg/40 px-3 py-2.5">
              <summary className="cursor-pointer text-sm font-medium text-wewin-navy">
                {t("explanation")}
              </summary>
              <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                {item.explanation}
              </p>
            </details>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">{t("noExplanation")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
