/**
 * Local, deterministic dictation grading (no AI).
 * LEARNING mode ignores case and punctuation; wrong, missing and extra words still count.
 */

import {
  DEFAULT_DICTATION_SETTINGS,
  type DictationErrorSummary,
  type DictationGrade,
  type DictationSettings,
  type DictationWordResult,
} from "@/lib/dictation/types";

export type DictationToken = {
  /** Original text as typed / written in the transcript (for display). */
  raw: string;
  /** Lowercased, punctuation-stripped form used for comparison. */
  norm: string;
};

const PUNCTUATION = /[.,!?:;"()[\]{}…“”«»]/g;
const APOSTROPHES = /[’‘`´]/g;
const DASHES = /[-–—]+/;

export function normalizeWord(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(APOSTROPHES, "'")
    .replace(PUNCTUATION, "")
    .replace(/^'+|'+$/g, "");
}

/** Split on whitespace and dashes; drop tokens that are only punctuation. */
export function tokenize(text: string): DictationToken[] {
  return text
    .normalize("NFKC")
    .split(/\s+/)
    .flatMap((chunk) => chunk.split(DASHES))
    .map((raw) => ({ raw, norm: normalizeWord(raw) }))
    .filter((t) => t.norm.length > 0);
}

export function normalizeText(text: string): string[] {
  return tokenize(text).map((t) => t.norm);
}

export function charDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

function isNearMiss(expected: string, actual: string): boolean {
  const limit = Math.max(1, Math.floor(expected.length / 4));
  return charDistance(expected, actual) <= limit;
}

/**
 * Word-level Levenshtein alignment. Each step is one of
 * match (correct), substitution (incorrect), deletion (missing) or insertion (extra).
 */
export function alignWords(
  expected: DictationToken[],
  actual: DictationToken[],
): DictationWordResult[] {
  const n = expected.length;
  const m = actual.length;
  const width = m + 1;
  const dp = new Uint32Array((n + 1) * width);
  for (let i = 0; i <= n; i++) dp[i * width] = i;
  for (let j = 0; j <= m; j++) dp[j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = expected[i - 1].norm === actual[j - 1].norm;
      dp[i * width + j] = Math.min(
        dp[(i - 1) * width + (j - 1)] + (same ? 0 : 1),
        dp[(i - 1) * width + j] + 1,
        dp[i * width + (j - 1)] + 1,
      );
    }
  }

  const out: DictationWordResult[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const here = dp[i * width + j];
    if (i > 0 && j > 0) {
      const exp = expected[i - 1];
      const act = actual[j - 1];
      const diag = dp[(i - 1) * width + (j - 1)];
      if (exp.norm === act.norm && here === diag) {
        out.push({ status: "correct", expected: exp.raw, actual: act.raw });
        i--;
        j--;
        continue;
      }
      if (exp.norm !== act.norm && here === diag + 1) {
        out.push({
          status: "incorrect",
          expected: exp.raw,
          actual: act.raw,
          nearMiss: isNearMiss(exp.norm, act.norm),
        });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && here === dp[(i - 1) * width + j] + 1) {
      out.push({ status: "missing", expected: expected[i - 1].raw });
      i--;
      continue;
    }
    out.push({ status: "extra", actual: actual[j - 1].raw });
    j--;
  }
  return out.reverse();
}

export function summarizeErrors(
  results: DictationWordResult[],
): DictationErrorSummary {
  const summary: DictationErrorSummary = { missing: [], incorrect: [], extra: [] };
  for (const r of results) {
    if (r.status === "missing") summary.missing.push(normalizeWord(r.expected));
    else if (r.status === "extra") summary.extra.push(normalizeWord(r.actual));
    else if (r.status === "incorrect") {
      summary.incorrect.push({
        expected: normalizeWord(r.expected),
        actual: normalizeWord(r.actual),
      });
    }
  }
  return summary;
}

export function gradeDictation(transcript: string, submitted: string): DictationGrade {
  const expected = tokenize(transcript);
  if (expected.length === 0) {
    throw new Error("EMPTY_TRANSCRIPT");
  }
  const actual = tokenize(submitted);
  const wordResults = alignWords(expected, actual);
  const correctCount = wordResults.filter((r) => r.status === "correct").length;
  return {
    score: Math.round((correctCount / expected.length) * 100),
    correctCount,
    totalWords: expected.length,
    normalizedText: actual.map((t) => t.norm).join(" "),
    wordResults,
    errorSummary: summarizeErrors(wordResults),
  };
}

const MIN_RATE = 0.5;
const MAX_RATE = 2;

export function parseDictationSettings(raw: unknown): DictationSettings {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const maxRaw = obj.maxListenCount;
  const maxNum = typeof maxRaw === "number" ? maxRaw : Number(maxRaw);
  const maxListenCount =
    maxRaw == null || maxRaw === "" || !Number.isFinite(maxNum) || maxNum < 1
      ? null
      : Math.floor(maxNum);

  const rates = Array.isArray(obj.playbackRates)
    ? obj.playbackRates
        .map((r) => Number(r))
        .filter((r) => Number.isFinite(r) && r >= MIN_RATE && r <= MAX_RATE)
    : [];
  const playbackRates = [...new Set([...rates, 1])].sort((a, b) => a - b);

  return {
    maxListenCount,
    playbackRates: rates.length ? playbackRates : DEFAULT_DICTATION_SETTINGS.playbackRates,
    scoringMode: "LEARNING",
  };
}
