"use client";

import Link from "next/link";
import { BookMarked, Languages } from "lucide-react";
import { markSkillChallengeDoneToday } from "@/lib/client/daily-challenge-skill";
import {
  learnCatalogHref,
  learnVocabGrammarTopicHref,
  learnVocabGrammarTrackHref,
} from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type TrackRow = {
  track: "vocabulary" | "grammar";
  total: number;
  completed: number;
  percent: number;
  nextSlug: string | null;
};

type Props = {
  tracks: TrackRow[];
};

const ICONS = {
  vocabulary: Languages,
  grammar: BookMarked,
} as const;

export function VocabGrammarHub({ tracks }: Props) {
  const { t } = useTranslations("learn");

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={learnCatalogHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backCatalog", "← Tất cả khóa học")}
        </Link>
        <nav className="mt-2 text-xs text-zinc-500 sm:text-sm">
          <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline">
            {t("catalogTitle", "Chọn khóa học")}
          </Link>
          <span className="mx-1.5">›</span>
          <span className="font-medium text-zinc-800">
            {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
          </span>
        </nav>
        <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t("vocabGrammarDesc", "Học từ vựng và ngữ pháp IELTS qua video, lý thuyết và bài tập.")}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {tracks.map((row) => {
          const Icon = ICONS[row.track];
          const isVocabulary = row.track === "vocabulary";
          const label = isVocabulary
            ? t("vocabularyTrack", "Từ vựng")
            : t("grammarTrack", "Ngữ pháp");
          const desc = isVocabulary
            ? t(
                "vocabularyTrackDesc",
                "11 chủ đề Cambridge Vocabulary — thẻ từ (phát âm, nghĩa, ví dụ)",
              )
            : t("grammarTrackDesc", "24 chủ đề ngữ pháp IELTS — video, lý thuyết, 10 câu/bài");
          const done = row.completed === row.total && row.total > 0;
          // Vocabulary always opens the topic grid; grammar may continue to next topic.
          const href = isVocabulary
            ? learnVocabGrammarTrackHref("vocabulary")
            : row.nextSlug
              ? learnVocabGrammarTopicHref("grammar", row.nextSlug)
              : learnVocabGrammarTrackHref("grammar");
          const cta = done
            ? t("review", "Ôn lại →")
            : isVocabulary
              ? t("browseTopics", "Chọn chủ đề →")
              : t("continueLearn", "Học tiếp →");

          return (
            <Link
              key={row.track}
              href={href}
              onClick={markSkillChallengeDoneToday}
              className="card-outline-hover group flex flex-col overflow-hidden border-zinc-300"
            >
              <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white">
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">{label}</h2>
                  <p className="text-xs text-white/85">
                    {t("lessonCount", { n: row.total }, "{n} bài")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 border-t border-zinc-200 px-4 py-3">
                <p className="text-sm leading-snug text-zinc-600">{desc}</p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-zinc-800">
                      {row.completed}/{row.total}{" "}
                      <span className="font-medium text-zinc-600">
                        {t("completed", "hoàn thành")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md bg-wewin-accent-blue-bg px-2 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                      {cta}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-wewin-navy"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
