"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Circle, List, PlayCircle } from "lucide-react";
import { learnCatalogHref, learnGameHref } from "@/lib/learn/hrefs";
import {
  GAME_LEVELS,
  type GameLevel,
  type PracticeGame,
  type PracticeGameItem,
} from "@/lib/learn/practice-games";
import { usePracticeGameCopy } from "@/components/learn/practice-game-copy";
import { useTranslations } from "@/i18n/provider";

type Props = {
  game: PracticeGame;
  level: GameLevel | null;
  /** Lessons of the current level, in display order. */
  items: PracticeGameItem[];
  levelStartSlugs: Record<GameLevel, string | null>;
  currentSlug: string;
  currentTitle: string;
  children: ReactNode;
};

export function PracticeGameLayout({
  game,
  level,
  items,
  levelStartSlugs,
  currentSlug,
  currentTitle,
  children,
}: Props) {
  const { t } = useTranslations("practiceGames");
  const copy = usePracticeGameCopy(game);

  const levelTitle = (l: GameLevel) =>
    l === "basic"
      ? t("levels.basic.title", "Trình độ Basic")
      : t("levels.intermediate.title", "Trình độ Intermediate");

  const idx = items.findIndex((item) => item.slug === currentSlug);
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx >= 0 ? (items[idx + 1] ?? null) : null;
  const levelHref = (l: GameLevel) => learnGameHref(game, levelStartSlugs[l] ?? undefined);

  return (
    <div className="region-split grid min-w-0 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="min-w-0 border-b border-zinc-200 lg:border-r lg:border-b-0">
        <aside className="min-w-0 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto">
          <div className="bg-wewin-navy px-4 py-3 text-white">
            <div className="flex items-start gap-2">
              <List className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
              <div className="min-w-0">
                <p className="text-sm leading-snug font-bold break-words">{copy.title}</p>
                <p className="mt-0.5 text-xs text-white/80">
                  {t("lessonCount", { n: items.length }, "{n} bài")}
                </p>
              </div>
            </div>
          </div>

          <nav
            aria-label={t("levelSwitch", "Chọn trình độ")}
            className="flex gap-1 border-b border-zinc-200 bg-wewin-accent-blue-bg/40 p-2"
          >
            {GAME_LEVELS.map((l) => (
              <Link
                key={l}
                href={levelHref(l)}
                aria-current={l === level ? "true" : undefined}
                className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold whitespace-nowrap transition-colors ${
                  l === level
                    ? "bg-wewin-navy text-white shadow-xs"
                    : "text-zinc-600 hover:bg-white hover:text-wewin-navy"
                }`}
              >
                {levelTitle(l)}
              </Link>
            ))}
          </nav>

          <div className="border-b border-zinc-200 px-4 py-3">
            <Link href={learnGameHref(game)} className="text-sm font-medium text-wewin-navy hover:underline">
              {t("backGameHub", "← Chọn trình độ")}
            </Link>
          </div>

          {next ? (
            <div className="border-b border-zinc-200 px-4 py-3">
              <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                {t("nextLessonLabel", "Bài tiếp theo:")}
              </p>
              <Link
                href={learnGameHref(game, next.slug)}
                className="mt-1 block text-sm font-semibold break-words text-wewin-navy hover:underline"
              >
                {next.title}
              </Link>
            </div>
          ) : null}

          <ol className="max-h-[min(40vh,360px)] space-y-0.5 overflow-y-auto p-2 lg:max-h-none">
            {items.map((item, i) => {
              const active = item.slug === currentSlug;
              return (
                <li key={item.id}>
                  <Link
                    href={learnGameHref(game, item.slug)}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
                      active
                        ? "bg-wewin-accent-blue-bg text-wewin-navy"
                        : "text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {active ? (
                        <PlayCircle className="h-4 w-4 text-wewin-navy" />
                      ) : (
                        <Circle className="h-4 w-4 text-zinc-300" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-snug font-medium break-words">
                      {i + 1}. {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <div className="min-w-0 space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="min-w-0 text-xs text-zinc-500 sm:text-sm">
            <Link href={learnCatalogHref()} className="hover:text-wewin-navy hover:underline">
              {t("breadcrumbLearn", "Học")}
            </Link>
            <span className="mx-1.5">›</span>
            <Link href={learnGameHref(game)} className="hover:text-wewin-navy hover:underline">
              {copy.title}
            </Link>
            {level ? (
              <>
                <span className="mx-1.5">›</span>
                <span>{levelTitle(level)}</span>
              </>
            ) : null}
            <span className="mx-1.5">›</span>
            <span className="font-medium break-words text-zinc-800">{currentTitle}</span>
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {prev ? (
              <Link
                href={learnGameHref(game, prev.slug)}
                className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("prevLesson", "Bài trước")}
              </Link>
            ) : null}
            {next ? (
              <Link
                href={learnGameHref(game, next.slug)}
                className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {t("nextLesson", "Bài sau")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
