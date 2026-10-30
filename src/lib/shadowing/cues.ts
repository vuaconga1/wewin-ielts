import { transcriptLines, type TranscriptLine } from "@/lib/shadowing/transcript";

export type ShadowingCue = TranscriptLine & {
  /** Seconds from the start of the model audio. */
  start: number;
  end: number;
};

export type CueTiming = { start: number; end: number };

/** Stored in `ShadowingExercise.cues`; written by scripts/shadowing-cues.ts. */
export type StoredCueSet = {
  version: 1;
  aligner: string;
  /** The raw `audioUrl` the timings were computed against. */
  audioUrl: string;
  lines: { text: string; start: number; end: number }[];
};

/** Extra weight per sentence for the pause a speaker leaves between sentences. */
const PAUSE_WEIGHT = 6;

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
    return { ...line, start, end: i === lines.length - 1 ? span : cursor };
  });
}

export function applyTimings(lines: TranscriptLine[], timings: CueTiming[]): ShadowingCue[] | null {
  if (timings.length !== lines.length || lines.length === 0) return null;
  return lines.map((line, i) => ({ ...line, start: timings[i].start, end: timings[i].end }));
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
  if (set.version !== 1 || set.audioUrl !== audioUrl || !Array.isArray(set.lines)) return null;
  const lines = transcriptLines(transcript);
  if (set.lines.length !== lines.length) return null;
  const timings: CueTiming[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cue = set.lines[i];
    if (!cue || cue.text !== lines[i].text || !isFiniteTime(cue.start) || !isFiniteTime(cue.end)) {
      return null;
    }
    timings.push({ start: cue.start, end: Math.max(cue.start, cue.end) });
  }
  return timings;
}
