/**
 * Friendly labels for QuestionType (and similar SCREAMING_SNAKE enums).
 * Prefer i18n `questionTypes.*`; these maps are safe fallbacks so UI never
 * shows raw enum keys like SHORT_ANSWER.
 */

export const QUESTION_TYPE_VALUES = [
  "GAP_FILL",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NG",
  "MATCHING",
  "SHORT_ANSWER",
  "TABLE_COMPLETION",
  "MAP_LABELING",
  "ESSAY",
  "SPEAKING_PROMPT",
] as const;

export type QuestionTypeValue = (typeof QUESTION_TYPE_VALUES)[number];

/** Vietnamese defaults (app default locale). */
export const QUESTION_TYPE_LABELS_VI: Record<string, string> = {
  GAP_FILL: "Điền từ",
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE_NG: "True / False / Not Given",
  MATCHING: "Nối thông tin",
  SHORT_ANSWER: "Điền từ / câu trả lời ngắn",
  TABLE_COMPLETION: "Hoàn thành bảng",
  MAP_LABELING: "Ghi nhãn bản đồ",
  ESSAY: "Bài luận",
  SPEAKING_PROMPT: "Prompt nói",
};

export const QUESTION_TYPE_LABELS_EN: Record<string, string> = {
  GAP_FILL: "Gap fill",
  MULTIPLE_CHOICE: "Multiple choice",
  TRUE_FALSE_NG: "True / False / Not Given",
  MATCHING: "Matching",
  SHORT_ANSWER: "Short answer",
  TABLE_COMPLETION: "Table completion",
  MAP_LABELING: "Map labeling",
  ESSAY: "Essay",
  SPEAKING_PROMPT: "Speaking prompt",
};

/** Title-case SCREAMING_SNAKE / kebab / camel so keys never leak as-is. */
export function humanizeEnum(value: string): string {
  const raw = value.trim();
  if (!raw) return "…";
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!spaced) return "…";
  return spaced
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    })
    .join(" ");
}

export function questionTypeFallback(
  type: string,
  locale: "vi" | "en" = "vi",
): string {
  const map =
    locale === "en" ? QUESTION_TYPE_LABELS_EN : QUESTION_TYPE_LABELS_VI;
  return map[type] ?? humanizeEnum(type);
}

/**
 * Resolve a question type label via translator (`questionTypes` namespace)
 * or fallback maps. Never returns the raw enum string.
 */
export function questionTypeLabel(
  type: string,
  t?: (key: string, defaultMessage?: string) => string,
  locale: "vi" | "en" = "vi",
): string {
  const fallback = questionTypeFallback(type, locale);
  if (t) return t(type, fallback);
  return fallback;
}

/** Types that are typically fill-in blanks (notes / table / map). */
export function isBlankQuestionType(type: string): boolean {
  return (
    type === "GAP_FILL" ||
    type === "TABLE_COMPLETION" ||
    type === "SHORT_ANSWER" ||
    type === "MAP_LABELING"
  );
}

/**
 * Clean imported stem for display: turn dot/underscore runs into a blank,
 * collapse whitespace. Returns empty if stem is useless (e.g. "Question 7").
 */
export function formatQuestionStem(
  stem: string,
  questionNumber?: number,
): string {
  let s = stem.replace(/\r\n/g, "\n").trim();
  if (!s) return "";

  s = s
    .replace(/[.…_…]{2,}/gu, " _____ ")
    .replace(/\u2026+/g, " _____ ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (questionNumber != null) {
    const n = questionNumber;
    if (
      new RegExp(`^question\\s*${n}$`, "i").test(s) ||
      new RegExp(`^\\(?q?\\s*${n}\\)?$`, "i").test(s) ||
      new RegExp(`^question\\s*${n}\\s*\\(q${n}\\)$`, "i").test(s)
    ) {
      return "";
    }
    // "Complete the notes… (Q7)" with no other cue — keep instruction only
    s = s.replace(new RegExp(`\\s*\\(Q${n}\\)\\s*$`, "i"), "").trim();
  }

  return s;
}

/**
 * Safety net for older imports that still store sliding-window gap stems.
 * New imports should emit empty stems (`INLINE_GAP_STEM`) when blanks are
 * inline in part.content — see `src/lib/questions/gap-stems.ts`.
 */
export { looksLikeRedundantGapStem as isRedundantGapStem } from "@/lib/questions/gap-stems";
