/**
 * Strip answer keys before any question payload reaches the browser.
 * Scoring stays server-side (submit / result after finish).
 */

import { mediaUrl } from "@/lib/media/url";

export type PublicQuestionContent = {
  stem?: string;
  options?: { label: string; text: string }[];
  minWords?: number;
  /** Task 1 chart/diagram/map image path under /uploads/… */
  imageUrl?: string;
  /** Speaking sample only — never a Listening/Reading key */
  hint?: string;
  /** Gap / notes blank marker (inline input) */
  blank?: boolean;
  /** Choose TWO/THREE: max selections (checkboxes) */
  selectCount?: number;
  /** Choose TWO/THREE: answer slots written by this lead question */
  covers?: number[];
  /** Satellite of a choose-TWO lead — not rendered alone */
  pairedFrom?: number;
};

export type PublicQuestion = {
  number: number;
  type: string;
  content: PublicQuestionContent;
  mediaUrl?: string;
};

type RawQuestion = {
  number: number;
  type: string;
  content?: unknown;
  mediaUrl?: string | null;
  correctAnswer?: unknown;
  acceptableAnswers?: unknown;
  explanation?: string;
};

/**
 * Client-safe question for an in-progress practice session.
 * Omits correctAnswer / acceptableAnswers. Speaking prompts may include
 * explanation as a sample hint — never fall back to correctAnswer.
 */
export function toPublicQuestion(q: RawQuestion): PublicQuestion {
  const content = (q.content ?? {}) as {
    stem?: string;
    options?: { label: string; text: string }[];
    minWords?: number;
    imageUrl?: string;
    blank?: boolean;
    selectCount?: number;
    covers?: number[];
    pairedFrom?: number;
  };

  const isSpeaking = q.type === "SPEAKING_PROMPT";
  const hint =
    isSpeaking && typeof q.explanation === "string" && q.explanation.trim()
      ? q.explanation
      : undefined;

  const rawImageUrl =
    (typeof content.imageUrl === "string" && content.imageUrl.trim()) ||
    (typeof q.mediaUrl === "string" && q.mediaUrl.trim()) ||
    undefined;
  const imageUrl = rawImageUrl ? mediaUrl(rawImageUrl) : undefined;

  const covers = Array.isArray(content.covers)
    ? content.covers
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0)
    : undefined;

  return {
    number: q.number,
    type: q.type,
    mediaUrl: imageUrl,
    content: {
      stem: content.stem,
      options: content.options,
      minWords: content.minWords,
      imageUrl,
      hint,
      blank: content.blank === true ? true : undefined,
      selectCount:
        typeof content.selectCount === "number" && content.selectCount >= 2
          ? Math.floor(content.selectCount)
          : undefined,
      covers: covers && covers.length >= 2 ? covers : undefined,
      pairedFrom:
        typeof content.pairedFrom === "number" && content.pairedFrom > 0
          ? content.pairedFrom
          : undefined,
    },
  };
}
