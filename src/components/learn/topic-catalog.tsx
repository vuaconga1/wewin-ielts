"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Ear, Languages, Lock, Mic, PenLine } from "lucide-react";
import type { LearnProgressStore } from "@/lib/learn/types";
import type { PublicTopicLesson } from "@/lib/learn/vocab-grammar-public";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";
import { pickLocalized } from "@/lib/learn/vocab-grammar-types";
import { isTopicUnlocked } from "@/lib/learn/progress-utils";
import {
  learnCatalogHref,
  learnVocabGrammarHref,
  learnVocabGrammarTopicHref,
  learnVocabTopicLearnHref,
} from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type TopicHue = {
  /** Header gradients from easiest (first lesson in the theme) to hardest. */
  steps: [string, string, string];
  borderHoverClass: string;
  badgeClass: string;
  metaClass: string;
  bodyClass: string;
};

/** One dominant hue per theme, assigned in lesson order. */
const THEME_HUES: TopicHue[] = [
  {
    steps: ["from-sky-500 to-blue-600", "from-blue-600 to-blue-800", "from-blue-800 to-[#0b1d5c]"],
    borderHoverClass: "hover:border-blue-400/60",
    badgeClass:
      "bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700",
    metaClass: "text-blue-900/60",
    bodyClass: "bg-gradient-to-b from-blue-50/70 to-white",
  },
  {
    steps: ["from-emerald-500 to-teal-600", "from-teal-600 to-emerald-800", "from-emerald-800 to-[#053b33]"],
    borderHoverClass: "hover:border-emerald-400/60",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700",
    metaClass: "text-emerald-900/60",
    bodyClass: "bg-gradient-to-b from-emerald-50/70 to-white",
  },
  {
    steps: ["from-violet-500 to-purple-600", "from-purple-600 to-violet-800", "from-violet-800 to-[#2e1065]"],
    borderHoverClass: "hover:border-violet-400/60",
    badgeClass:
      "bg-violet-50 text-violet-700 border border-violet-200 group-hover:bg-violet-700 group-hover:text-white group-hover:border-violet-700",
    metaClass: "text-violet-900/60",
    bodyClass: "bg-gradient-to-b from-violet-50/70 to-white",
  },
  {
    steps: ["from-amber-500 to-orange-500", "from-orange-500 to-orange-700", "from-orange-700 to-[#5a1d06]"],
    borderHoverClass: "hover:border-orange-400/60",
    badgeClass:
      "bg-orange-50 text-orange-700 border border-orange-200 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600",
    metaClass: "text-orange-900/60",
    bodyClass: "bg-gradient-to-b from-orange-50/70 to-white",
  },
  {
    steps: ["from-rose-500 to-pink-600", "from-rose-600 to-rose-800", "from-rose-800 to-[#4c0519]"],
    borderHoverClass: "hover:border-rose-400/60",
    badgeClass:
      "bg-rose-50 text-rose-700 border border-rose-200 group-hover:bg-rose-700 group-hover:text-white group-hover:border-rose-700",
    metaClass: "text-rose-900/60",
    bodyClass: "bg-gradient-to-b from-rose-50/70 to-white",
  },
  {
    steps: ["from-cyan-500 to-sky-600", "from-cyan-600 to-cyan-800", "from-cyan-800 to-[#083344]"],
    borderHoverClass: "hover:border-cyan-400/60",
    badgeClass:
      "bg-cyan-50 text-cyan-700 border border-cyan-200 group-hover:bg-cyan-700 group-hover:text-white group-hover:border-cyan-700",
    metaClass: "text-cyan-900/60",
    bodyClass: "bg-gradient-to-b from-cyan-50/70 to-white",
  },
];

/** Standalone milestones (diagnostic, progress review…) share a navy checkpoint hue. */
const CHECKPOINT_HUE: TopicHue = {
  steps: ["from-slate-500 to-slate-700", "from-slate-700 to-[#1a2b55]", "from-[#1a2b55] to-[#001233]"],
  borderHoverClass: "hover:border-slate-400/60",
  badgeClass:
    "bg-slate-100 text-slate-700 border border-slate-300 group-hover:bg-[#001233] group-hover:text-white group-hover:border-[#001233]",
  metaClass: "text-slate-600",
  bodyClass: "bg-gradient-to-b from-slate-50 to-white",
};

function skillIcon(title: string, index: number) {
  const lower = title.toLowerCase();
  if (lower.includes("listening") || lower.includes("nghe")) return Ear;
  if (
    lower.includes("speaking") ||
    lower.includes("nói") ||
    lower.includes("pronunciation") ||
    lower.includes("phát âm")
  ) {
    return Mic;
  }
  if (lower.includes("writing") || lower.includes("viết")) return PenLine;
  if (lower.includes("vocabulary") || lower.includes("từ vựng")) return Languages;
  if (
    lower.includes("reading") ||
    lower.includes("đọc") ||
    lower.includes("grammar") ||
    lower.includes("ngữ pháp")
  ) {
    return BookOpen;
  }
  return [Ear, BookOpen, Mic, PenLine][index % 4]!;
}

function themeKey(title: string) {
  const i = title.indexOf(":");
  return i > 0 ? title.slice(0, i).trim().toLowerCase() : null;
}

