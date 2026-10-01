/**
 * Bordered "complete the notes" blocks (Word one-cell tables).
 *
 * Stored shape:
 * - `[[box]]` … `[[/box]]` — the outer frame
 * - `[[ntitle]]` … `[[/ntitle]]` — centered bold title
 * - `[[bN]]` — Word list level N (`[[b1]]` is the hollow circle)
 *
 * Lines that already start with •, ○, o, or - keep that marker and indent.
 */

export type OutlineMarker = "hollow" | "filled" | "square" | "dash" | "plus";

export type OutlineLine =
  | { kind: "blank" }
  | { kind: "skip" }
  | { kind: "title"; text: string }
  /** Plain list introducer, left-aligned, such as "Prosopagnosia may be caused by". */
  | { kind: "center"; text: string }
  | { kind: "plain"; text: string }
  | { kind: "bullet"; level: number; marker: OutlineMarker; text: string };

export const OUTLINE_BOX_CLASS =
  "break-words rounded-sm border border-zinc-500 bg-white px-3 py-3 text-sm leading-relaxed text-zinc-800";

export const OUTLINE_TITLE_CLASS =
  "min-w-0 break-words text-center text-sm font-bold leading-relaxed text-zinc-900";

export const OUTLINE_CENTER_CLASS =
  "min-w-0 break-words text-left text-sm font-normal leading-relaxed text-zinc-900";

export const OUTLINE_PLAIN_CLASS = "min-w-0 break-words text-left";

const BULLET_PADS = ["pl-5", "pl-9", "pl-14", "pl-[4.5rem]"] as const;

export function outlineBulletRowClass(level: number): string {
  const pad = BULLET_PADS[Math.min(Math.max(level, 0), BULLET_PADS.length - 1)]!;
  return `notes-bullet-row flex min-w-0 items-start gap-2 ${pad}`;
}

export function outlineMarkerClass(marker: OutlineMarker): string {
  if (marker === "dash" || marker === "plus") {
    return `notes-bullet notes-bullet-${marker} mt-0.5 w-3 shrink-0 text-center leading-none text-zinc-900`;
  }
  if (marker === "filled") {
    return "notes-bullet notes-bullet-filled mt-[0.45rem] h-2 w-2 shrink-0 rounded-full border border-zinc-900 bg-zinc-900";
  }
  if (marker === "square") {
    return "notes-bullet notes-bullet-square mt-[0.45rem] h-2 w-2 shrink-0 border border-zinc-900 bg-zinc-900";
  }
  return "notes-bullet notes-bullet-hollow mt-[0.45rem] h-2 w-2 shrink-0 rounded-full border border-zinc-900 bg-transparent";
}

const LEVEL_MARKERS: OutlineMarker[] = ["filled", "hollow", "square"];

export function markerForLevel(level: number): OutlineMarker {
  const index = ((level % LEVEL_MARKERS.length) + LEVEL_MARKERS.length) % LEVEL_MARKERS.length;
  return LEVEL_MARKERS[index]!;
}

const NTITLE_RE = /^\[\[ntitle\]\]([\s\S]*?)\[\[\/ntitle\]\]$/i;
const BLEVEL_RE = /^\[\[b(\d)\]\]\s*([\s\S]+)$/i;
const GLYPH_RE = /^([ \t]*)([●•○◦▪■·])\s*(.+)$/;
const WORD_BULLET_RE = /^([ \t]*)([oO]|[-–—])\s+(\S[\s\S]*)$/;
const PLUS_BULLET_RE = /^([ \t]*)\+\s+(\S[\s\S]*)$/;

function indentLevels(spaces: string): number {
  return Math.floor(spaces.replace(/\t/g, "  ").length / 2);
}

