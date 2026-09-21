"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { LessonVideo } from "@/components/learn/lesson-video";
import { LessonExercises } from "@/components/learn/lesson-exercises";
import { TheoryPanel } from "@/components/learn/theory-panel";
import { TopicSidebar } from "@/components/learn/topic-sidebar";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import {
  learnCatalogHref,
  learnVocabGrammarHref,
  learnVocabGrammarTopicHref,
  learnVocabGrammarTrackHref,
} from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type Props = {
  track: VocabGrammarTrack;
  moduleTitle: string;
  trackLabel: string;
  topic: PublicTopicLesson;
  displayTitle: string;
  displaySummary: string;
  theoryHtml: string;
  slidesHtml?: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  prevSlug: string | null;
  nextSlug: string | null;
  nextTitle: string | null;
};

export function TopicLessonPlayer({
  track,
  moduleTitle,
  trackLabel,
  topic,
  displayTitle,
  displaySummary,
  theoryHtml,
  slidesHtml,
  topics,
  progress,
  prevSlug,
  nextSlug,
  nextTitle,
}: Props) {
  const { t } = useTranslations("learn");
  const unlocked = isTopicUnlocked(topic, topics, progress);
  const entry = progress.lessons[topic.id];
  const [videoCompleted, setVideoCompleted] = useState(
    Boolean(entry?.videoCompleted),
  );
  const passed = Boolean(entry?.exercisePassed);

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
          href={learnVocabGrammarTrackHref(track)}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("backCurriculum")}
        </Link>
      </div>
    );
  }

  return (
    <div className="region-split grid min-w-0 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="min-w-0 border-b border-zinc-200 lg:border-b-0 lg:border-r">
        <TopicSidebar
          track={track}
          moduleTitle={moduleTitle}
          topics={topics}
          progress={progress}
          currentSlug={topic.slug}
          currentTitle={displayTitle}
          nextTopic={
            nextTopic && nextTitle && isTopicUnlocked(nextTopic, topics, progress)
              ? { slug: nextTopic.slug, title: nextTitle }
              : null
          }
        />
      </div>

      <div className="min-w-0 space-y-5 p-4 sm:p-6">
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
              href={learnVocabGrammarTrackHref(track)}
              className="hover:text-wewin-navy hover:underline"
            >
              {trackLabel}
            </Link>
            <span className="mx-1.5">›</span>
            <span className="break-words font-medium text-zinc-800">{displayTitle}</span>
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
                href={learnVocabGrammarTopicHref(track, prevSlug)}
                className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("prevLesson", "Bài trước")}
              </Link>
            ) : null}
            {nextSlug ? (
              <Link
                href={learnVocabGrammarTopicHref(track, nextSlug)}
                className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t("nextLessonShort", "Bài sau")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {displaySummary ? (
          <p className="break-words text-sm text-zinc-600">{displaySummary}</p>
        ) : null}

        <LessonVideo
          src={topic.videoUrl}
          lessonId={topic.id}
          initialMaxWatchedSec={entry?.maxWatchedSec ?? 0}
          alreadyCompleted={Boolean(entry?.videoCompleted)}
          onCompleted={() => setVideoCompleted(true)}
        />

        <TheoryPanel
          theoryHtml={theoryHtml}
          slidesHtml={slidesHtml}
          stub={topic.stub}
        />

        <section>
          <h2 className="mb-3 text-xl font-bold text-zinc-900 sm:text-2xl">
            {t("exercisesSection", "Bài tập")}
          </h2>
          <LessonExercises
            courseId="vocab-grammar"
            lessonId={topic.id}
            skill="reading"
            exercises={topic.exercises}
            videoCompleted={videoCompleted}
            alreadyPassed={passed}
            unlockedNextId={nextUnlocked}
            nextLessonHref={
              nextUnlocked
                ? learnVocabGrammarTopicHref(track, nextUnlocked)
                : undefined
            }
            catalogHref={learnVocabGrammarTrackHref(track)}
            catalogLabel={trackLabel}
          />
        </section>
      </div>
    </div>
  );
}
