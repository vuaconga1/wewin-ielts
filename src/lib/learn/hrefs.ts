import type { LearnSkill } from "@/lib/learn/types";
import type { VocabGrammarTrack } from "@/lib/learn/vocab-grammar-types";

export function learnCatalogHref(): string {
  return "/learn";
}

export function learnCourseHref(courseId: string): string {
  return `/learn/${courseId}`;
}

export function learnSkillHref(courseId: string, skill: LearnSkill): string {
  return `/learn/${courseId}/${skill}`;
}

export function learnLessonHref(
  courseId: string,
  skill: LearnSkill,
  lessonId: string,
): string {
  return `/learn/${courseId}/${skill}/${lessonId}`;
}

export function learnVocabGrammarHref(): string {
  return "/learn/vocab-grammar";
}

export function learnVocabGrammarTrackHref(track: VocabGrammarTrack): string {
  return `/learn/vocab-grammar/${track}`;
}

export function learnVocabGrammarTopicHref(
  track: VocabGrammarTrack,
  slug: string,
): string {
  return `/learn/vocab-grammar/${track}/${slug}`;
}

export function learnDictationHref(slug?: string): string {
  return slug ? `/learn/dictation/${slug}` : "/learn/dictation";
}

export function learnFillBlankHref(slug?: string): string {
  return slug ? `/learn/fill-blank/${slug}` : "/learn/fill-blank";
}

/** Dictation and fill-blank share storage but are separate games with separate routes. */
export function learnListeningExerciseHref(
  mode: "FULL_TEXT" | "FILL_BLANK",
  slug?: string,
): string {
  return mode === "FILL_BLANK" ? learnFillBlankHref(slug) : learnDictationHref(slug);
}

export function adminListeningExerciseHref(mode: "FULL_TEXT" | "FILL_BLANK"): string {
  return mode === "FILL_BLANK" ? "/admin/fill-blank" : "/admin/dictation";
}

export function learnShadowingHref(slug?: string): string {
  return slug ? `/learn/shadowing/${slug}` : "/learn/shadowing";
}

/** Vocabulary learn/practice page (word cards + optional exercises). */
export function learnVocabTopicLearnHref(slug: string): string {
  return `/learn/vocab-grammar/vocabulary/${slug}/learn`;
}
