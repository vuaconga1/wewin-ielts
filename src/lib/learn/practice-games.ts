import type { DictationMode } from "@/lib/dictation/types";

export const PRACTICE_GAMES = ["dictation", "fill-blank", "listen-answer", "shadowing"] as const;
export type PracticeGame = (typeof PRACTICE_GAMES)[number];

export const GAME_LEVELS = ["basic", "intermediate", "tedtalk"] as const;
export type GameLevel = (typeof GAME_LEVELS)[number];

/** Level value stored on exercises (DictationExercise.level / ShadowingExercise.level). */
export const GAME_LEVEL_DB_VALUE: Record<GameLevel, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  tedtalk: "TED Talks",
};

export const GAME_DICTATION_MODE: Record<Exclude<PracticeGame, "shadowing">, DictationMode> = {
  dictation: "FULL_TEXT",
  "fill-blank": "FILL_BLANK",
  "listen-answer": "QUESTION_ANSWER",
};

export function isGameLevel(value: string): value is GameLevel {
  return (GAME_LEVELS as readonly string[]).includes(value);
}

export function gameLevelsFor(game: PracticeGame): readonly GameLevel[] {
  if (game === "shadowing") return GAME_LEVELS;
  return ["basic", "intermediate"];
}

export function gameLevelOf(
  level: string | null | undefined,
  hasVideo?: boolean,
): GameLevel | null {
  if (hasVideo) return "tedtalk";
  const v = level?.trim().toLowerCase();
  if (v === "tedtalk" || v === "ted-talk" || v === "ted") return "tedtalk";
  return v && isGameLevel(v) ? v : null;
}

export function gameForDictationMode(mode: DictationMode): PracticeGame {
  if (mode === "FILL_BLANK") return "fill-blank";
  if (mode === "QUESTION_ANSWER") return "listen-answer";
  return "dictation";
}

export type GameLevelSummary = { count: number; firstSlug: string | null };

export type PracticeGameItem = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  hasVideo?: boolean;
};
