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

/** Vocabulary learn/practice page (word cards + optional exercises). */
export function learnVocabTopicLearnHref(slug: string): string {
  return `/learn/vocab-grammar/vocabulary/${slug}/learn`;
}
