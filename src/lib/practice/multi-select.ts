/**
 * IELTS "Choose TWO / THREE letters" multi-select helpers.
 *
 * Lead question stores options + `selectCount` + `covers: [n, n+1, …]`.
 * Satellite questions use `pairedFrom: leadNumber` and are not rendered alone.
 * Answers stay one letter per question number (navigator / scoring).
 */

export type MultiSelectContent = {
  selectCount?: number;
  covers?: number[];
  pairedFrom?: number;
  options?: { label: string; text: string }[];
  stem?: string;
};

export function getSelectCount(content: MultiSelectContent | undefined): number {
  const n = content?.selectCount;
  if (typeof n === "number" && Number.isFinite(n) && n >= 2) {
    return Math.floor(n);
  }
  return 1;
}

export function isMultiSelectQuestion(
  content: MultiSelectContent | undefined,
): boolean {
  return getSelectCount(content) >= 2 && Array.isArray(content?.options);
}

export function isPairedSatellite(
  content: MultiSelectContent | undefined,
): boolean {
  return (
    typeof content?.pairedFrom === "number" &&
    Number.isFinite(content.pairedFrom) &&
    content.pairedFrom > 0
  );
}

/** Numbers this question writes answers for (lead multi-select). */
export function getCoveredNumbers(
  questionNumber: number,
  content: MultiSelectContent | undefined,
): number[] {
  const covers = content?.covers;
  if (Array.isArray(covers) && covers.length >= 2) {
    const nums = covers
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (nums.length >= 2) return [...new Set(nums)].sort((a, b) => a - b);
  }
  const count = getSelectCount(content);
  if (count >= 2) {
    return Array.from({ length: count }, (_, i) => questionNumber + i);
  }
  return [questionNumber];
}

export function formatCoveredLabel(numbers: number[]): string {
  if (numbers.length <= 1) return String(numbers[0] ?? "");
  if (numbers.length === 2) return `${numbers[0]}–${numbers[1]}`;
  return `${numbers[0]}–${numbers[numbers.length - 1]}`;
}

/** Selected option labels currently stored across covered answer slots. */
export function readMultiSelectAnswers(
  covers: number[],
  answers: Record<string, string>,
): string[] {
  return covers
    .map((n) => (answers[String(n)] ?? "").trim())
    .filter(Boolean);
}

/**
 * Toggle a letter in a choose-N group. Writes one letter per covered number
 * (empty string for unused slots). Order follows selection order.
 */
export function toggleMultiSelectAnswer(
  covers: number[],
  label: string,
  answers: Record<string, string>,
  maxSelections: number,
): Record<string, string> {
  const letter = label.trim();
  if (!letter || covers.length === 0) return answers;

  const selected = readMultiSelectAnswers(covers, answers);
  const idx = selected.findIndex(
    (s) => s.localeCompare(letter, undefined, { sensitivity: "accent" }) === 0,
  );

  let next: string[];
  if (idx >= 0) {
    next = selected.filter((_, i) => i !== idx);
  } else if (selected.length >= maxSelections) {
    return answers;
  } else {
    next = [...selected, letter];
  }

  const patch: Record<string, string> = {};
  for (let i = 0; i < covers.length; i++) {
    patch[String(covers[i])] = next[i] ?? "";
  }
  return patch;
}

/** Build lead → covered numbers for choose-N pairs in a question list. */
export function buildMultiSelectPairMap(
  questions: {
    number: number;
    content?: MultiSelectContent;
  }[],
): Map<number, number[]> {
  const byNumber = new Map(questions.map((q) => [q.number, q]));
  const pairs = new Map<number, number[]>();

  for (const q of questions) {
    if (isPairedSatellite(q.content)) continue;
    if (!isMultiSelectQuestion(q.content)) continue;
    const covers = getCoveredNumbers(q.number, q.content);
    if (covers.length < 2) continue;
    // Only treat as a pair if satellites exist (or covers length matches selectCount)
    const hasSatellites = covers.some(
      (n) => n !== q.number && byNumber.has(n),
    );
    if (!hasSatellites && covers.length < 2) continue;
    pairs.set(q.number, covers);
  }

  return pairs;
}
