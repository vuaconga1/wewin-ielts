/**
 * Split raw test text into Parts (TestSection drafts).
 *
 * Priority of markers (first match wins per line):
 * 1. Explicit:  ## PART: <title>
 * 2. Listening: ## Section N ... | Section N:
 * 3. Reading:   ## Passage N ... | Reading Passage N
 * 4. Writing:   ## Task 1 / Task 2
 * 5. Speaking:  ## Topic: <name> | bare ## <Topic Title>
 * 6. Fallback:  single part "Full test"
 *
 * Reading false positives (rejected):
 * - "Reading Passage 2 has six sections…"
 * - "based on Reading Passage 2 on pages…"
 * - long prose after Passage N
 */

export type RawPartBlock = {
  title: string;
  order: number;
  /** Body text belonging to this part (questions + passage) */
  body: string;
  meta: Record<string, unknown>;
};

const META_LINE =
  /^(audioStart|audioEnd|timeLimit|instructions)\s*:\s*(.+)$/i;

/** Subtitle that looks like instruction/prose, not a heading label */
const PROSE_SUBTITLE =
  /^(has|have|contains|contain|on\s+pages?|which|with|above|below|and|from)\b/i;

function extractLeadingMeta(body: string): {
  meta: Record<string, unknown>;
  rest: string;
} {
  const lines = body.split(/\r?\n/);
  const meta: Record<string, unknown> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();
    if (!line) {
      i += 1;
      continue;
    }
    const m = line.match(META_LINE);
    if (!m) break;
    meta[m[1]!.toLowerCase()] = m[2]!.trim();
    i += 1;
  }
  return { meta, rest: lines.slice(i).join("\n").trim() };
}

type MarkerHit = {
  index: number;
  length: number;
  title: string;
  kind: "explicit" | "section" | "passage" | "task" | "topic" | "h2";
  /** Passage/Section number when applicable */
  number?: number;
};

function isHeadingLikeSubtitle(subtitle: string | undefined): boolean {
  if (!subtitle) return true;
  const s = subtitle.trim();
  if (!s) return true;
  if (PROSE_SUBTITLE.test(s)) return false;
  // Long prose / instruction lines
  if (s.length > 60) return false;
  if (/\bon pages?\b/i.test(s)) return false;
  if (/\bquestions?\s+\d+/i.test(s)) return false;
  if (/\b(sections?|paragraphs?)\s*[A-H](?:\s*[-–—]\s*[A-H])?\b/i.test(s)) {
    return false;
  }
  return true;
}

