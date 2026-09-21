"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  List,
  Lock,
  PlayCircle,
} from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import { learnVocabGrammarTopicHref, learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
import { useTranslations } from "@/i18n/provider";

type Props = {
  track: VocabGrammarTrack;
  moduleTitle: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  currentSlug: string;
  currentTitle: string;
  nextTopic?: { slug: string; title: string } | null;
};

export function TopicSidebar({
  track,
  moduleTitle,
  topics,
  progress,
  currentSlug,
  currentTitle,
  nextTopic,
}: Props) {
  const { t, locale } = useTranslations("learn");

  return (
    <aside className="min-w-0 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto">
      <div className="bg-wewin-navy px-4 py-3 text-white">
        <div className="flex items-start gap-2">
          <List className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
          <p className="break-words text-sm font-bold leading-snug">{moduleTitle}</p>
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-wewin-accent-blue-bg/40 px-4 py-2.5">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="break-words text-sm font-medium text-wewin-navy">
            {t("videoLecture", "Video bài giảng")}: {currentTitle}
          </p>
        </div>
      </div>

      <div className="border-b border-zinc-200 px-4 py-3">
        <Link
          href={learnVocabGrammarTrackHref(track)}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backTrack", "← Quay lại chương học")}
        </Link>
      </div>

      {nextTopic ? (
        <div className="border-b border-zinc-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t("nextLessonLabel", "Bài học tiếp theo:")}
          </p>
          <Link
            href={learnVocabGrammarTopicHref(track, nextTopic.slug)}
            className="mt-1 block break-words text-sm font-semibold text-wewin-navy hover:underline"
          >
            {nextTopic.title}
          </Link>
        </div>
      ) : null}

      <ol className="max-h-[min(50vh,400px)] space-y-0.5 overflow-y-auto p-2 lg:max-h-none">
        {topics.map((topic, i) => {
          const unlocked = isTopicUnlocked(topic, topics, progress);
          const done = Boolean(progress.lessons[topic.id]?.exercisePassed);
          const active = topic.slug === currentSlug;
          const videoDone = Boolean(progress.lessons[topic.id]?.videoCompleted);

          const inner = (
            <>
              <span className="mt-0.5 shrink-0">
                {!unlocked ? (
                  <Lock className="h-4 w-4 text-zinc-400" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : active ? (
                  <PlayCircle className="h-4 w-4 text-wewin-navy" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-300" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium leading-snug">
                  {i + 1}. {pickLocalized(topic.title, locale)}
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  {!unlocked
                    ? t("locked")
                    : done
                      ? t("done")
                      : videoDone
                        ? t("doExercises")
                        : t("watchVideo")}
                </span>
              </span>
            </>
          );

          if (!unlocked) {
            return (
              <li key={topic.id}>
                <div className="flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-zinc-400">
                  {inner}
                </div>
              </li>
            );
          }

          return (
            <li key={topic.id}>
              <Link
                href={learnVocabGrammarTopicHref(track, topic.slug)}
                className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
                  active
                    ? "bg-wewin-accent-blue-bg text-wewin-navy"
                    : "text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
