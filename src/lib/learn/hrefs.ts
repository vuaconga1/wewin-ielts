import type { DictationMode } from "@/lib/dictation/types";
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

export function learnListenAnswerHref(slug?: string): string {
  return slug ? `/learn/listen-answer/${slug}` : "/learn/listen-answer";
}

/** Dictation, fill-blank and listen-answer share storage but are separate games with separate routes. */
export function learnListeningExerciseHref(mode: DictationMode, slug?: string): string {
  if (mode === "FILL_BLANK") return learnFillBlankHref(slug);
  if (mode === "QUESTION_ANSWER") return learnListenAnswerHref(slug);
  return learnDictationHref(slug);
}

export function adminListeningExerciseHref(mode: DictationMode): string {
  if (mode === "FILL_BLANK") return "/admin/fill-blank";
  if (mode === "QUESTION_ANSWER") return "/admin/listen-answer";
  return "/admin/dictation";
}

export function learnShadowingHref(slug?: string): string {
  return slug ? `/learn/shadowing/${slug}` : "/learn/shadowing";
}

/** Vocabulary learn/practice page (word cards + optional exercises). */
export function learnVocabTopicLearnHref(slug: string): string {
  return `/learn/vocab-grammar/vocabulary/${slug}/learn`;
}