function matchPassageLine(trimmed: string): MarkerHit | null {
  // Prefer clear headings: "READING PASSAGE 1", "## Passage 2 - Title"
  const m = trimmed.match(
    /^(?:#{1,3}\s*)?(?:Reading\s+)?Passage\s+(\d+)\s*[:.\-]?\s*(.*)$/i,
  );
  if (!m) return null;

  const num = Number(m[1]);
  const subtitle = m[2]?.trim() ?? "";

  // Reject mid-instruction references that mammoth put on their own line
  // e.g. "Reading Passage 2 has six sections, A-F."
  if (!isHeadingLikeSubtitle(subtitle || undefined)) return null;

  // Bare "Passage N" without Reading/hash is OK only if short line
  const hasReadingOrHash =
    /^(?:#{1,3}\s*)?Reading\s+Passage/i.test(trimmed) ||
    /^#{1,3}\s*Passage/i.test(trimmed) ||
    /^PASSAGE\s+\d+/i.test(trimmed);
  if (!hasReadingOrHash && subtitle && !isHeadingLikeSubtitle(subtitle)) {
    return null;
  }

  return {
    index: 0,
    length: 0,
    title: subtitle ? `Passage ${num} - ${subtitle}` : `Passage ${num}`,
    kind: "passage",
    number: num,
  };
}

function matchSectionLine(trimmed: string): MarkerHit | null {
  const m = trimmed.match(
    /^(?:#{1,3}\s*)?(?:Listening\s+)?Section\s+(\d+)\s*[:.\-]?\s*(.*)$/i,
  );
  if (!m) return null;
  const num = Number(m[1]);
  const subtitle = m[2]?.trim() ?? "";
  if (!isHeadingLikeSubtitle(subtitle || undefined)) return null;
  // Reject "Questions 1-10 Section 1" style if it snuck in — require section at start
  return {
    index: 0,
    length: 0,
    title: subtitle ? `Section ${num} - ${subtitle}` : `Section ${num}`,
    kind: "section",
    number: num,
  };
}

function findMarkers(text: string): MarkerHit[] {
  const hits: MarkerHit[] = [];
  const lines = text.split(/\r?\n/);
  let offset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    let hit: MarkerHit | null = null;

    let m = trimmed.match(/^#{1,3}\s*PART\s*[:.\-]?\s*(.+)$/i);
    if (m) {
      hit = {
        index: offset,
        length: line.length,
        title: m[1]!.trim(),
        kind: "explicit",
      };
    }

    if (!hit) {
      const section = matchSectionLine(trimmed);
      if (section) {
        hit = { ...section, index: offset, length: line.length };
      }
    }

    if (!hit) {
      const passage = matchPassageLine(trimmed);
      if (passage) {
        hit = { ...passage, index: offset, length: line.length };
      }
    }

    if (!hit) {
      m = trimmed.match(/^(?:#{1,3}\s*)?Task\s+([12])\s*[:.\-]?\s*(.*)$/i);
      if (m) {
        const subtitle = m[2]?.trim();
        if (isHeadingLikeSubtitle(subtitle || undefined)) {
          hit = {
            index: offset,
            length: line.length,
            title: subtitle ? `Task ${m[1]} - ${subtitle}` : `Task ${m[1]}`,
            kind: "task",
            number: Number(m[1]),
          };
        }
      }
    }

    if (!hit) {
      m = trimmed.match(/^(?:#{1,3}\s*)?Topic\s*[:.\-]?\s*(.+)$/i);
      if (m && isHeadingLikeSubtitle(m[1])) {
        hit = {
          index: offset,
          length: line.length,
          title: m[1]!.trim(),
          kind: "topic",
        };
      }
    }

    if (!hit) {
      m = trimmed.match(/^##\s+(?!(?:PART|Q\d+|Question)\b)(.+)$/i);
      if (
        m &&
        !/^(questions?|answers?|keys?|instructions?)\b/i.test(m[1]!) &&
        isHeadingLikeSubtitle(m[1])
      ) {
        hit = {
          index: offset,
          length: line.length,
          title: m[1]!.trim(),
          kind: "h2",
        };
      }
    }

    if (hit) hits.push(hit);
    offset += line.length + 1;
  }

  return hits;
}

function preferMarkerKinds(hits: MarkerHit[]): MarkerHit[] {
  const priority: MarkerHit["kind"][] = [
    "explicit",
    "section",
    "passage",
    "task",
    "topic",
    "h2",
  ];

  for (const kind of priority) {
    const filtered = hits.filter((h) => h.kind === kind);
    if (filtered.length >= 1 && kind !== "h2") {
      return dedupeNumberedMarkers(filtered);
    }
    if (kind === "h2" && filtered.length >= 2) return filtered;
  }

  const strong = hits.filter((h) => h.kind !== "h2");
  if (strong.length >= 1) return dedupeNumberedMarkers(strong);

  return hits;
}

/** Keep first Passage/Section N; drop later duplicates with same number */
function dedupeNumberedMarkers(hits: MarkerHit[]): MarkerHit[] {
  const seen = new Set<string>();
  const out: MarkerHit[] = [];
  for (const h of hits) {
    if (h.number != null && (h.kind === "passage" || h.kind === "section")) {
      const key = `${h.kind}:${h.number}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(h);
  }
  return out;
}

/**
 * Merge empty/shell parts into the next part when a false split left
 * instructions without questions in one block and questions in the next.
 */
function coalesceEmptyParts(parts: RawPartBlock[]): RawPartBlock[] {
  if (parts.length <= 1) return parts;

  const result: RawPartBlock[] = [];
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i]!;
    const next = parts[i + 1];
    const curLooksEmpty =
      !cur.body.trim() ||
      (/^You should spend/i.test(cur.body.trim()) &&
        !/\bQuestions?\s+\d+/i.test(cur.body) &&
        cur.body.length < 400);

    // Merge shell "Passage N" that only has the spend-time blurb into next same-family part
    if (
      next &&
      curLooksEmpty &&
      samePartFamily(cur.title, next.title)
    ) {
      const mergedBody = [cur.body, next.body].filter(Boolean).join("\n\n");
      result.push({
        title: preferTitle(cur.title, next.title),
        order: result.length,
        body: mergedBody,
        meta: { ...cur.meta, ...next.meta },
      });
      i += 1; // skip next
      continue;
    }

    result.push({ ...cur, order: result.length });
  }

  // Drop trailing empty parts
  return result.filter(
    (p, idx) =>
      p.body.trim().length > 0 ||
      idx === 0 ||
      result.length === 1,
  );
}

function samePartFamily(a: string, b: string): boolean {
  const na = a.match(/\b(?:Passage|Section|Task)\s+(\d+)/i)?.[1];
  const nb = b.match(/\b(?:Passage|Section|Task)\s+(\d+)/i)?.[1];
  if (na && nb && na === nb) return true;
  return false;
}

function preferTitle(a: string, b: string): string {
  // Prefer shorter clean "Passage N" over "Passage N - has six…"
  if (/^Passage\s+\d+$/i.test(a)) return a;
  if (/^Section\s+\d+$/i.test(a)) return a;
  if (a.length <= b.length) return a;
  return b;
}

/**
 * Split document text into ordered part blocks.
 */
export function splitIntoParts(text: string): RawPartBlock[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [
      {
        title: "Full test",
        order: 0,
        body: "",
        meta: {},
      },
    ];
  }

  const allHits = findMarkers(normalized);
  const markers = preferMarkerKinds(allHits);

  if (markers.length === 0) {
    const { meta, rest } = extractLeadingMeta(normalized);
    return [
      {
        title: "Full test",
        order: 0,
        body: rest || normalized,
        meta,
      },
    ];
  }

  const preamble = normalized.slice(0, markers[0]!.index).trim();
  const parts: RawPartBlock[] = [];

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i]!.index + markers[i]!.length;
    const end =
      i + 1 < markers.length ? markers[i + 1]!.index : normalized.length;
    let body = normalized.slice(start, end).trim();
    const { meta, rest } = extractLeadingMeta(body);
    body = rest;

    parts.push({
      title: markers[i]!.title,
      order: i,
      body,
      meta: {
        ...meta,
        ...(i === 0 && preamble ? { preamble } : {}),
      },
    });
  }

  return coalesceEmptyParts(parts);
}

/** Exported for unit-style checks / docs */
export const PART_MARKER_EXAMPLES = {
  explicit: "## PART: Section 1 - Accommodation",
  section: "Section 2",
  passage: "Reading Passage 1",
  task: "Task 2",
  topic: "## Topic: Headphones",
} as const;
