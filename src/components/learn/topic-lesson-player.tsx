"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import { LessonVideo } from "@/components/learn/lesson-video";
import { LessonSlides } from "@/components/learn/lesson-slides";
import { LessonExercises } from "@/components/learn/lesson-exercises";
import { TheoryPanel } from "@/components/learn/theory-panel";
import { TopicSidebar } from "@/components/learn/topic-sidebar";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { GrammarCourse, VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
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
  /** Grammar course the topic belongs to (back links return to its tab). */
  course?: GrammarCourse;
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
  course,
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
  const trackHref = learnVocabGrammarTrackHref(track, course);
  const unlocked = isTopicUnlocked(topic, topics, progress);
  const entry = progress.lessons[topic.id];
  const [videoCompleted, setVideoCompleted] = useState(
    Boolean(entry?.videoCompleted),
  );
  const [passed, setPassed] = useState(Boolean(entry?.exercisePassed));
  const isSlides = Boolean(topic.slidesUrl);

  // Slide decks have no exercises — opening the deck counts as completion.
  useEffect(() => {
    if (!isSlides || passed) return;
    let cancelled = false;
    void fetch("/api/learn/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", lessonId: topic.id }),
    })
      .then((res) => {
        if (!cancelled && res.ok) setPassed(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSlides, passed, topic.id]);

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
          href={trackHref}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("backCurriculum")}
        </Link>
      </div>
    );
  }

  const hasExtraContent = Boolean(
    theoryHtml.trim() || slidesHtml || topic.exercises.length > 0,
  );

  return (
    <div className="region-split flex flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] min-w-0 h-full min-h-0">
      <div className="min-w-0 border-b border-zinc-200 lg:border-b-0 lg:border-r shrink-0 lg:shrink lg:h-full lg:min-h-0 flex flex-col overflow-visible lg:overflow-hidden">
        <TopicSidebar
          track={track}
          course={course}
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

      <div
        className={`min-w-0 flex-1 flex flex-col h-full min-h-0 p-3 sm:p-4 ${
          hasExtraContent ? "overflow-y-auto space-y-3" : "overflow-hidden"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0 pb-2 border-b border-zinc-100">
          <div className="min-w-0">
            <nav className="min-w-0 text-xs text-zinc-500 flex items-center flex-wrap gap-1">
              <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline shrink-0">
                {t("catalogTitle", "Chọn khóa học")}
              </Link>
              <span className="text-zinc-400">›</span>
              <Link
                href={learnVocabGrammarHref()}
                className="hover:text-wewin-navy hover:underline shrink-0"
              >
                {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
              </Link>
              <span className="text-zinc-400">›</span>
              <Link
                href={trackHref}
                className="hover:text-wewin-navy hover:underline shrink-0"
              >
                {trackLabel}
              </Link>
              <span className="text-zinc-400">›</span>
              <span className="truncate font-semibold text-zinc-800" title={displayTitle}>
                {displayTitle}
              </span>
            </nav>
            {displaySummary ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500" title={displaySummary}>
                {displaySummary}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
            {passed ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("markComplete", "Tôi hoàn thành")}
              </span>
            ) : null}
            {prevSlug ? (
              <Link
                href={learnVocabGrammarTopicHref(track, prevSlug)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>{t("prevLesson", "Bài trước")}</span>
              </Link>
            ) : null}
            {nextSlug ? (
              <Link
                href={learnVocabGrammarTopicHref(track, nextSlug)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 shadow-xs"
              >
                <span>{t("nextLessonShort", "Bài sau")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
        </div>

        {topic.slidesUrl ? (
          <div className="flex-1 min-h-0 w-full flex items-center justify-center pt-1">
            <LessonSlides src={topic.slidesUrl} title={displayTitle} />
          </div>
        ) : (
          <LessonVideo
            src={topic.videoUrl}
            lessonId={topic.id}
            initialMaxWatchedSec={entry?.maxWatchedSec ?? 0}
            alreadyCompleted={Boolean(entry?.videoCompleted)}
            onCompleted={() => setVideoCompleted(true)}
          />
        )}

        {theoryHtml.trim() || slidesHtml ? (
          <TheoryPanel
            theoryHtml={theoryHtml}
            slidesHtml={slidesHtml}
            stub={topic.stub}
          />
        ) : null}

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
              videoCompleted={videoCompleted}
              alreadyPassed={passed}
              unlockedNextId={nextUnlocked}
              nextLessonHref={
                nextUnlocked
                  ? learnVocabGrammarTopicHref(track, nextUnlocked)
                  : undefined
              }
              catalogHref={trackHref}
              catalogLabel={trackLabel}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
