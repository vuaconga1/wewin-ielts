import { listPublishedDictations } from "@/lib/dictation/store";
import { listPublishedShadowing } from "@/lib/shadowing/store";
import {
  GAME_DICTATION_MODE,
  GAME_LEVELS,
  gameLevelOf,
  type GameLevel,
  type GameLevelSummary,
  type PracticeGame,
  type PracticeGameItem,
} from "@/lib/learn/practice-games";

export async function listPracticeGameItems(game: PracticeGame): Promise<PracticeGameItem[]> {
  if (game === "shadowing") return listPublishedShadowing();
  return listPublishedDictations(GAME_DICTATION_MODE[game]);
}

export async function summarizePracticeGameLevels(
  game: PracticeGame,
): Promise<Record<GameLevel, GameLevelSummary>> {
  const summary = Object.fromEntries(
    GAME_LEVELS.map((l) => [l, { count: 0, firstSlug: null }]),
  ) as Record<GameLevel, GameLevelSummary>;
  for (const item of await listPracticeGameItems(game)) {
    const level = gameLevelOf(item.level);
    if (!level) continue;
    summary[level].count += 1;
    summary[level].firstSlug ??= item.slug;
  }
  return summary;
}

export async function listPracticeGameLevelItems(
  game: PracticeGame,
  level: GameLevel,
): Promise<PracticeGameItem[]> {
  const items = await listPracticeGameItems(game);
  return items.filter((item) => gameLevelOf(item.level) === level);
}
