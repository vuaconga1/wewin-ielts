import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PracticeGameHub } from "@/components/learn/practice-game-hub";
import { PracticeGameLayout } from "@/components/learn/practice-game-layout";
import {
  listPracticeGameItems,
  listPracticeGameLevelItems,
  summarizePracticeGameLevels,
} from "@/lib/learn/practice-game-store";
import {
  GAME_LEVELS,
  gameLevelOf,
  isGameLevel,
  type GameLevel,
  type PracticeGame,
} from "@/lib/learn/practice-games";
import { learnGameHref } from "@/lib/learn/hrefs";
import { getTranslationsStatic } from "@/i18n/server";

const META_KEY: Record<PracticeGame, string> = {
  dictation: "meta.dictation",
  "fill-blank": "meta.fillBlank",
  "listen-answer": "meta.listenAnswer",
  shadowing: "meta.shadowing",
};

export type GameLevelParams = { params: Promise<{ level: string }> };

export function practiceGameMetadata(game: PracticeGame) {
  const { t } = getTranslationsStatic();
  return { title: t(META_KEY[game]) };
}

export function gameLevelStaticParams() {
  return GAME_LEVELS.map((level) => ({ level }));
}

async function levelStartSlugs(game: PracticeGame): Promise<Record<GameLevel, string | null>> {
  const summary = await summarizePracticeGameLevels(game);
  return { basic: summary.basic.firstSlug, intermediate: summary.intermediate.firstSlug };
}

export async function PracticeGameHubPage({ game }: { game: PracticeGame }) {
  const summary = await summarizePracticeGameLevels(game);
  return (
    <SiteShell active="learn">
      <PracticeGameHub game={game} levels={summary} />
    </SiteShell>
  );
}

export async function PracticeGameExerciseFrame({
  game,
  exercise,
  children,
}: {
  game: PracticeGame;
  exercise: { slug: string; title: string; level: string | null };
  children: ReactNode;
}) {
  const level = gameLevelOf(exercise.level);
  const [items, startSlugs] = await Promise.all([
    level ? listPracticeGameLevelItems(game, level) : listPracticeGameItems(game),
    levelStartSlugs(game),
  ]);
  return (
    <SiteShell active="learn" wide>
      <PracticeGameLayout
        game={game}
        level={level}
        items={items}
        levelStartSlugs={startSlugs}
        currentSlug={exercise.slug}
        currentTitle={exercise.title}
      >
        {children}
      </PracticeGameLayout>
    </SiteShell>
  );
}

/** `/learn/<game>/level/<level>` has no page of its own: it opens the level's first lesson. */
export async function redirectToGameLevel(
  game: PracticeGame,
  params: GameLevelParams["params"],
): Promise<never> {
  const { level } = await params;
  if (!isGameLevel(level)) notFound();
  const slug = (await levelStartSlugs(game))[level];
  redirect(learnGameHref(game, slug ?? undefined));
}
