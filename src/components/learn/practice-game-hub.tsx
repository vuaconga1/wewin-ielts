"use client";

import Link from "next/link";
import { GraduationCap, Lightbulb, Sprout } from "lucide-react";
import { learnCatalogHref, learnGameHref } from "@/lib/learn/hrefs";
import {
  GAME_LEVELS,
  type GameLevel,
  type GameLevelSummary,
  type PracticeGame,
} from "@/lib/learn/practice-games";
import { usePracticeGameCopy } from "@/components/learn/practice-game-copy";
import { useTranslations } from "@/i18n/provider";

const LEVEL_ICONS: Record<GameLevel, typeof Sprout> = {
  basic: Sprout,
  intermediate: GraduationCap,
};

type Props = { game: PracticeGame; levels: Record<GameLevel, GameLevelSummary> };

export function PracticeGameHub({ game, levels }: Props) {
  const { t } = useTranslations("practiceGames");
  const copy = usePracticeGameCopy(game);

  const levelCopy: Record<GameLevel, { title: string; desc: string }> = {
    basic: {
      title: t("levels.basic.title", "Trình độ Basic"),
      desc: t(
        "levels.basic.desc",
        "Đoạn audio ngắn, tốc độ chậm và từ vựng quen thuộc — phù hợp khi mới bắt đầu.",
      ),
    },
    intermediate: {
      title: t("levels.intermediate.title", "Trình độ Intermediate"),
      desc: t(
        "levels.intermediate.desc",
        "Đoạn dài hơn, hội thoại tự nhiên và tốc độ nói gần thực tế — nâng cao phản xạ nghe.",
      ),
    },
  };

  return (
    <div className="space-y-4">
      <header className="min-w-0">
        <Link
          href={learnCatalogHref()}
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backLearn", "← Học")}
        </Link>
        <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{copy.desc}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {GAME_LEVELS.map((level) => {
          const Icon = LEVEL_ICONS[level];
          const { count: total, firstSlug } = levels[level];
          return (
            <Link
              key={level}
              href={firstSlug ? learnGameHref(game, firstSlug) : learnGameHref(game)}
              className="card-outline-hover group flex min-w-0 flex-col overflow-hidden border-zinc-300"
            >
              <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white">
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold leading-tight">
                    {levelCopy[level].title}
                  </h2>
                  <p className="truncate text-xs text-white/85">
                    {copy.title} · {t("lessonCount", { n: total }, "{n} bài")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 border-t border-zinc-200 px-4 py-3">
                <p className="text-sm leading-snug break-words text-zinc-600">
                  {levelCopy[level].desc}
                </p>
                <div className="mt-auto flex justify-end">
                  <span className="shrink-0 rounded-md bg-wewin-accent-blue-bg px-2 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                    {t("openLevel", "Vào học →")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {game === "shadowing" ? <ShadowingTips /> : null}
    </div>
  );
}

function ShadowingTips() {
  const { t } = useTranslations("practiceGames");
  const steps = [1, 2, 3].map((n) => ({
    title: t(`shadowingTips.step${n}Title`),
    desc: t(`shadowingTips.step${n}Desc`),
  }));
  return (
    <section className="wewin-card-3d min-w-0 px-4 py-4 sm:px-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900">
        <Lightbulb className="h-4 w-4 shrink-0 text-wewin-navy" />
        {t("shadowingTips.title", "Bí quyết luyện Shadowing hiệu quả")}
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={i} className="min-w-0 rounded-lg bg-zinc-50 px-3 py-2.5">
            <p className="text-xs font-bold text-zinc-900">
              {i + 1}. {step.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed break-words text-zinc-600">{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
