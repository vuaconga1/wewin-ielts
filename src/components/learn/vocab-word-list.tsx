"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  List,
  Lock,
} from "lucide-react";
import { VocabWordCard } from "@/components/learn/vocab-word-card";
import { VocabFlashcards } from "@/components/learn/vocab-flashcards";
import { topicCollection } from "@/lib/learn/vocab-grammar-types";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import {
  learnCatalogHref,
  learnVocabGrammarHref,
  learnVocabGrammarTrackHref,
  learnVocabTopicLearnHref,
  learnVocabularyHref,
} from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type Props = {
  topic: PublicTopicLesson;
  displayTitle: string;
  displaySummary: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  prevSlug: string | null;
  nextSlug: string | null;
};

export function VocabWordList({
  topic,
  displayTitle,
  displaySummary,
  topics,
  progress,
  prevSlug,
  nextSlug,
}: Props) {
  const { t } = useTranslations("learn");
  const unlocked =
    topic.track === "vocabulary" ||
    isTopicUnlocked(topic, topics, progress, "vocabulary");
  const [passed, setPassed] = useState(
    Boolean(progress.lessons[topic.id]?.exercisePassed),
  );
  const [pending, startTransition] = useTransition();
  const words = topic.words ?? [];
  const collection = topicCollection(topic);
  const [view, setView] = useState<"flashcards" | "list">(
    collection === "topics" ? "flashcards" : "list",
  );

  // Mark topic complete on first view (no exercises for vocabulary).
  useEffect(() => {
    if (passed || !unlocked || words.length === 0) return;
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/learn/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", lessonId: topic.id }),
        });
        if (!cancelled && res.ok) setPassed(true);
      } catch {
        // ignore — completion is best-effort
      }
    });
    return () => {
      cancelled = true;
    };
  }, [passed, unlocked, words.length, topic.id]);

  if (!unlocked) {
    return (
      <div className="card-outline px-6 py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-zinc-400" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900">{t("lessonLocked")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
          {t("lessonLockedDesc")}
        </p>
        <Link
          href={learnVocabGrammarTrackHref("vocabulary")}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("backCurriculum")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-w-0 max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="min-w-0 text-xs text-zinc-500 sm:text-sm">
          <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline">
            {t("catalogTitle", "Chọn khóa học")}
          </Link>
          <span className="mx-1.5">›</span>
          <Link
            href={learnVocabGrammarHref()}
            className="hover:text-wewin-navy hover:underline"
          >
            {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
          </Link>
          <span className="mx-1.5">›</span>
          <Link
            href={learnVocabularyHref(collection)}
            className="hover:text-wewin-navy hover:underline"
          >
            {t("vocabularyTrack", "Từ vựng")}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-medium text-zinc-800">
            {t("vocabLearnBreadcrumb", "Học từ")}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {passed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("markComplete", "Tôi hoàn thành")}
            </span>
          ) : pending ? (
            <span className="text-sm text-zinc-500">
              {t("vocabSavingProgress", "Đang lưu…")}
            </span>
          ) : null}
          {prevSlug ? (
            <Link
              href={learnVocabTopicLearnHref(prevSlug)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("prevLesson", "Bài trước")}
            </Link>
          ) : null}
          {nextSlug ? (
            <Link
              href={learnVocabTopicLearnHref(nextSlug)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              {t("nextLessonShort", "Bài sau")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-5 shadow-sm sm:px-7 sm:py-6">
        <Link
          href={learnVocabularyHref(collection)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-wewin-navy transition hover:text-wewin-accent-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToVocabulary", "← Quay lại Từ vựng")}
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-wewin-accent-blue">{t("vocabularyTrack", "Vocabulary")}</p>
            <h1 className="mt-1.5 break-words text-2xl font-bold tracking-tight text-wewin-navy sm:text-3xl">
              {displayTitle}
            </h1>
            {displaySummary ? (
              <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-zinc-600">{displaySummary}</p>
            ) : null}
          </div>
          <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{t("vocabWordsSection", "Vocabulary list")}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-wewin-navy">{t("wordCountLabel", { n: words.length }, "{n} words")}</p>
          </div>
        </div>
      </header>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-label={t("vocabWordsSection", "Danh sách từ vựng")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-wewin-navy sm:text-xl">
            {view === "flashcards"
              ? t("vocabFlashcardsSection", "Flashcard")
              : t("vocabWordsSection", "Danh sách từ vựng")}
          </h2>
          {words.length > 0 ? (
            <div
              role="tablist"
              className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
            >
              {(["flashcards", "list"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={view === mode}
                  onClick={() => setView(mode)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                    view === mode
                      ? "bg-wewin-navy text-white shadow-sm"
                      : "text-zinc-600 hover:bg-slate-50 hover:text-wewin-navy"
                  }`}
                >
                  {mode === "flashcards" ? (
                    <Layers className="h-4 w-4" />
                  ) : (
                    <List className="h-4 w-4" />
                  )}
                  {mode === "flashcards"
                    ? t("vocabViewFlashcards", "Flashcard")
                    : t("vocabViewList", "Danh sách")}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {words.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            {t("contentComingSoon", "Nội dung đang cập nhật")}
          </p>
        ) : view === "flashcards" ? (
          <VocabFlashcards words={words} />
        ) : (
          <div className="flex flex-col gap-3">
            {words.map((w) => (
              <VocabWordCard key={`${w.word}-${w.pos ?? ""}`} entry={w} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