export function classifyOutlineLine(line: string): OutlineLine {
  const trimmed = line.trim();
  if (!trimmed) return { kind: "blank" };
  if (/^\[\[\/?box\]\]$/i.test(trimmed)) return { kind: "skip" };

  const titled = trimmed.match(NTITLE_RE);
  if (titled) {
    const text = titled[1]!.trim();
    return text ? { kind: "title", text } : { kind: "blank" };
  }

  const marked = trimmed.match(BLEVEL_RE);
  if (marked) {
    const level = Number(marked[1]);
    return {
      kind: "bullet",
      level,
      marker: markerForLevel(level),
      text: marked[2]!.trim(),
    };
  }

  const glyph = line.match(GLYPH_RE);
  if (glyph) {
    const token = glyph[2]!;
    const base = token === "○" || token === "◦" ? 1 : token === "■" || token === "▪" ? 2 : 0;
    const level = base + indentLevels(glyph[1] ?? "");
    const marker: OutlineMarker =
      token === "○" || token === "◦"
        ? "hollow"
        : token === "■" || token === "▪"
          ? "square"
          : "filled";
    return { kind: "bullet", level, marker, text: glyph[3]!.trim() };
  }

  const plus = line.match(PLUS_BULLET_RE);
  if (plus) {
    return {
      kind: "bullet",
      level: 2 + indentLevels(plus[1] ?? ""),
      marker: "plus",
      text: plus[2]!.trim(),
    };
  }

  const word = line.match(WORD_BULLET_RE);
  if (word) {
    const token = word[2]!;
    const hollow = token === "o" || token === "O";
    return {
      kind: "bullet",
      level: 1 + indentLevels(word[1] ?? ""),
      marker: hollow ? "hollow" : "dash",
      text: word[3]!.trim(),
    };
  }

  return { kind: "plain", text: trimmed };
}

/**
 * A short untitled line inside summary notes, such as
 * "The core-accretion model". Bold it. Sentences, instructions, and
 * lines that already contain a numbered gap stay plain.
 */
/**
 * Short plain labels such as "After 1865:" and "1900 onwards:".
 * A longer bullet that happens to end with a colon stays a sentence.
 */
export function isNotesSectionLabel(line: string): boolean {
  const t = line.trim();
  if (!t.endsWith(":")) return false;
  if (t.length < 4 || t.length > 32) return false;
  if (/[.!?]/.test(t)) return false;
  const words = t.slice(0, -1).trim().split(/\s+/);
  return words.length >= 1 && words.length <= 3;
}

export function isNotesSubheading(line: string): boolean {
  const t = line.trim();
  if (t.length < 8 || t.length > 70) return false;
  if (/[.!?,:;]/.test(t)) return false;
  if (!/^[A-Z]/.test(t)) return false;
  if (/\d/.test(t)) return false;
  if (
    /^(questions?|write |choose |complete |match |reading |list of )/i.test(t)
  ) {
    return false;
  }
  const words = t.split(/\s+/);
  if (words.length === 1) return /^[A-Z][a-z]{4,}$/.test(t);
  return words.length >= 2 && words.length <= 10;
}

/**
 * Bold a complete section label. A fragment left in front of a numbered gap
 * ("Melatonin causes" before "7 ……") is the same sentence, not a heading.
 */
/**
 * A clause that introduces the bullets under it
 * ("Prosopagnosia may be caused by"), not a noun-phrase section label.
 */
export function isCenteredListLeadIn(line: string): boolean {
  const t = line.trim();
  if (t.length < 8 || t.length > 90) return false;
  if (/[.!?]$/.test(t)) return false;
  if (/\d/.test(t)) return false;
  return /\b(?:may|might|can|could)\b/i.test(t) && /\bby$/i.test(t);
}

export function isBoldNotesLine(line: string, brokenByBlank: boolean): boolean {
  if (brokenByBlank) return false;
  if (isCenteredListLeadIn(line)) return false;
  return isNotesSubheading(line);
}

