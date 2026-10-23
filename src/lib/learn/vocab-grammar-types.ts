import type { LearnExercise } from "@/lib/learn/types";

export const VOCAB_GRAMMAR_TRACKS = ["vocabulary", "grammar"] as const;
export type VocabGrammarTrack = (typeof VOCAB_GRAMMAR_TRACKS)[number];

/** Independent slide courses inside the grammar track. */
export const GRAMMAR_COURSES = ["basic", "ielts-3-4", "ielts-4-5"] as const;
export type GrammarCourse = (typeof GRAMMAR_COURSES)[number];

export function isGrammarCourse(value: unknown): value is GrammarCourse {
  return (GRAMMAR_COURSES as readonly unknown[]).includes(value);
}

/** Courses open only to class members and staff (see `canViewIeltsGrammar`). */
export function isRestrictedGrammarCourse(course: GrammarCourse): boolean {
  return course !== "basic";
}

export function topicCourse(topic: { course?: GrammarCourse }): GrammarCourse {
  return topic.course ?? "basic";
}

/** Word sets inside the vocabulary track. */
export const VOCAB_COLLECTIONS = ["cambridge", "topics"] as const;
export type VocabCollection = (typeof VOCAB_COLLECTIONS)[number];

export function isVocabCollection(value: unknown): value is VocabCollection {
  return (VOCAB_COLLECTIONS as readonly unknown[]).includes(value);
}

export function topicCollection(topic: { collection?: VocabCollection }): VocabCollection {
  return topic.collection ?? "cambridge";
}

export type LocalizedText = {
  vi: string;
  en: string;
};

/** Flashcard-style vocabulary entry (no images). */
export type VocabWord = {
  word: string;
  /** Part of speech, e.g. n, v, adj */
  pos?: string;
  ipa?: string;
  meaningVi: string;
  definitionEn?: string;
  exampleEn?: string;
  exampleVi?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
};

export type TopicLesson = {
  id: string;
  slug: string;
  track: VocabGrammarTrack;
  /** Grammar track only; missing → "basic". */
  course?: GrammarCourse;
  /** Vocabulary track only; missing → "cambridge". */
  collection?: VocabCollection;
  order: number;
  title: LocalizedText;
  summary: LocalizedText;
  videoUrl: string;
  /** Google Slides embed URL; when set, the player shows slides instead of video. */
  slidesUrl?: string;
  durationSec?: number;
  theoryHtml: LocalizedText;
  slidesHtml?: LocalizedText;
  exercises: LearnExercise[];
  /** Vocabulary flashcards (vocabulary track). */
  words?: VocabWord[];
  /** When true, content is a placeholder awaiting full authoring. */
  stub?: boolean;
};

export type VocabGrammarCatalog = {
  grammar: TopicLesson[];
  vocabulary: TopicLesson[];
};

export function isVocabGrammarTrack(value: string): value is VocabGrammarTrack {
  return (VOCAB_GRAMMAR_TRACKS as readonly string[]).includes(value);
}

export type Locale = "vi" | "en";

export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return locale === "en" ? text.en : text.vi;
}
