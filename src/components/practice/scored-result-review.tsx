"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { GradedQuestion } from "@/lib/scoring";
import { friendlyError } from "@/lib/ui/friendly-error";
import { FriendlyErrorAlert } from "@/components/ui/friendly-error-alert";
import { AnswerDetailModal } from "@/components/practice/answer-detail-modal";
import { AnswerDetailList } from "@/components/practice/answer-detail-list";
import { ResultQuestionGrid } from "@/components/practice/result-question-grid";
import { useTranslations } from "@/i18n/provider";

type Props = {
  testTitle: string;
  testSlug: string;
  sectionOrders: number[];
  items: GradedQuestion[];
  correct: number;
  wrong: number;
  skipped: number;
};

export function ScoredResultReview({
  testTitle,
  testSlug,
  sectionOrders,
  items,
  correct,
  wrong,
  skipped,
}: Props) {
  const router = useRouter();
  const { t } = useTranslations("result");
  const te = useTranslations("errors").t;
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [selected, setSelected] = useState<GradedQuestion | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<{ message: string; detail?: string } | null>(
    null,
  );

  const wrongNumbers = useMemo(
    () =>
      items
        .filter((i) => i.status === "wrong")
        .map((i) => i.questionNumber),
    [items],
  );

  function openDetail(item: GradedQuestion) {
    setSelected(item);
    setModalOpen(true);
  }

  function showFullDetail() {
    setView("detail");
    requestAnimationFrame(() => {
      document.getElementById("answer-detail-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function redoWrong() {
    if (wrongNumbers.length === 0 || retrying) return;
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch("/api/practice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: testSlug,
          mode: "PRACTICE",
          sectionOrders,
          questionNumbers: wrongNumbers,
          timeLimitMinutes: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const mapped = friendlyError(
          data.error,
          t("retryFailed"),
          te,
        );
        if (data.error) console.warn("[practice/start redo]", data.error);
        setError(mapped);
        return;
      }
      router.push(data.redirect);
    } catch (e) {
      console.warn("[practice/start redo]", e);
      setError(friendlyError(e, te("network"), te));
    } finally {
      setRetrying(false);
    }
  }

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-emerald-700">{t("correct")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
            {correct}
          </p>
          <p className="text-xs text-zinc-500">{t("questions")}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-red-700">{t("wrong")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-red-700">
            {wrong}
          </p>
          <p className="text-xs text-zinc-500">{t("questions")}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4">
          <p className="text-sm font-medium text-zinc-600">{t("skipped")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-600">
            {skipped}
          </p>
          <p className="text-xs text-zinc-500">{t("questions")}</p>
        </div>
      </section>

      <section className="rounded-xl border border-wewin-border bg-white p-5">
        <h2 className="font-semibold text-wewin-navy">{t("answers")}</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={showFullDetail}
            className="inline-flex items-center justify-center rounded-lg border border-wewin-navy bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("viewDetail")}
          </button>
          <button
            type="button"
            disabled={wrongNumbers.length === 0 || retrying}
            onClick={() => void redoWrong()}
            className="inline-flex items-center justify-center rounded-lg border border-wewin-navy/40 bg-white px-4 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-wewin-accent-blue-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retrying
              ? t("creating")
              : t("retryWrongBtn", { n: wrongNumbers.length })}
          </button>
        </div>
        {wrongNumbers.length > 0 ? (
          <p className="mt-2 text-xs text-red-600">
            {t("retryWarning")}
          </p>
        ) : null}

        {error ? (
          <div className="mt-3">
            <FriendlyErrorAlert message={error.message} detail={error.detail} />
          </div>
        ) : null}

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-800">
            {t("detailAnalysis")}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {t("legend")}
          </p>
          <div className="mt-3">
            <ResultQuestionGrid items={items} onSelect={openDetail} />
          </div>
        </div>
      </section>

      {view === "detail" ? (
        <section
          id="answer-detail-section"
          className="rounded-xl border border-wewin-border bg-white p-5"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-wewin-navy">{t("answerDetail")}</h2>
              <p className="mt-0.5 text-sm text-zinc-500">{testTitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setView("summary")}
              className="text-sm font-medium text-wewin-navy hover:underline"
            >
              {t("backOverview")}
            </button>
          </div>
          <AnswerDetailList items={items} onOpenDetail={openDetail} />
        </section>
      ) : null}

      <AnswerDetailModal
        item={selected}
        testTitle={testTitle}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
