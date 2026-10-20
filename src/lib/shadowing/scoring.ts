/**
 * Content-match grading for shadowing: compares the reference transcript with
 * the speech-to-text output. Reflects what the recognizer heard, not pronunciation.
 */

import { alignWords, summarizeErrors, tokenize } from "@/lib/dictation/scoring";
import type { ShadowingGrade } from "@/lib/shadowing/types";

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function numberToWords(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` ${numberToWords(rest)}` : ""}`;
}

/**
 * Recognizers often write numbers as digits ("12", "8:30") while transcripts spell
 * them out, so both sides are spelled out before alignment. Larger numbers are kept.
 */
export function spellOutNumbers(text: string): string {
  return text
    .replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h: string, m: string) =>
      m === "00" ? `${h}` : `${h} ${Number(m)}`,
    )
    .replace(/\b\d{1,3}\b/g, (d) => numberToWords(Number(d)));
}

export function gradeShadowing(transcript: string, recognized: string): ShadowingGrade {
  const expected = tokenize(spellOutNumbers(transcript));
  if (expected.length === 0) throw new Error("EMPTY_TRANSCRIPT");
  const actual = tokenize(spellOutNumbers(recognized));
  const wordResults = alignWords(expected, actual);

  let correctCount = 0;
  let substitutionCount = 0;
  let deletionCount = 0;
  let insertionCount = 0;
  for (const r of wordResults) {
    if (r.status === "correct") correctCount++;
    else if (r.status === "incorrect") substitutionCount++;
    else if (r.status === "missing") deletionCount++;
    else insertionCount++;
  }

  const wer = (substitutionCount + deletionCount + insertionCount) / expected.length;
  return {
    score: Math.round(Math.max(0, 100 * (1 - wer))),
    wer,
    totalWords: expected.length,
    correctCount,
    substitutionCount,
    deletionCount,
    insertionCount,
    normalizedText: actual.map((t) => t.norm).join(" "),
    wordResults,
    errorSummary: summarizeErrors(wordResults),
  };
}

export function clampRecordSeconds(raw: unknown, fallback: number, min: number, max: number) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