function isNotesTitle(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 90) return false;
  if (/[.?:]$/.test(t)) return false;
  if (/(?:^|\s)\d{1,2}\s*(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/u.test(t)) return false;
  return true;
}

/** A bullet glyph sitting on its own line belongs to the next line of text. */
export function joinOrphanBullets(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const mark = lines[i]!.trim();
    if (/^[●•○◦▪■·]$/.test(mark)) {
      let next = i + 1;
      while (next < lines.length && !lines[next]!.trim()) next += 1;
      const following = lines[next]?.trim() ?? "";
      if (following && !/^[●•○◦▪■·]$/.test(following)) {
        out.push(`${mark} ${following}`);
        i = next;
        continue;
      }
    }
    out.push(lines[i]!);
  }
  return out.join("\n");
}

function mergeWrappedBulletLines(lines: OutlineLine[]): OutlineLine[] {
  const out: OutlineLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (
      line.kind === "plain" &&
      prev?.kind === "bullet" &&
      !/[.?!]["']?$/.test(prev.text.trim()) &&
      !isNotesSubheading(line.text) &&
      line.text.trim().length <= 80
    ) {
      prev.text = `${prev.text} ${line.text.trim()}`;
      continue;
    }
    out.push(line);
  }
  return out;
}

export function classifyOutlineNotes(text: string): OutlineLine[] {
  let lines = mergeWrappedBulletLines(
    joinOrphanBullets(text).split("\n").map(classifyOutlineLine),
  );
  if (
    !lines.some((line) => line.kind === "title") &&
    lines.some((line) => line.kind === "bullet")
  ) {
    const first = lines.find((line) => line.kind === "plain");
    if (first && first.kind === "plain" && isNotesTitle(first.text)) {
      lines = lines.map((line) =>
        line === first ? { kind: "title", text: first.text } : line,
      );
    }
  }
  return centerBulletLeadIns(lines);
}

function nextOutlineContent(
  lines: OutlineLine[],
  index: number,
): OutlineLine | undefined {
  for (let i = index + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.kind === "blank" || line.kind === "skip") continue;
    return line;
  }
  return undefined;
}

function centerBulletLeadIns(lines: OutlineLine[]): OutlineLine[] {
  return lines.map((line, index) => {
    if (line.kind !== "plain" || !isCenteredListLeadIn(line.text)) return line;
    const next = nextOutlineContent(lines, index);
    if (next?.kind !== "bullet") return line;
    return { kind: "center", text: line.text };
  });
}

/** A completion flowchart: steps separated by a down arrow on its own line. */
export function isFlowchartNotes(text: string): boolean {
  return text.split("\n").some((line) => /^[↓⬇]$/.test(line.trim()));
}

/**
 * The paper's bow chart was stored only as "Complete the Bow-chart below".
 * Boxes numbered 11–14 on that figure are questions start…start+3 in order.
 */
export function bowChartNotes(start: number): string {
  const a = start;
  const b = start + 1;
  const c = start + 2;
  const d = start + 3;
  return [
    "[[bow]]",
    `${a} ……`,
    `Find out their ${b} ……`,
    "Develop through:",
    `- ${c} ……`,
    "- marketing intelligence activities",
    "- research process",
    `Processed by the ${d} ……`,
    "Timely and accurate data description",
    "[[/bow]]",
  ].join("\n");
}

export function isBowChartNotes(text: string): boolean {
  return text.includes("[[bow]]");
}

export function notesLookLikeOutline(text: string): boolean {
  return classifyOutlineNotes(text).some(
    (line) => line.kind === "title" || line.kind === "bullet",
  );
}

const INLINE_TAGS = new Set([
  "a",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "span",
  "sup",
  "sub",
  "font",
]);

type HtmlTok =
  | { kind: "text"; value: string }
  | { kind: "br" }
  | { kind: "open"; name: string }
  | { kind: "close"; name: string };

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

