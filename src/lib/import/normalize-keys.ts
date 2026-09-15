/**
 * Canonical answer-key format = Key 9.docx style:
 *
 *   Listening
 *   Section 1 … Section 4   (optional labels)
 *   1. answer
 *   …
 *   40. answer
 *
 *   Reading
 *   Passage 1 … Passage 3   (optional labels)
 *   1. FALSE
 *   …
 *   40. B
 *
 * Cells may live in a Word table (4 cols Listening / 3 cols Reading).
 * Import always normalizes other layouts into this shape before merge.
 */

import {
  mergeKeysIntoQuestions,
  normalizeAnswerToken,
  parseKeysDocument,
  type KeysMap,
  type KeysParseOptions,
} from "./parse-keys";

export type CanonicalKeysResult = {
  /** Key-9 style text (Listening + Reading sections). */
  text: string;
  listening: KeysMap;
  reading: KeysMap;
  /** True when input was rewritten into canonical layout. */
  rewritten: boolean;
  listeningCount: number;
  readingCount: number;
};

const SKILL_HEADING = /^(listening|reading|writing|speaking)\b/i;

/**
 * Parse raw keys (any supported layout) and rebuild Key-9 canonical text.
 * Safe to call even when only one skill is present.
 */
export function normalizeKeysToCanonical(
  rawText: string,
  options: { preferSkill?: KeysParseOptions["skill"] } = {},
): CanonicalKeysResult {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return {
      text: "",
      listening: new Map(),
      reading: new Map(),
      rewritten: false,
      listeningCount: 0,
      readingCount: 0,
    };
  }

  const hasSkillHeadings = /^(listening|reading)\b/im.test(normalized);
  let listenMap: KeysMap = new Map();
  let readMap: KeysMap = new Map();

  if (hasSkillHeadings) {
    listenMap = parseKeysDocument(normalized, { skill: "LISTENING" });
    readMap = parseKeysDocument(normalized, { skill: "READING" });
  } else {
    const all = parseKeysDocument(normalized, {});
    const prefer = options.preferSkill;
    if (prefer === "READING") {
      readMap = all;
    } else if (prefer === "LISTENING") {
      listenMap = all;
    } else if (looksLikeReadingAnswers(all)) {
      readMap = all;
    } else {
      listenMap = all;
    }
  }

  const text = buildCanonicalText(listenMap, readMap);
  const rewritten = !isAlreadyCanonical(normalized);

  return {
    text,
    listening: listenMap,
    reading: readMap,
    rewritten,
    listeningCount: listenMap.size,
    readingCount: readMap.size,
  };
}

function looksLikeReadingAnswers(map: KeysMap): boolean {
  if (map.size === 0) return false;
  let hits = 0;
  for (const { answer } of map.values()) {
    const a = String(answer).trim().toUpperCase();
    if (
      /^(TRUE|FALSE|T|F|YES|NO|NOT GIVEN|NGV|NG)$/.test(a)
    ) {
      hits += 1;
    }
  }
  return hits >= Math.max(3, Math.floor(map.size * 0.2));
}

/**
 * Keys map for one skill after canonical normalization.
 * Prefer this over raw `parseKeysDocument` in the import pipeline.
 */
export function parseKeysCanonical(
  rawText: string,
  options: KeysParseOptions = {},
): { map: KeysMap; canonicalText: string; rewritten: boolean } {
  const result = normalizeKeysToCanonical(rawText, {
    preferSkill: options.skill,
  });
  if (!options.skill) {
    const merged = new Map(result.listening);
    for (const [k, v] of result.reading) {
      if (!merged.has(k)) merged.set(k, v);
    }
    return {
      map: merged,
      canonicalText: result.text,
      rewritten: result.rewritten,
    };
  }
  const map =
    options.skill === "LISTENING"
      ? result.listening
      : options.skill === "READING"
        ? result.reading
        : new Map(); // WRITING / SPEAKING — no answer-key merge from Key N
  // If preferred skill map is empty but the other isn't, fall back to
  // scoped parse of canonical text (handles single-skill key files).
  if (map.size === 0 && (options.skill === "LISTENING" || options.skill === "READING")) {
    return {
      map: parseKeysDocument(result.text || rawText, options),
      canonicalText: result.text,
      rewritten: result.rewritten,
    };
  }
  return {
    map,
    canonicalText: result.text,
    rewritten: result.rewritten,
  };
}

export { mergeKeysIntoQuestions, normalizeAnswerToken };

function buildCanonicalText(listening: KeysMap, reading: KeysMap): string {
  const parts: string[] = [];
  if (listening.size > 0) {
    parts.push("Listening");
    parts.push("");
    parts.push(...formatSkillAnswers(listening, "listening"));
  }
  if (reading.size > 0) {
    if (parts.length) parts.push("");
    parts.push("Reading");
    parts.push("");
    parts.push(...formatSkillAnswers(reading, "reading"));
  }
  return parts.join("\n").trim();
}

function formatSkillAnswers(
  map: KeysMap,
  skill: "listening" | "reading",
): string[] {
  const lines: string[] = [];
  const nums = [...map.keys()].sort((a, b) => a - b);
  if (skill === "listening") {
    const bands: [string, number, number][] = [
      ["Section 1", 1, 10],
      ["Section 2", 11, 20],
      ["Section 3", 21, 30],
      ["Section 4", 31, 40],
    ];
    for (const [label, start, end] of bands) {
      const band = nums.filter((n) => n >= start && n <= end);
      if (!band.length) continue;
      lines.push(label);
      for (const n of band) {
        lines.push(`${n}. ${String(map.get(n)!.answer)}`);
      }
      lines.push("");
    }
  } else {
    const bands: [string, number, number][] = [
      ["Passage 1", 1, 13],
      ["Passage 2", 14, 26],
      ["Passage 3", 27, 40],
    ];
    for (const [label, start, end] of bands) {
      const band = nums.filter((n) => n >= start && n <= end);
      if (!band.length) continue;
      lines.push(label);
      for (const n of band) {
        lines.push(`${n}. ${String(map.get(n)!.answer)}`);
      }
      lines.push("");
    }
  }
  // Leftover numbers outside usual bands
  const covered = new Set(
    lines
      .map((l) => /^(\d+)\./.exec(l)?.[1])
      .filter(Boolean)
      .map(Number),
  );
  for (const n of nums) {
    if (covered.has(n)) continue;
    lines.push(`${n}. ${String(map.get(n)!.answer)}`);
  }
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function stripNoise(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Heuristic: already looks like Key-9 (skill heading + `N. answer` lines). */
function isAlreadyCanonical(text: string): boolean {
  const t = stripNoise(text);
  if (!SKILL_HEADING.test(t.split("\n").find((l) => l.trim()) ?? "")) {
    // Single-skill files without heading still OK if mostly N. answer
  }
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 5) return false;
  const numbered = lines.filter((l) =>
    /^(?:Q(?:uestion)?\s*)?\d{1,2}\s*[:).\-]\s+\S+/i.test(l),
  ).length;
  const hasTabTable = lines.some((l) => l.includes("\t") && /\d+\./.test(l));
  // Canonical prefers one answer per line, no TSV dumps
  return numbered >= 5 && !hasTabTable && numbered / lines.length >= 0.45;
}
