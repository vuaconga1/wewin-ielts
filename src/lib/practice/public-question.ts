/**
 * Strip answer keys before any question payload reaches the browser.
 * Scoring stays server-side (submit / result after finish).
 */

export type PublicQuestionContent = {
  stem?: string;
  options?: { label: string; text: string }[];
  minWords?: number;
  /** Speaking sample only — never a Listening/Reading key */
  hint?: string;
};

export type PublicQuestion = {
  number: number;
  type: string;
  content: PublicQuestionContent;
};

type RawQuestion = {
  number: number;
  type: string;
  content?: unknown;
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
  };

  const isSpeaking = q.type === "SPEAKING_PROMPT";
  const hint =
    isSpeaking && typeof q.explanation === "string" && q.explanation.trim()
      ? q.explanation
      : undefined;

  return {
    number: q.number,
    type: q.type,
    content: {
      stem: content.stem,
      options: content.options,
      minWords: content.minWords,
      hint,
    },
  };
}