/**
 * Colour lessons by theme (text before ":"), in lesson order. Within a theme the
 * header darkens as lessons get harder; themeless lessons are navy checkpoints.
 */
function buildTopicThemes(titles: string[]) {
  const hueByTheme = new Map<string, TopicHue>();
  const members = new Map<string, number[]>();
  titles.forEach((title, i) => {
    const key = themeKey(title);
    if (!key) return;
    if (!hueByTheme.has(key)) {
      hueByTheme.set(key, THEME_HUES[hueByTheme.size % THEME_HUES.length]!);
      members.set(key, []);
    }
    members.get(key)!.push(i);
  });

  const checkpoints = titles.map((t, i) => (themeKey(t) ? -1 : i)).filter((i) => i >= 0);
  const fallbackHue = hueByTheme.size === 0 ? THEME_HUES[0]! : CHECKPOINT_HUE;

  return titles.map((title, i) => {
    const key = themeKey(title);
    const hue = key ? hueByTheme.get(key)! : fallbackHue;
    const group = key ? members.get(key)! : checkpoints;
    const pos = group.indexOf(i);
    const step = group.length <= 1 ? 1 : Math.round((pos / (group.length - 1)) * 2);
    return {
      headerClass: `bg-gradient-to-r ${hue.steps[step]}`,
      borderHoverClass: hue.borderHoverClass,
      badgeClass: hue.badgeClass,
      metaClass: hue.metaClass,
      bodyClass: hue.bodyClass,
      Icon: skillIcon(title, i),
    };
  });
}

type Props = {
  track: VocabGrammarTrack;
  trackLabel: string;
  topics: PublicTopicLesson[];
  progress: LearnProgressStore;
  /** Rendered between the header and the topic grid (e.g. grammar course tabs). */
  toolbar?: ReactNode;
  /** Replaces the topic grid when the viewer may not open this course. */
  lockedPanel?: ReactNode;
  /** Standalone IELTS courses sit directly under the course catalog. */
  parent?: "vocab-grammar" | "catalog";
};

export function TopicCatalog({
  track,
  trackLabel,
  topics,
  progress,
  toolbar,
  lockedPanel,
  parent = "vocab-grammar",
}: Props) {
  const { t, locale } = useTranslations("learn");
  const isVocabulary = track === "vocabulary";
  const underCatalog = parent === "catalog";
  const titles = topics.map((topic) =>
    isVocabulary ? topic.title.en : pickLocalized(topic.title, locale),
  );
  const themes = buildTopicThemes(titles);

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={underCatalog ? learnCatalogHref() : learnVocabGrammarHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {underCatalog
            ? t("backCatalog", "← Tất cả khóa học")
            : t("backVocabGrammar", "← Từ vựng và ngữ pháp")}
        </Link>
        <nav className="mt-2 text-xs text-zinc-500 sm:text-sm">
          <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline">
            {t("catalogTitle", "Chọn khóa học")}
          </Link>
          <span className="mx-1.5">›</span>
          {underCatalog ? null : (
            <>
              <Link
                href={learnVocabGrammarHref()}
                className="hover:text-wewin-navy hover:underline"
              >
                {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
              </Link>
              <span className="mx-1.5">›</span>
            </>
          )}
          <span className="font-medium text-zinc-800">{trackLabel}</span>
        </nav>
        <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {trackLabel}
        </h1>
      </header>

      {toolbar}

      {lockedPanel ?? (
        <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
          {topics.map((topic, index) => {
            const unlocked =
              isVocabulary || isTopicUnlocked(topic, topics, progress);
            const done = Boolean(progress.lessons[topic.id]?.exercisePassed);
            const title = titles[index]!;
            const summary = pickLocalized(topic.summary, locale);
            const theme = themes[index]!;
            const TopicIcon = theme.Icon;

            const cardInner = (
              <>
                <div
                  className={`flex items-start gap-3 px-3.5 py-3 text-white sm:px-4 sm:py-3.5 ${theme.headerClass}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white ring-1 ring-white/30">
                    <TopicIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-bold leading-snug text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.2)] sm:text-base">
                      {title}
                    </h2>
                    {topic.stub ? (
                      <p className="mt-0.5 text-xs font-medium text-white/80">
                        {t("contentComingSoon", "Nội dung đang cập nhật")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className={`flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4 ${theme.bodyClass}`}>
                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {summary}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className={`text-xs font-medium ${theme.metaClass}`}>
                      {isVocabulary && (topic.wordCount ?? 0) > 0
                        ? t(
                            "wordCountLabel",
                            { n: topic.wordCount ?? 0 },
                            "{n} từ vựng",
                          )
                        : topic.slidesUrl
                          ? t("slidesLesson", "Slide bài giảng")
                          : t(
                              "exerciseCount",
                              { n: topic.exerciseCount ?? topic.exercises.length },
                              "{n} câu bài tập",
                            )}
                    </span>
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                        done
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : unlocked
                            ? theme.badgeClass
                            : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {done
                        ? t("done")
                        : unlocked
                          ? t("study", "Học →")
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
                  className="card-outline flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 opacity-75 shadow-xs"
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
                className={`card-outline-hover group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${theme.borderHoverClass}`}
              >
                {cardInner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
