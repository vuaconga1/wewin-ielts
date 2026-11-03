"use client";

import Link from "next/link";
import { BookMarked, Languages } from "lucide-react";
import { markSkillChallengeDoneToday } from "@/lib/client/daily-challenge-skill";
import { learnCatalogHref, learnVocabGrammarTrackHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type TrackRow = {
  track: "vocabulary" | "grammar";
  total: number;
  completed: number;
  percent: number;
};

type Props = {
  tracks: TrackRow[];
};

const ICONS = {
  vocabulary: Languages,
  grammar: BookMarked,
} as const;

const TRACK_THEMES = {
  vocabulary: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#06423b] to-[#047857]",
    iconBoxClass: "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-300/30",
    borderHoverClass: "hover:border-emerald-400/50",
    countClass: "text-emerald-100/90",
    ctaClass:
      "bg-emerald-50 border-emerald-200/70 text-emerald-800 group-hover:bg-[#06423b] group-hover:text-white group-hover:border-[#06423b]",
    progressClass: "bg-gradient-to-r from-emerald-600 to-teal-600",
  },
  grammar: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#0d2a6b] to-[#1e40af]",
    iconBoxClass: "bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/30",
    borderHoverClass: "hover:border-blue-400/50",
    countClass: "text-blue-100/90",
    ctaClass:
      "bg-blue-50 border-blue-200/70 text-blue-800 group-hover:bg-[#001233] group-hover:text-white group-hover:border-[#001233]",
    progressClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
  },
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
          const theme = TRACK_THEMES[row.track];
          const label = isVocabulary
            ? t("vocabularyTrack", "Từ vựng")
            : t("grammarTrack", "Ngữ pháp");
          const desc = isVocabulary
            ? t(
                "vocabularyTrackDesc",
                "11 chủ đề Cambridge Vocabulary — thẻ từ (phát âm, nghĩa, ví dụ)",
              )
            : t(
                "grammarTrackDesc",
                "Ngữ pháp cơ bản và lộ trình IELTS 3.0–4.0, 4.0–5.0 — slide bài giảng",
              );
          const done = row.completed === row.total && row.total > 0;
          const href = learnVocabGrammarTrackHref(row.track);
          const cta = done ? t("review", "Ôn lại →") : t("browseTopics", "Chọn chủ đề →");

          return (
            <Link
              key={row.track}
              href={href}
              onClick={markSkillChallengeDoneToday}
              className={`card-outline-hover group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${theme.borderHoverClass}`}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3.5 text-white ${theme.headerClass}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.iconBoxClass}`}
                >
                  <Icon className="h-5 w-5 opacity-95" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">{label}</h2>
                  <p className={`text-xs mt-0.5 ${theme.countClass}`}>
                    {t("lessonCount", { n: row.total }, `${row.total} bài`)}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 bg-white p-4">
                <p className="text-sm leading-snug text-zinc-600">{desc}</p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-zinc-800">
                      {row.completed}/{row.total}{" "}
                      <span className="font-medium text-zinc-600">
                        {t("completed", "hoàn thành")}
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${theme.ctaClass}`}
                    >
                      {cta}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className={`h-full rounded-full ${theme.progressClass}`}
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
