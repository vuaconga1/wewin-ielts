"use client";

import Link from "next/link";
import { BookOpen, ChevronLeft, Lock } from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import {
  learnCatalogHref,
  learnVocabGrammarHref,
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
};

export function VocabTopicOverview({
  topic,
  displayTitle,
  displaySummary,
  topics,
  progress,
}: Props) {
  const { t } = useTranslations("learn");
  const unlocked =
    topic.track === "vocabulary" ||
    isTopicUnlocked(topic, topics, progress, "vocabulary");
  const wordCount = topic.wordCount ?? topic.words?.length ?? 0;
  const passed = Boolean(progress.lessons[topic.id]?.exercisePassed);

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
    <div className="mx-auto min-w-0 max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <Link
          href={learnVocabGrammarTrackHref("vocabulary")}
          className="inline-flex items-center gap-1 text-sm font-medium text-wewin-navy hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToVocabulary", "Quay lại Từ vựng")}
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
          <Link
            href={learnVocabGrammarTrackHref("vocabulary")}
            className="hover:text-wewin-navy hover:underline"
          >
            {t("vocabularyTrack", "Từ vựng")}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="break-words font-medium text-zinc-800">{displayTitle}</span>
        </nav>
      </div>

      <header className="min-w-0 rounded-xl border border-zinc-200 bg-white overflow-hidden">
        <div className="flex items-start gap-3 bg-wewin-navy px-4 py-4 text-white sm:px-5">
          <BookOpen className="mt-0.5 h-6 w-6 shrink-0 opacity-90" />
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold leading-tight sm:text-2xl">
              {displayTitle}
            </h1>
            {topic.stub ? (
              <p className="mt-1 text-xs text-amber-200">
                {t("contentComingSoon", "Nội dung đang cập nhật")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="space-y-4 px-4 py-5 sm:px-5">
          {displaySummary ? (
            <p className="break-words text-sm leading-relaxed text-zinc-600 sm:text-base">
              {displaySummary}
            </p>
          ) : null}

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
            <li>
              {t("wordCountLabel", { n: wordCount }, "{n} từ vựng")}
            </li>
            {passed ? (
              <li className="font-medium text-emerald-700">{t("done")}</li>
            ) : null}
          </ul>

          <p className="text-sm text-zinc-500">
            {t(
              "vocabOverviewHint",
              "Học thẻ từ: phát âm, nghĩa tiếng Việt và ví dụ.",
            )}
          </p>

          <Link
            href={learnVocabTopicLearnHref(topic.slug)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
          >
            {t("startLearningVocab", "Bắt đầu học")}
          </Link>
        </div>
      </header>
    </div>
  );
}