function tokenizeHtml(html: string): HtmlTok[] {
  const out: HtmlTok[] = [];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)>|<([a-zA-Z0-9]+)([^>]*)>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (match[0].startsWith("<!--")) continue;
    if (match[1]) {
      out.push({ kind: "close", name: match[1].toLowerCase() });
      continue;
    }
    if (match[2]) {
      const name = match[2].toLowerCase();
      const attrs = match[3] ?? "";
      if (name === "br" || /\/\s*$/.test(attrs)) {
        if (name === "br") out.push({ kind: "br" });
        continue;
      }
      out.push({ kind: "open", name });
      continue;
    }
    if (match[4]) out.push({ kind: "text", value: decodeEntities(match[4]) });
  }
  return out;
}

function flushHtmlText(
  lines: string[],
  buffer: string,
  mode: "plain" | "title" | "bullet",
  level: number,
  usedTitle: { value: boolean },
): void {
  const parts = buffer
    .split("\n")
    .map((part) => part.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
  for (const part of parts) {
    if (mode === "title" && !usedTitle.value) {
      usedTitle.value = true;
      lines.push(`[[ntitle]]${part}[[/ntitle]]`);
      continue;
    }
    if (mode === "bullet") {
      lines.push(`[[b${level}]]${part}`);
      continue;
    }
    lines.push(part);
  }
}

const GAP_IN_LINE_RE = /\d{1,2}\s*(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/u;

/**
 * One-cell Word notes table → bordered outline text.
 * Returns null for heading banks and tables that are not bullet notes.
 */
export function borderedNotesFromTableHtml(tableHtml: string): string | null {
  const cells: string[] = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
    const cellRe = /<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRe.exec(rowMatch[1]!)) !== null) {
      const inner = cellMatch[1]!.trim();
      if (inner) cells.push(inner);
    }
  }
  if (cells.length !== 1) return null;
  const cell = cells[0]!;
  if (/list of headings|list of (sub-)?famil/i.test(cell.replace(/<[^>]+>/g, " "))) {
    return null;
  }
  if (!/<ul\b|<ol\b/i.test(cell)) return null;

  const lines: string[] = [];
  let buffer = "";
  let ulDepth = 0;
  const usedTitle = { value: false };
  const flush = (mode: "plain" | "title" | "bullet", level = 0) => {
    flushHtmlText(lines, buffer, mode, level, usedTitle);
    buffer = "";
  };

  for (const tok of tokenizeHtml(cell)) {
    if (tok.kind === "text") {
      buffer += tok.value;
      continue;
    }
    if (tok.kind === "br") {
      buffer += "\n";
      continue;
    }
    if (INLINE_TAGS.has(tok.name)) continue;
    if (tok.kind === "open") {
      if ((tok.name === "ul" || tok.name === "ol") && ulDepth === 0 && buffer.trim()) {
        flush("plain");
      }
      if (tok.name === "ul" || tok.name === "ol") ulDepth += 1;
      continue;
    }
    if (/^h[1-6]$/.test(tok.name)) {
      flush("title");
      continue;
    }
    if (tok.name === "p") {
      flush(ulDepth > 0 ? "bullet" : "plain", Math.max(0, ulDepth - 1));
      continue;
    }
    if (tok.name === "li") {
      if (buffer.trim()) flush("bullet", Math.max(0, ulDepth - 1));
      else buffer = "";
      continue;
    }
    if (tok.name === "ul" || tok.name === "ol") {
      ulDepth = Math.max(0, ulDepth - 1);
    }
  }
  if (buffer.trim()) flush(ulDepth > 0 ? "bullet" : "plain", Math.max(0, ulDepth - 1));

  const hasBullet = lines.some((line) => /^\[\[b\d\]\]/.test(line));
  const hasGap = lines.some((line) => GAP_IN_LINE_RE.test(line));
  if (!hasBullet || !hasGap) return null;
  return `[[box]]\n${lines.join("\n")}\n[[/box]]`;
}
