import type { LearnExercise } from "@/lib/learn/types";

export const VOCAB_GRAMMAR_TRACKS = ["vocabulary", "grammar"] as const;
export type VocabGrammarTrack = (typeof VOCAB_GRAMMAR_TRACKS)[number];

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
  exampleEn: string;
  exampleVi?: string;
  audioUkUrl?: string;
  audioUsUrl?: string;
};

export type TopicLesson = {
  id: string;
  slug: string;
  track: VocabGrammarTrack;
  order: number;
  title: LocalizedText;
  summary: LocalizedText;
  videoUrl: string;
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
