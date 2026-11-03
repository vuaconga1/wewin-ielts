import { transcriptLines, type TranscriptLine } from "@/lib/shadowing/transcript";

export type CueWord = {
  w: string;
  s: number;
  e: number;
};

export type ShadowingCue = TranscriptLine & {
  /** Seconds from the start of the model audio. */
  start: number;
  end: number;
  words?: CueWord[];
};

export type CueTiming = {
  start: number;
  end: number;
  words?: CueWord[];
};

/** Stored in `ShadowingExercise.cues`; written by scripts/shadowing-cues.ts. */
export type StoredCueSet = {
  version: 1 | 2;
  aligner: string;
  /** The raw `audioUrl` the timings were computed against. */
  audioUrl: string;
  lines: { text: string; start: number; end: number; words?: CueWord[] }[];
};

/** Extra weight per sentence for the pause a speaker leaves between sentences. */
const PAUSE_WEIGHT = 6;

/**
 * Break a sentence into tokens and distribute its [start, end] duration
 * proportionally across words to produce estimated CueWord[] when exact word timings are missing.
 */
export function estimateWordTimings(text: string, startSec: number, endSec: number): CueWord[] {
  const rawTokens = text.trim().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return [];

  const start = Math.max(0, startSec);
  const end = Math.max(start + 0.1, endSec);
  const duration = end - start;

  // Heuristic word weighting: character length with minimum baseline + punctuation pauses
  const weights = rawTokens.map((tok) => {
    const cleanLen = Math.max(2, tok.replace(/[^\w]/g, "").length);
    const hasComma = /[,;:\-–—]$/.test(tok);
    const hasPeriod = /[.!?]$/.test(tok);
    return cleanLen + (hasPeriod ? 2.5 : hasComma ? 1.5 : 0);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let cursor = start;

  return rawTokens.map((w, i) => {
    const wordDur = (weights[i] / totalWeight) * duration;
    const s = Math.round(cursor * 100) / 100;
    cursor += wordDur;
    const e = i === rawTokens.length - 1 ? Math.round(end * 100) / 100 : Math.round(cursor * 100) / 100;
    return { w, s, e: Math.max(s + 0.05, e) };
  });
}

/**
 * Approximate sentence timings when no aligned cues exist: the audio duration is split
 * proportionally to sentence length. Good enough to follow along, not to cut audio exactly.
 */
export function estimateCues(lines: TranscriptLine[], durationSec: number): ShadowingCue[] {
  if (lines.length === 0) return [];
  const weights = lines.map((l) => l.text.length + PAUSE_WEIGHT);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;

  let cursor = 0;
  return lines.map((line, i) => {
    const start = cursor;
    cursor += (weights[i] / total) * span;
    const end = i === lines.length - 1 ? span : cursor;
    return {
      ...line,
      start,
      end,
      words: estimateWordTimings(line.text, start, end),
    };
  });
}

export function applyTimings(lines: TranscriptLine[], timings: CueTiming[]): ShadowingCue[] | null {
  if (timings.length !== lines.length || lines.length === 0) return null;
  return lines.map((line, i) => ({
    ...line,
    start: timings[i].start,
    end: timings[i].end,
    words:
      timings[i].words && timings[i].words!.length > 0
        ? timings[i].words
        : estimateWordTimings(line.text, timings[i].start, timings[i].end),
  }));
}

export function cueIndexAt(cues: ShadowingCue[], timeSec: number): number {
  if (cues.length === 0) return -1;
  for (let i = cues.length - 1; i >= 0; i--) {
    if (timeSec >= cues[i].start) return i;
  }
  return 0;
}

function isFiniteTime(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0;
}

/**
 * Timings for the current transcript, or null when there are none or they are stale
 * (transcript sentences or audio changed since alignment).
 */
export function validCueTimings(
  stored: unknown,
  transcript: string,
  audioUrl: string,
): CueTiming[] | null {
  if (!stored || typeof stored !== "object") return null;
  const set = stored as Partial<StoredCueSet>;
  if (
    (set.version !== 1 && set.version !== 2) ||
    set.audioUrl !== audioUrl ||
    !Array.isArray(set.lines)
  ) {
    return null;
  }
  const lines = transcriptLines(transcript);
  if (set.lines.length !== lines.length) return null;
  const timings: CueTiming[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cue = set.lines[i];
    if (!cue || cue.text !== lines[i].text || !isFiniteTime(cue.start) || !isFiniteTime(cue.end)) {
      return null;
    }
    const timing: CueTiming = {
      start: cue.start,
      end: Math.max(cue.start, cue.end),
    };
    if (set.version === 2 && Array.isArray(cue.words)) {
      const words: CueWord[] = [];
      for (const w of cue.words) {
        if (
          w &&
          typeof w.w === "string" &&
          isFiniteTime(w.s) &&
          isFiniteTime(w.e) &&
          w.s <= w.e
        ) {
          words.push({ w: w.w, s: w.s, e: w.e });
        }
      }
      if (words.length > 0) timing.words = words;
    }
    // Fallback: estimate word timings if missing (e.g. version 1 cue sets)
    if (!timing.words || timing.words.length === 0) {
      timing.words = estimateWordTimings(lines[i].text, timing.start, timing.end);
    }
    timings.push(timing);
  }
  return timings;
}
