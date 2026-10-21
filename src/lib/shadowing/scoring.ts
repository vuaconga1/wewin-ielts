/**
 * Content-match grading for shadowing: compares the reference transcript with
 * the speech-to-text output. Reflects what the recognizer heard, not pronunciation.
 */

import { alignWords, charDistance, summarizeErrors, tokenize } from "@/lib/dictation/scoring";
import { spokenText } from "@/lib/shadowing/transcript";
import type { ShadowingGrade } from "@/lib/shadowing/types";

/** Words a recognizer cannot tell apart by sound; each group counts as one word. */
const HOMOPHONES = [
  "to too two",
  "there their theyre",
  "your youre",
  "its it's",
  "no know",
  "right write",
  "here hear",
  "by buy bye",
  "for four",
  "one won",
  "weather whether",
  "where wear",
  "new knew",
  "see sea",
  "be bee",
  "our hour",
  "son sun",
  "meet meat",
  "week weak",
  "through threw",
  "eight ate",
  "whole hole",
  "piece peace",
  "wait weight",
  "would wood",
  "i eye",
  "ok okay",
  "mom mum",
  "gray grey",
  "cent sent",
  "made maid",
  "tail tale",
  "male mail",
  "allowed aloud",
  "flour flower",
  "fair fare",
  "pair pear",
  "plane plain",
  "break brake",
  "road rode",
  "steal steel",
  "dear deer",
  "night knight",
  "not knot",
  "which witch",
  "whose whos",
  "were we're",
];

const HOMOPHONE_KEY = new Map<string, string>();
for (const group of HOMOPHONES) {
  const words = group.split(" ").map((w) => w.replace(/'/g, ""));
  for (const w of words) HOMOPHONE_KEY.set(w, words[0]);
}

/** Apostrophes dropped, homophones merged and British spellings folded to American. */
function soundKey(word: string): string {
  const bare = word.replace(/'/g, "");
  const homophone = HOMOPHONE_KEY.get(bare);
  if (homophone) return homophone;
  return bare
    .replace(/(?<=\w{3})our(s?)$/, "or$1")
    .replace(/(?<=\w{3})tre(s?)$/, "ter$1")
    .replace(/(?<=\w{2})is(e|es|ed|ing)$/, "iz$1")
    .replace(/(?<=\w{2})ll(ed|ing|er)$/, "l$1");
}

const ENDING = /^(?:s|es|d|ed)$/;

/**
 * Tolerant word match for speech: small recognizer slips still count as the transcript word.
 * Words must sound the same, differ only by an -s/-ed ending, or (from 5 letters) differ by
 * one letter (two from 9 letters). Short words like "want"/"went" stay distinct.
 */
export function speechWordsMatch(expected: string, actual: string): boolean {
  if (expected === actual) return true;
  const a = soundKey(expected);
  const b = soundKey(actual);
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.length >= 3 && long.startsWith(short) && ENDING.test(long.slice(short.length))) return true;
  if (short.length < 5) return false;
  return charDistance(a, b) <= (short.length >= 9 ? 2 : 1);
}

const MAX_SEGMENTS = 200;
const MAX_ALTERNATIVES = 5;

/**
 * The recognizer returns several guesses for each chunk of speech; keeps, per chunk, the guess
 * whose words best fit the transcript vocabulary (the recognizer's first guess wins ties).
 */
export function pickClosestAlternatives(transcript: string, segments: unknown): string | null {
  if (!Array.isArray(segments) || segments.length === 0) return null;
  const vocab = new Set(tokenize(spellOutNumbers(spokenText(transcript))).map((t) => soundKey(t.norm)));
  const chosen: string[] = [];
  for (const seg of segments.slice(0, MAX_SEGMENTS)) {
    if (!Array.isArray(seg)) continue;
    let best = "";
    let bestHits = -1;
    for (const alt of seg.slice(0, MAX_ALTERNATIVES)) {
      if (typeof alt !== "string") continue;
      const words = tokenize(spellOutNumbers(alt));
      const known = words.filter((w) => vocab.has(soundKey(w.norm))).length;
      const hits = known - (words.length - known) / 2;
      if (hits > bestHits) {
        best = alt;
        bestHits = hits;
      }
    }
    if (best.trim()) chosen.push(best.trim());
  }
  return chosen.length ? chosen.join(" ") : null;
}

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
  const expected = tokenize(spellOutNumbers(spokenText(transcript)));
  if (expected.length === 0) throw new Error("EMPTY_TRANSCRIPT");
  const actual = tokenize(spellOutNumbers(recognized));
  const wordResults = alignWords(expected, actual, speechWordsMatch);

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
