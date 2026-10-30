"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Circle, PlayCircle } from "lucide-react";
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

function formatLessonName(rawTitle: string, index: number): string {
  const clean = rawTitle.replace(/^(Basic|Intermediate)\s*0?\d+[:.-]?\s*/i, "").trim();
  const num = String(index + 1).padStart(2, "0");
  return `${num}. ${clean || rawTitle}`;
}

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
    l === "basic" ? t("levelBasic", "Basic") : t("levelIntermediate", "Intermediate");

  const idx = items.findIndex((item) => item.slug === currentSlug);
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx >= 0 ? (items[idx + 1] ?? null) : null;
  const levelHref = (l: GameLevel) => learnGameHref(game, levelStartSlugs[l] ?? undefined);

  const shortTitles: Record<PracticeGame, string> = {
    shadowing: t("shortShadowing", "Shadowing"),
    dictation: t("shortDictation", "Chép chính tả"),
    "fill-blank": t("shortFillBlank", "Nghe điền từ"),
    "listen-answer": t("shortListenAnswer", "Nghe & Trả lời"),
  };
  const gameTitle = shortTitles[game] ?? copy.title;

  return (
    <div className="flex min-w-0 flex-col">
      {/* Top Sub-Header Bar: Breadcrumb + Prev/Next Buttons (Nằm ở dưới header, trên sidebar và nội dung) */}
      <div className="border-b border-slate-200/90 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-500">
            <Link
              href={learnCatalogHref()}
              className="hover:text-wewin-navy hover:underline transition-colors"
            >
              {t("breadcrumbLearn", "Học")}
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={learnGameHref(game)}
              className="hover:text-wewin-navy hover:underline transition-colors"
            >
              {copy.title}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">{currentTitle}</span>
          </nav>

          <div className="flex items-center gap-2">
            {prev ? (
              <Link
                href={learnGameHref(game, prev.slug)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{t("prev", "Trước")}</span>
              </Link>
            ) : null}
            {next ? (
              <Link
                href={learnGameHref(game, next.slug)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
              >
                <span>{t("next", "Sau")}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Body: Sidebar + Practice Content */}
      <div className="region-split grid min-w-0 lg:grid-cols-[270px_minmax(0,1fr)]">
        {/* Sidebar Lesson List */}
        <div className="min-w-0 border-b border-slate-200 lg:border-r lg:border-b-0 bg-slate-50/30">
          <aside className="min-w-0 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto">
            {/* Header Bar - Sleek Modern Design */}
            <div className="border-b border-slate-200/80 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#001233] to-[#1a365d] text-white shadow-xs">
                    <copy.Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate tracking-tight">
                      {gameTitle}
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 truncate">
                      {copy.title.includes("—") ? copy.title.split("—")[1]?.trim() : copy.title}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 text-xs font-bold text-slate-700 tabular-nums whitespace-nowrap shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("lessonCount", { n: items.length }, `${items.length} bài`)}
                </span>
              </div>

              {/* Segmented Level Switcher - iOS / Toey Style */}
              <nav
                aria-label={t("levelSwitch", "Chọn trình độ")}
                className="mt-3.5 flex rounded-xl bg-slate-100 p-1 gap-1 border border-slate-200/60"
              >
                {GAME_LEVELS.map((l) => {
                  const active = l === level;
                  return (
                    <Link
                      key={l}
                      href={levelHref(l)}
                      aria-current={active ? "true" : undefined}
                      className={`flex-1 rounded-lg py-1.5 px-3 text-center text-xs sm:text-sm font-bold transition-all duration-150 ${
                        active
                          ? "bg-white text-slate-900 shadow-sm shadow-slate-200/80 ring-1 ring-slate-900/5"
                          : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {levelTitle(l)}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Clean Lesson List */}
            <ol className="max-h-[min(50vh,420px)] space-y-1 overflow-y-auto p-2.5 lg:max-h-[calc(100vh-140px)]">
              {items.map((item, i) => {
                const active = item.slug === currentSlug;
                const formattedTitle = formatLessonName(item.title, i);

                return (
                  <li key={item.id}>
                    <Link
                      href={learnGameHref(game, item.slug)}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm transition-all ${
                        active
                          ? "bg-wewin-navy font-bold text-white shadow-xs"
                          : "font-medium text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                      }`}
                    >
                      <span className="shrink-0">
                        {active ? (
                          <PlayCircle className="h-4 w-4 text-white" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-slate-300" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {formattedTitle}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>

        {/* Main Practice Content */}
        <div className="min-w-0 space-y-4 p-4 sm:p-6 lg:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
