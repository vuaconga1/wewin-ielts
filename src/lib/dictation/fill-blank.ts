/**
 * Fill-in-the-blank dictation: transcript tokenization, gap validation,
 * learner-safe segments and deterministic per-gap grading (no AI).
 * Client-safe (no server imports) so the admin editor can share the tokenizer.
 */

import { canonicalizeNumberWords } from "@/lib/number-words";
import { canonicalizeSpelling } from "@/lib/spelling-variants";
import type {
  FillBlankGap,
  FillBlankGapResult,
  FillBlankGrade,
  FillBlankResultSegment,
  FillBlankSegment,
} from "@/lib/dictation/types";

export const MAX_GAPS = 100;
export const MAX_ANSWER_CHARS = 200;
const MAX_ACCEPTED_ANSWERS = 10;
const GAP_ID = /^[A-Za-z0-9_-]{1,32}$/;

export type TranscriptToken = {
  /** Whitespace-separated chunk, punctuation included. */
  raw: string;
  /** Offsets of the chunk without leading/trailing punctuation (empty when punctuation only). */
  coreStart: number;
  coreEnd: number;
};

export class FillBlankConfigError extends Error {
  code: "NO_GAPS" | "INVALID_GAPS";
  constructor(code: "NO_GAPS" | "INVALID_GAPS", message: string) {
    super(message);
    this.code = code;
  }
}

const EDGE = /^[^\p{L}\p{N}]*([\s\S]*?)[^\p{L}\p{N}]*$/u;

export function tokenizeTranscript(transcript: string): TranscriptToken[] {
  const out: TranscriptToken[] = [];
  for (const m of transcript.matchAll(/\S+/g)) {
    const raw = m[0];
    const start = m.index ?? 0;
    const core = EDGE.exec(raw)?.[1] ?? "";
    const lead = core ? raw.indexOf(core) : raw.length;
    out.push({ raw, coreStart: start + lead, coreEnd: start + lead + core.length });
  }
  return out;
}

/**
 * Case, surrounding spaces, common punctuation, number words ("twenty-five" ≡ "25",
 * "eight thirty" ≡ "8:30") and US/UK spelling variants are normalized; contractions are not expanded.
 */
