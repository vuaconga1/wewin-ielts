"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { LessonExercises } from "@/components/learn/lesson-exercises";
import { VocabWordCard } from "@/components/learn/vocab-word-card";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import {
  learnCatalogHref,
  learnVocabGrammarHref,
  learnVocabGrammarTopicHref,
  learnVocabGrammarTrackHref,
  learnVocabTopicLearnHref,
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
  const unlocked = isTopicUnlocked(topic, topics, progress);
  const entry = progress.lessons[topic.id];
  const passed = Boolean(entry?.exercisePassed);
  const words = topic.words ?? [];

  const ordered = [...topics].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((tpc) => tpc.id === topic.id);
  const nextTopic = idx >= 0 ? ordered[idx + 1] : undefined;
  const nextUnlocked =
    passed && nextTopic && isTopicUnlocked(nextTopic, topics, progress)
      ? nextTopic.slug
      : null;

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
    <div className="mx-auto min-w-0 max-w-3xl space-y-5 px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            href={learnVocabGrammarTrackHref("vocabulary")}
            className="hover:text-wewin-navy hover:underline"
          >
            {t("vocabularyTrack", "Từ vựng")}
          </Link>
          <span className="mx-1.5">›</span>
          <Link
            href={learnVocabGrammarTopicHref("vocabulary", topic.slug)}
            className="hover:text-wewin-navy hover:underline"
          >
            {displayTitle}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-medium text-zinc-800">
            {t("vocabLearnBreadcrumb", "Học từ")}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {passed ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("markComplete", "Tôi hoàn thành")}
            </span>
          ) : null}
          {prevSlug ? (
            <Link
              href={learnVocabTopicLearnHref(prevSlug)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("prevLesson", "Bài trước")}
            </Link>
          ) : null}
          {nextSlug ? (
            <Link
              href={learnVocabTopicLearnHref(nextSlug)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {t("nextLessonShort", "Bài sau")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <div>
        <Link
          href={learnVocabGrammarTopicHref("vocabulary", topic.slug)}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backToTopicOverview", "← Tổng quan chủ đề")}
        </Link>
        <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {displayTitle}
        </h1>
        {displaySummary ? (
          <p className="mt-1 break-words text-sm text-zinc-600">{displaySummary}</p>
        ) : null}
        <p className="mt-1 text-sm text-zinc-500">
          {t("wordCountLabel", { n: words.length }, "{n} từ vựng")}
        </p>
      </div>

      <section className="space-y-3" aria-label={t("vocabWordsSection", "Danh sách từ vựng")}>
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          {t("vocabWordsSection", "Danh sách từ vựng")}
        </h2>
        {words.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
            {t("contentComingSoon", "Nội dung đang cập nhật")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {words.map((w) => (
              <VocabWordCard key={`${w.word}-${w.pos ?? ""}`} entry={w} />
            ))}
          </div>
        )}
      </section>

      {topic.exercises.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xl font-bold text-zinc-900 sm:text-2xl">
            {t("exercisesSection", "Bài tập")}
          </h2>
          <LessonExercises
            courseId="vocab-grammar"
            lessonId={topic.id}
            skill="reading"
            exercises={topic.exercises}
            videoCompleted
            alreadyPassed={passed}
            unlockedNextId={nextUnlocked}
            nextLessonHref={
              nextUnlocked
                ? learnVocabGrammarTopicHref("vocabulary", nextUnlocked)
                : undefined
            }
            catalogHref={learnVocabGrammarTrackHref("vocabulary")}
            catalogLabel={t("vocabularyTrack", "Từ vựng")}
          />
        </section>
      ) : null}
    </div>
  );
}
