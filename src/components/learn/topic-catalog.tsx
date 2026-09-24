"use client";

import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
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
  track: VocabGrammarTrack;
  trackLabel: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
};

export function TopicCatalog({
  track,
  trackLabel,
  topics,
  progress,
}: Props) {
  const { t, locale } = useTranslations("learn");
  const isVocabulary = track === "vocabulary";

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={learnVocabGrammarHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backVocabGrammar", "← Từ vựng và ngữ pháp")}
        </Link>
        <nav className="mt-2 text-xs text-zinc-500 sm:text-sm">
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
          <span className="font-medium text-zinc-800">{trackLabel}</span>
        </nav>
        <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {trackLabel}
        </h1>
        {!isVocabulary ? (
          <p className="mt-1 text-sm text-zinc-600">
            {t(
              "topicCatalogDesc",
              "Chọn chủ đề để xem video, lý thuyết và làm 10 câu bài tập.",
            )}
          </p>
        ) : null}
      </header>

      <div
        className={
          isVocabulary
            ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {topics.map((topic) => {
          // Vocabulary: always open (no sequential unlock).
          const unlocked =
            isVocabulary || isTopicUnlocked(topic, topics, progress);
          const done = Boolean(progress.lessons[topic.id]?.exercisePassed);
          // Vocabulary titles stay English (same in vi/en).
          const title = isVocabulary
            ? topic.title.en
            : pickLocalized(topic.title, locale);
          const summary = pickLocalized(topic.summary, locale);

          const cardInner = (
            <>
              <div className="flex items-start gap-3 bg-wewin-navy px-4 py-3 text-white">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 opacity-90" />
                <div className="min-w-0">
                  <h2 className="break-words text-base font-bold leading-tight">{title}</h2>
                  {topic.stub ? (
                    <p className="mt-0.5 text-xs text-amber-200">
                      {t("contentComingSoon", "Nội dung đang cập nhật")}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 border-t border-zinc-200 px-4 py-3">
                <p className="line-clamp-2 text-sm leading-snug text-zinc-600">{summary}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    {isVocabulary && (topic.wordCount ?? 0) > 0
                      ? t(
                          "wordCountLabel",
                          { n: topic.wordCount ?? 0 },
                          "{n} từ vựng",
                        )
                      : t(
                          "exerciseCount",
                          { n: topic.exerciseCount ?? topic.exercises.length },
                          "{n} câu bài tập",
                        )}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      done
                        ? "bg-emerald-50 text-emerald-700"
                        : unlocked
                          ? "bg-wewin-accent-blue-bg text-wewin-navy"
                          : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {done
                      ? t("done")
                      : unlocked
                        ? t("study", "Học")
                        : t("locked")}
                  </span>
                </div>
              </div>
            </>
          );

          if (!unlocked) {
            return (
              <div
                key={topic.id}
                className="card-outline flex flex-col overflow-hidden opacity-75"
              >
                {cardInner}
                <div className="flex items-center gap-1 border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500">
                  <Lock className="h-3.5 w-3.5" />
                  {t("unlockTitle")}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={topic.id}
              href={
                isVocabulary
                  ? learnVocabTopicLearnHref(topic.slug)
                  : learnVocabGrammarTopicHref(track, topic.slug)
              }
              className="card-outline-hover group flex flex-col overflow-hidden border-zinc-300"
            >
              {cardInner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