export function normalizeAnswer(text: string): string {
  const cleaned = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘`´']/g, "")
    .replace(/(\d)[:.](\d)/g, "$1 $2")
    .replace(/[-–—]/g, " ")
    .replace(/[.,!?:;"“”«»()[\]{}…]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return canonicalizeSpelling(canonicalizeNumberWords(cleaned));
}

export function gapExpected(
  transcript: string,
  tokens: TranscriptToken[],
  gap: Pick<FillBlankGap, "startToken" | "endToken">,
): string {
  return transcript.slice(tokens[gap.startToken].coreStart, tokens[gap.endToken - 1].coreEnd);
}

function cleanAccepted(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const text = item.trim().slice(0, MAX_ANSWER_CHARS);
    const key = normalizeAnswer(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= MAX_ACCEPTED_ANSWERS) break;
  }
  return out;
}

/**
 * Strict validation for admin input: gaps must be integer token ranges inside the
 * transcript, non-empty, non-overlapping, with unique ids. Returns gaps sorted by position.
 */
export function validateGaps(raw: unknown, transcript: string): FillBlankGap[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new FillBlankConfigError("NO_GAPS", "Fill-blank exercise needs at least one gap");
  }
  if (raw.length > MAX_GAPS) {
    throw new FillBlankConfigError("INVALID_GAPS", `At most ${MAX_GAPS} gaps`);
  }
  const tokens = tokenizeTranscript(transcript);
  const ids = new Set<string>();
  const gaps = raw.map((item): FillBlankGap => {
    const g = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const id = typeof g.id === "string" ? g.id.trim() : "";
    const startToken = Number(g.startToken);
    const endToken = Number(g.endToken);
    if (!GAP_ID.test(id) || ids.has(id)) {
      throw new FillBlankConfigError("INVALID_GAPS", "Gap ids must be unique");
    }
    if (
      !Number.isInteger(startToken) ||
      !Number.isInteger(endToken) ||
      startToken < 0 ||
      endToken <= startToken ||
      endToken > tokens.length
    ) {
      throw new FillBlankConfigError("INVALID_GAPS", "Gap is outside the transcript");
    }
    const first = tokens[startToken];
    const last = tokens[endToken - 1];
    if (first.coreStart === first.coreEnd || last.coreStart === last.coreEnd) {
      throw new FillBlankConfigError("INVALID_GAPS", "Gap cannot start or end on punctuation");
    }
    ids.add(id);
    const acceptedAnswers = cleanAccepted(g.acceptedAnswers);
    return acceptedAnswers.length
      ? { id, startToken, endToken, acceptedAnswers }
      : { id, startToken, endToken };
  });
  gaps.sort((a, b) => a.startToken - b.startToken);
  for (let i = 1; i < gaps.length; i++) {
    if (gaps[i].startToken < gaps[i - 1].endToken) {
      throw new FillBlankConfigError("INVALID_GAPS", "Gaps overlap");
    }
  }
  return gaps;
}

/** Lenient read of stored gaps: drops anything that no longer fits the transcript. */
export function readGaps(raw: unknown, transcript: string): FillBlankGap[] {
  if (!Array.isArray(raw)) return [];
  const kept: unknown[] = [];
  for (const item of raw) {
    try {
      validateGaps([...kept, item], transcript);
      kept.push(item);
    } catch {
      /* skip invalid gap */
    }
  }
  return kept.length ? validateGaps(kept, transcript) : [];
}

/** Share of transcript tokens hidden by gaps (0–1), for the admin warning. */
export function hiddenRatio(transcript: string, gaps: FillBlankGap[]): number {
  const total = tokenizeTranscript(transcript).length;
  if (!total) return 0;
  const hidden = gaps.reduce((n, g) => n + (g.endToken - g.startToken), 0);
  return hidden / total;
}

function splitAroundGaps<T>(
  transcript: string,
  gaps: FillBlankGap[],
  makeGap: (gap: FillBlankGap, index: number) => T,
): (T | { type: "text"; text: string })[] {
  const tokens = tokenizeTranscript(transcript);
  const out: (T | { type: "text"; text: string })[] = [];
  let cursor = 0;
  gaps.forEach((gap, index) => {
    const start = tokens[gap.startToken].coreStart;
    if (start > cursor) out.push({ type: "text", text: transcript.slice(cursor, start) });
    out.push(makeGap(gap, index));
    cursor = tokens[gap.endToken - 1].coreEnd;
  });
  if (cursor < transcript.length) out.push({ type: "text", text: transcript.slice(cursor) });
  return out;
}

/** Learner-visible transcript: the hidden words are replaced by gap slots. */
export function buildPublicSegments(transcript: string, gaps: FillBlankGap[]): FillBlankSegment[] {
  return splitAroundGaps(transcript, gaps, (gap, index) => ({ type: "gap", id: gap.id, index }));
}

export function gradeFillBlank(
  transcript: string,
  gaps: FillBlankGap[],
  answers: Record<string, string>,
): FillBlankGrade {
  if (gaps.length === 0) throw new Error("NO_GAPS");
  const tokens = tokenizeTranscript(transcript);
  const gapResults = gaps.map((gap): FillBlankGapResult => {
    const expected = gapExpected(transcript, tokens, gap);
    const submitted = String(answers[gap.id] ?? "").slice(0, MAX_ANSWER_CHARS).trim();
    const actual = normalizeAnswer(submitted);
    if (!actual) return { gapId: gap.id, submitted, expected, status: "blank" };
    const ok = [expected, ...(gap.acceptedAnswers ?? [])].some(
      (candidate) => normalizeAnswer(candidate) === actual,
    );
    return { gapId: gap.id, submitted, expected, status: ok ? "correct" : "incorrect" };
  });
  const correctCount = gapResults.filter((r) => r.status === "correct").length;
  return {
    score: Math.round((correctCount / gaps.length) * 100),
    correctCount,
    totalGaps: gaps.length,
    gapResults,
  };
}

/**
 * Completed transcript with stored results in place of the gaps. Returns null when the
 * exercise was edited after grading and the stored results no longer match its gaps.
 */
export function buildResultSegments(
  transcript: string,
  gaps: FillBlankGap[],
  gapResults: FillBlankGapResult[],
): FillBlankResultSegment[] | null {
  if (gaps.length !== gapResults.length) return null;
  const tokens = tokenizeTranscript(transcript);
  const aligned = gaps.every(
    (gap, i) =>
      gapResults[i].gapId === gap.id && gapResults[i].expected === gapExpected(transcript, tokens, gap),
  );
  if (!aligned) return null;
  return splitAroundGaps(transcript, gaps, (_gap, index) => ({
    type: "gap" as const,
    index,
    result: gapResults[index],
  }));
}
