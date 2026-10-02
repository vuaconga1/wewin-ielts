import { splitBoxedSegments } from "@/lib/practice/boxed-text";

/** One yellow highlight on the reading passage, stored with the attempt. */
export type PassageHighlight = {
  id: string;
  partOrder: number;
  /** Inclusive start in the passage's visible text (markup tags excluded). */
  start: number;
  /** Exclusive end in that same visible text. */
  end: number;
  quote: string;
  note: string;
};

export const HIGHLIGHT_NOTE_MAX = 500;
export const HIGHLIGHT_SPAN_MAX = 2000;
export const HIGHLIGHT_MAX_COUNT = 80;

const PLABEL_RE = /\[\[plabel\]\]([\s\S]*?)\[\[\/plabel\]\]/g;

export type PassagePiece = {
  text: string;
  start: number;
  bold: boolean;
};

export type PassageBlock =
  | {
      kind: "title" | "phead" | "section" | "paragraph";
      pieces: PassagePiece[];
    }
  | { kind: "box"; value: string };

/**
 * Visible passage text, matching the left column.
 * `[[plabel]]` tags are dropped. A newline separates blocks and is not rendered,
 * so a highlight can cross paragraphs without shifting when the markup changes
 * only inside a tag.
 */
export function buildPassageModel(source: string): {
  blocks: PassageBlock[];
  text: string;
} {
  const blocks: PassageBlock[] = [];
  const cursor = { n: 0 };
  const chunks: string[] = [];

  const addTextBlock = (
    kind: "title" | "phead" | "section" | "paragraph",
    value: string,
  ) => {
    const pieces = piecesFromLabeled(value, cursor);
    if (!pieces.length) return;
    blocks.push({ kind, pieces });
    chunks.push(pieces.map((piece) => piece.text).join(""));
    cursor.n += 1;
    chunks.push("\n");
  };

  for (const segment of splitBoxedSegments(source)) {
    if (segment.kind === "box") {
      blocks.push({ kind: "box", value: segment.value });
      continue;
    }
    if (
      segment.kind === "title" ||
      segment.kind === "phead" ||
      segment.kind === "section"
    ) {
      addTextBlock(segment.kind, segment.value);
      continue;
    }
    const paragraphs = segment.value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/^\n+|\n+$/g, ""))
      .filter((paragraph) => paragraph.trim());
    for (const paragraph of paragraphs) {
      addTextBlock("paragraph", paragraph);
    }
  }

  return { blocks, text: chunks.join("") };
}

function piecesFromLabeled(
  value: string,
  cursor: { n: number },
): PassagePiece[] {
  const pieces: PassagePiece[] = [];
  const re = new RegExp(PLABEL_RE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    pushNormalized(pieces, cursor, value.slice(last, match.index), false);
    pushNormalized(pieces, cursor, match[1] ?? "", true);
    last = match.index + match[0].length;
  }
  pushNormalized(pieces, cursor, value.slice(last), false);
  return pieces;
}

function pushNormalized(
  pieces: PassagePiece[],
  cursor: { n: number },
  raw: string,
  bold: boolean,
) {
  const text = raw.replace(/\n+/g, " ");
  if (!text) return;
  pieces.push({ text, start: cursor.n, bold });
  cursor.n += text.length;
}

export function splitPiece(
  piece: PassagePiece,
  ranges: Pick<PassageHighlight, "id" | "start" | "end">[],
): { text: string; start: number; bold: boolean; highlightId: string | null }[] {
  const from = piece.start;
  const to = piece.start + piece.text.length;
  if (to <= from) return [];
  const cuts = new Set<number>([from, to]);
  for (const range of ranges) {
    if (range.end <= from || range.start >= to) continue;
    cuts.add(Math.max(from, range.start));
    cuts.add(Math.min(to, range.end));
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: {
    text: string;
    start: number;
    bold: boolean;
    highlightId: string | null;
  }[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i]!;
    const end = points[i + 1]!;
    if (end <= start) continue;
    const hit = ranges.find((range) => range.start <= start && range.end >= end);
    out.push({
      text: piece.text.slice(start - from, end - from),
      start,
      bold: piece.bold,
      highlightId: hit?.id ?? null,
    });
  }
  return out;
}

export function sanitizeHighlights(raw: unknown): PassageHighlight[] {
  if (!Array.isArray(raw)) return [];
  const out: PassageHighlight[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const partOrder = Number(row.partOrder);
    const start = Number(row.start);
    const end = Number(row.end);
    if (!id || id.length > 40) continue;
    if (!Number.isInteger(partOrder) || partOrder < 0 || partOrder > 99) continue;
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const from = Math.floor(start);
    const to = Math.floor(end);
    if (to <= from || to - from > HIGHLIGHT_SPAN_MAX) continue;
    const quote = typeof row.quote === "string" ? row.quote.slice(0, HIGHLIGHT_SPAN_MAX) : "";
    const note = typeof row.note === "string" ? row.note.slice(0, HIGHLIGHT_NOTE_MAX) : "";
    out.push({ id, partOrder, start: from, end: to, quote, note });
    if (out.length >= HIGHLIGHT_MAX_COUNT) break;
  }
  return out;
}

function newHighlightId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `h_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function quoteSlice(passageText: string, start: number, end: number): string {
  return passageText.slice(start, end).replace(/\s+/g, " ").trim().slice(0, HIGHLIGHT_SPAN_MAX);
}

/** Add a range, merging any overlap in the same part into one highlight. */
export function addHighlight(
  existing: PassageHighlight[],
  partOrder: number,
  start: number,
  end: number,
  passageText: string,
  note = "",
): PassageHighlight[] {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  if (to <= from || to - from > HIGHLIGHT_SPAN_MAX) return existing;
  const quote = quoteSlice(passageText, from, to);
  if (!quote) return existing;

  const overlapping = existing.filter(
    (item) => item.partOrder === partOrder && item.start < to && item.end > from,
  );
  const rest = existing.filter((item) => !overlapping.includes(item));
  const mergedStart = overlapping.reduce((min, item) => Math.min(min, item.start), from);
  const mergedEnd = overlapping.reduce((max, item) => Math.max(max, item.end), to);
  const mergedQuote = quoteSlice(passageText, mergedStart, mergedEnd) || quote;
  const keptNote = (
    note.trim() ||
    overlapping
      .map((item) => item.note.trim())
      .filter(Boolean)
      .join("\n")
  ).slice(0, HIGHLIGHT_NOTE_MAX);

  const next: PassageHighlight = {
    id: overlapping[0]?.id ?? newHighlightId(),
    partOrder,
    start: mergedStart,
    end: mergedEnd,
    quote: mergedQuote,
    note: keptNote,
  };
  return [...rest, next].sort((a, b) => a.start - b.start || a.end - b.end);
}

export function removeOverlapping(
  existing: PassageHighlight[],
  partOrder: number,
  start: number,
  end: number,
): PassageHighlight[] {
  const from = Math.min(start, end);
  const to = Math.max(start, end);
  return existing.filter(
    (item) => !(item.partOrder === partOrder && item.start < to && item.end > from),
  );
}

export function setHighlightNote(
  existing: PassageHighlight[],
  id: string,
  note: string,
): PassageHighlight[] {
  const trimmed = note.slice(0, HIGHLIGHT_NOTE_MAX);
  return existing.map((item) => (item.id === id ? { ...item, note: trimmed } : item));
}

export function removeHighlight(
  existing: PassageHighlight[],
  id: string,
): PassageHighlight[] {
  return existing.filter((item) => item.id !== id);
}
