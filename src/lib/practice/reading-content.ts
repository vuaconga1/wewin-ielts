/**
 * L/R CDI layout helpers:
 * - Reading: left = passage; right = question groups
 * - Listening: interactive notes groups (bold Questions headers + inline blanks)
 */

import { splitBoxedSegments } from "@/lib/practice/boxed-text";
import { bowChartNotes } from "@/lib/practice/notes-outline";
import {
  looksLikeRedundantGapStem,
  perQuestionSentenceStem,
} from "@/lib/questions/gap-stems";

export type ReadingQuestionGroup = {
  /** e.g. "Questions 1-6 TRUE / FALSE / NOT GIVEN" */
  header: string;
  /** Short instruction lines under the header (no statement dumps) */
  instructions: string[];
  /**
   * Notes / summary / table / form text that contains numbered blanks.
   * Only shown when gap questions use empty stems.
   * Sentence-completion lines ("6 … _______ …") are not notes.
   */
  notes: string;
  /**
   * Sentence-completion lines lifted out of notes when the stored stem is
   * empty, so the answer row can show the sentence once.
   */
  sentenceStems: Record<number, string>;
  start: number;
  end: number;
};

/** Alias — same structure used for Listening sections. */
export type PracticeQuestionGroup = ReadingQuestionGroup;

const TITLE_MAX = 100;

function normHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** "READING PASSAGE 2" alone — not a sentence that mentions the passage. */
function isPassageLabelLine(line: string): boolean {
  return /^reading\s+passage\s+\d+\s*$/i.test(line.trim());
}

/** The leftover word "below." on its own line, not a sentence containing it. */
function isStandaloneBelowLine(line: string): boolean {
  return /^below\.?$/i.test(line.trim());
}

function isBareQuestionHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.includes("[[")) return false;
  return /^questions?\s+\d+\s*(?:[-–—]\s*\d+|\s+and\s+\d+)?\s*$/i.test(t);
}

/** Instruction lines that sit above the real passage, including split wraps. */
function isLeadingInstructionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^you should spend about \d+ minutes on\b/i.test(t)) return true;
  if (
    /^questions?\s+\d+\b/i.test(t) &&
    (/\bwhich are based on\b/i.test(t) ||
      /\bbased on\s+(?:reading\s+)?passage\b/i.test(t))
  ) {
    return true;
  }
  if (isPassageLabelLine(t) || isStandaloneBelowLine(t)) return true;
  if (isBareQuestionHeadingLine(t)) return true;
  if (/^on pages?\s+\d+\b/i.test(t)) return true;
  if (/^(?:reading\s+)?passage\s+\d+\s+on pages?\b/i.test(t)) return true;
  return false;
}

/** Drop spend-time / "Reading Passage N below." chrome from the left passage. */
function stripPassageChrome(passage: string): string {
  const lines = passage.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  while (
    index < lines.length &&
    (!lines[index]!.trim() || isLeadingInstructionLine(lines[index]!))
  ) {
    index += 1;
  }
  const body = lines
    .slice(index)
    .filter((line) => !isPassageLabelLine(line) && !isStandaloneBelowLine(line));
  return body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function startsWithStructure(text: string): boolean {
  const first = text.trimStart();
  return first.startsWith("[[section]]") || first.startsWith("[[box]]");
}

function removeQuestionHeadingLines(
  passage: string,
  groups: { header: string; start: number; end: number }[],
): string {
  const groupLabels = new Set<string>();
  for (const group of groups) {
    groupLabels.add(normHeading(group.header));
    groupLabels.add(normHeading(`Questions ${group.start}-${group.end}`));
    groupLabels.add(normHeading(`Questions ${group.start}–${group.end}`));
    groupLabels.add(
      normHeading(`Questions ${group.start} and ${group.end}`),
    );
    if (group.start === group.end) {
      groupLabels.add(normHeading(`Question ${group.start}`));
    }
  }
  return passage
    .split("\n")
    .filter((line) => {
      if (isBareQuestionHeadingLine(line)) return false;
      const unmarked = line
        .trim()
        .replace(/^\[\[section\]\]/i, "")
        .replace(/\[\[\/section\]\]$/i, "")
        .trim();
      if (unmarked && groupLabels.has(normHeading(unmarked))) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isBareParagraphLabel(line: string): boolean {
  const t = line.trim();
  return (
    /^[A-I]$/i.test(t) ||
    /^[A-I][.)]$/.test(t) ||
    /^paragraph\s+[A-I]$/i.test(t)
  );
}

function isParagraphOpener(line: string): boolean {
  const t = line.trim();
  if (isBareParagraphLabel(t)) return true;
  if (/^paragraph\s+[A-I]\b/i.test(t)) return true;
  if (/^[A-I][.)]\s+\S/.test(t)) return true;
  // Loose check used only to tell a short title ("A Brief History of Tea")
  // from body text. Visual labels use matchParagraphLabel, which rejects
  // an ordinary article ("A new study").
  if (/^[A-H]\s+\S/.test(t)) return true;
  return false;
}

function findPassageTitle(
  lines: string[],
): { index: number; title: string } | null {
  const contentIdx: number[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i]!.trim()) contentIdx.push(i);
  }
  if (!contentIdx.length) return null;

  const firstIndex = contentIdx[0]!;
  const first = lines[firstIndex]!.trim();
  const marked = first.match(/^\[\[title\]\]([\s\S]*)\[\[\/title\]\]$/i);
  if (marked) return { index: firstIndex, title: marked[1]!.trim() };
  if (first.includes("[[") || first.length > TITLE_MAX) return null;
  if (isBareParagraphLabel(first) || /^[A-I][.)]\s+\S/.test(first)) return null;

  const secondIndex = contentIdx[1];
  if (secondIndex == null) return null;
  const second = lines[secondIndex]!.trim();

  // "A Brief History of Tea" / "A Journey Through World Cuisine", not "A After studying…".
  if (/^[A-H]\s+\S/.test(first)) {
    const sentence = /[.!?]["']?$/.test(first);
    if (!sentence && first.length <= 60 && isParagraphOpener(second)) {
      return { index: firstIndex, title: first };
    }
    return null;
  }

  const confirmsBody = (text: string) =>
    isParagraphOpener(text) || text.length >= 80;
  if (confirmsBody(second)) return { index: firstIndex, title: first };

  const thirdIndex = contentIdx[2];
  if (thirdIndex == null) return null;
  const third = lines[thirdIndex]!.trim();
  if (second.length <= TITLE_MAX && confirmsBody(third)) {
    return { index: firstIndex, title: first };
  }
  return null;
}

function prepareReadingPassageBody(
  passage: string,
  groups: { header: string; start: number; end: number }[],
): string {
  const cleaned = stripPassageChrome(passage);
  if (startsWithStructure(cleaned)) return cleaned;
  return removeQuestionHeadingLines(cleaned, groups);
}

type ParagraphLabel = {
  /** Text before the letter, such as "Paragraph ". */
  before: string;
  /** The letter, plus "." or ")" when that punctuation is the label. */
  mark: string;
  rest: string;
};

/**
 * IELTS paragraph label at the start of a line.
 * Accepts `A`, `A.`, `A)`, `Paragraph A`, and `A After…`.
 * Rejects an ordinary article or pronoun (`A new study`, `I went`).
 */
function matchParagraphLabel(line: string): ParagraphLabel | null {
  const t = line.trim().replace(/\u00A0/g, " ");
  if (!t || t.includes("[[")) return null;

  const paragraph = t.match(
    /^(paragraph\s+)([A-I])([.)])?(?:\s+([\s\S]+))?$/i,
  );
  if (paragraph) {
    return {
      before: paragraph[1]!,
      mark: `${paragraph[2]}${paragraph[3] ?? ""}`,
      rest: (paragraph[4] ?? "").trim(),
    };
  }

  const punctuated = t.match(/^([A-I])([.)])\s+(\S[\s\S]*)$/i);
  if (punctuated) {
    return {
      before: "",
      mark: `${punctuated[1]}${punctuated[2]}`,
      rest: punctuated[3]!.trim(),
    };
  }

  const bare = t.match(/^([A-I])([.)])?$/i);
  if (bare) {
    return {
      before: "",
      mark: `${bare[1]}${bare[2] ?? ""}`,
      rest: "",
    };
  }

  const spaced = t.match(/^([A-I])\s+(\S[\s\S]*)$/i);
  if (spaced) {
    const rest = spaced[2]!.trim();
    const sameLetter = rest[0]?.toLowerCase() === spaced[1]!.toLowerCase();
    if (/^[A-Z"“‘']/.test(rest) || sameLetter) {
      return { before: "", mark: spaced[1]!.toUpperCase(), rest };
    }
  }

  return null;
}

function formatParagraphLabel(label: ParagraphLabel): string {
  const head = `${label.before}[[plabel]]${label.mark}[[/plabel]]`;
  return label.rest ? `${head} ${label.rest}` : head;
}

function isBareLabelMarker(block: string): boolean {
  return /^\[\[plabel\]\][A-I][.)]?\[\[\/plabel\]\]$/i.test(block.trim());
}

/** A short in-passage heading such as "Schools respond" or "The melatonin shift". */
function isPassageSubheading(line: string): boolean {
  const t = line.trim();
  if (t.length < 8 || t.length > 40) return false;
  if (/[.!?,:;]/.test(t)) return false;
  return /^[A-Z]/.test(t);
}

/**
 * Word hard-wraps each visual line, so a real paragraph is several lines.
 * These openings are where the printed paragraph actually starts.
 */
const PASSAGE_PARAGRAPH_STARTS: RegExp[] = [
  /^With classes that start/i,
  /^Now, fueled by accumulating/i,
  /^According to Kyla/i,
  /^Some of the outcomes were quite/i,
  /^Blame biology, not laziness/i,
  /^As a result, teens find/i,
  /^In addition to the mood/i,
  /^To stay awake, young people/i,
  /^As the sleep research piles/i,
  /^(?:D\s+)?domestic crafts do not build/i,
  /^Women of previous generations expected/i,
  /^Textiles are frustrating to collect/i,
  /^It does not help that such work/i,
  /^It might be argued that the collector/i,
  /^The domestic crafts of this period/i,
  /^Some people collect out of/i,
  /^These may sound like nostalgic/i,
];

function startsPrintedParagraph(line: string): boolean {
  const t = line.trim();
  return PASSAGE_PARAGRAPH_STARTS.some((re) => re.test(t));
}

function lineEndsSentence(line: string): boolean {
  const t = line.trim();
  if (!/[.!?]["'”’)]?$/.test(t)) return false;
  if (/(?:a\.m\.|p\.m\.|mr\.|mrs\.|ms\.|dr\.)$/i.test(t)) return false;
  return true;
}

/** The line under the title with no full stop, such as the passage 3 standfirst. */
function isCenteredSubtitle(line: string, next: string | null): boolean {
  const t = line.trim();
  if (/^Objects made by previous generations of women should be valued more highly$/i.test(t)) {
    return true;
  }
  if (t.length < 20 || t.length > 100) return false;
  if (/[.!?,:;]$/.test(t)) return false;
  return Boolean(next && /^[A-Z]/.test(next.trim()));
}

function nextContentLine(lines: string[], from: number): string | null {
  for (let i = from; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    if (t) return t;
  }
  return null;
}

/** Split lettered paragraphs and wrap each leading label for the passage renderer. */
function markPlainParagraphs(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const paragraphs: string[] = [];
  let current: string[] = [];
  let seenBody = false;

  const flush = () => {
    const joined = current.join(" ").replace(/\s+/g, " ").trim();
    current = [];
    if (joined) {
      paragraphs.push(joined);
      seenBody = true;
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i]!.trim().replace(/^D\s+(?=domestic\b)/i, "");
    if (!raw) {
      const prev = current[current.length - 1] ?? "";
      const next = nextContentLine(lines, i + 1);
      const pageBreak = prev && !lineEndsSentence(prev) && Boolean(next && /^[a-z]/.test(next));
      if (!pageBreak) flush();
      continue;
    }
    const label = matchParagraphLabel(raw);
    if (label) {
      if (current.length) flush();
      current.push(formatParagraphLabel(label));
      seenBody = true;
      continue;
    }
    if (current.length === 1 && isBareLabelMarker(current[0]!)) {
      current[0] = `${current[0]} ${raw}`;
      continue;
    }
    if (!seenBody && current.length === 0 && isCenteredSubtitle(raw, nextContentLine(lines, i + 1))) {
      paragraphs.push(`[[title]]${raw}[[/title]]`);
      continue;
    }
    if (isPassageSubheading(raw)) {
      flush();
      paragraphs.push(`[[phead]]${raw}[[/phead]]`);
      seenBody = true;
      continue;
    }
    if (current.length && startsPrintedParagraph(raw)) flush();
    current.push(raw);
  }
  flush();
  return paragraphs.join("\n\n");
}

function layoutReadingParagraphs(text: string): string {
  const segments = splitBoxedSegments(text);
  const chunks: string[] = [];
  for (const segment of segments) {
    if (segment.kind === "text") {
      const marked = markPlainParagraphs(segment.value);
      if (marked) chunks.push(marked);
      continue;
    }
    chunks.push(`[[${segment.kind}]]${segment.value}[[/${segment.kind}]]`);
  }
  return chunks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Short heading after passage chrome and before paragraphs A/B/C.
 * Returns null when the passage opens on body text.
 */
export function readingPassageTitle(
  passage: string,
  groups: { header: string; start: number; end: number }[] = [],
): string | null {
  const prepared = prepareReadingPassageBody(passage, groups);
  return findPassageTitle(prepared.split("\n"))?.title ?? null;
}

/**
 * Left passage only: strip instruction chrome and mark the real title.
 * Question-range headings stay on the right panel; `groups` is used to
 * drop any leftover copy of those headings, not to insert them.
 */
export function decorateReadingPassage(
  passage: string,
  groups: { header: string; start: number; end: number }[] = [],
): string {
  const prepared = prepareReadingPassageBody(passage, groups);
  if (!prepared.trim() || startsWithStructure(prepared)) return prepared;
  const lines = prepared.split("\n");
  const found = findPassageTitle(lines);
  let withTitle = prepared;
  if (found && !lines[found.index]!.trim().startsWith("[[title]]")) {
    const next = lines.slice();
    next[found.index] = `[[title]]${found.title}[[/title]]`;
    withTitle = next.join("\n");
  }
  return layoutReadingParagraphs(withTitle);
}

const ROMAN_HEADING_TOKENS = [
  "xii",
  "xi",
  "x",
  "viii",
  "vii",
  "vi",
  "iv",
  "ix",
  "iii",
  "ii",
  "v",
  "i",
];

/**
 * "vii  The surprising outcome of a race" or "vii. The surprising…".
 * Longer numerals win over "v" / "i". A long "I. In conclusion…" line is
 * a passage paragraph, not a heading.
 */
function matchRomanHeading(
  line: string,
): { label: string; text: string } | null {
  const t = line.trim();
  const lower = t.toLowerCase();
  for (const token of ROMAN_HEADING_TOKENS) {
    if (!lower.startsWith(token)) continue;
    const rest = t.slice(token.length);
    const body = rest.match(/^(?:[.)]\s*|\s+)(\S[\s\S]*)$/);
    if (!body) continue;
    const text = body[1]!.trim();
    if (text.length > 120) continue;
    return { label: token, text };
  }
  return null;
}

/**
 * Lettered passage paragraphs are long prose (`A What happened…`).
 * Question stems (`Paragraph A`) and short MCQ lines stay out.
 */
/**
 * "A" on its own line, with the paragraph on the following lines
 * (Test 10 Passage 2). Same-line "A Humans are born…" still counts.
 */
function paragraphStartAt(lines: string[], index: number): string | null {
  const inline = longLetterParagraph(lines[index] ?? "");
  if (inline) return inline;
  const bare = (lines[index] ?? "").trim().match(/^([A-I])[.)]?$/i);
  if (!bare) return null;
  for (let j = index + 1; j < lines.length && j <= index + 3; j += 1) {
    const next = lines[j]!.trim();
    if (!next) continue;
    if (next.length >= 40 && !isTaskBoundaryLine(next)) {
      return bare[1]!.toUpperCase();
    }
    return null;
  }
  return null;
}

function longLetterParagraph(line: string): string | null {
  const label = matchParagraphLabel(line);
  if (!label || label.before) return null;
  const letter = label.mark.replace(/[.)]/g, "").toUpperCase();
  if (!/^[A-I]$/.test(letter)) return null;
  if (label.rest.length < 80) return null;
  return letter;
}

function isTaskBoundaryLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^Questions?\s+\d+/i.test(t)) return true;
  if (/^\d{1,2}[.)]?\s+(?:Section|Paragraph)\s+[A-I]\b/i.test(t)) return true;
  if (/^example\s+(?:section|paragraph)\s+[A-I]\b/i.test(t)) return true;
  if (/^list of headings\b/i.test(t)) return true;
  if (matchRomanHeading(t)) return true;
  if (/^(choose|write|match|complete|reading passage \d+)/i.test(t)) return true;
  return false;
}

type LetteredSlice = {
  block: string;
  before: string;
  after: string;
};

/**
 * Title plus paragraphs A–I. Question stems and a List of Headings that
 * sit above the title stay in `before`.
 */
function findLetteredPassage(source: string): LetteredSlice | null {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (paragraphStartAt(lines, i) === "A") {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  let titleStart = start;
  for (let i = start - 1; i >= 0; i -= 1) {
    const t = lines[i]!.trim();
    if (!t) {
      titleStart = i;
      continue;
    }
    if (isTaskBoundaryLine(t)) break;
    titleStart = i;
  }

  let end = start;
  let expected = "A";
  let count = 0;
  for (let i = start; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    if (!t) {
      end = i;
      continue;
    }
    const letter = paragraphStartAt(lines, i);
    if (letter === expected) {
      count += 1;
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
      end = i;
      continue;
    }
    if (letter || /^Questions?\s+\d+/i.test(t)) break;
    end = i;
  }
  if (count < 3) return null;

  const tidy = (chunk: string) => chunk.replace(/\n{3,}/g, "\n\n").trim();
  return {
    block: tidy(lines.slice(titleStart, end + 1).join("\n")),
    before: tidy(lines.slice(0, titleStart).join("\n")),
    after: tidy(lines.slice(end + 1).join("\n")),
  };
}

/** Heading-match instructions printed above the passage (Test 7 Passage 2). */
function isHeadingTaskPreamble(text: string): boolean {
  if (!text.trim()) return false;
  return (
    /list of headings/i.test(text) ||
    /^choose the correct heading\b/im.test(text) ||
    /^\d{1,2}[.)]?\s+(?:section|paragraph)\s+[A-I]\b/im.test(text)
  );
}

/**
 * Some papers print the questions first and the passage afterwards
 * (Test 12 Passage 2, Test 10 Passage 2, Test 7 Passage 2). Lift the
 * lettered block onto the left. When that block is still on the left
 * with the heading task above it, move the task to the right.
 */
function pullEmbeddedPassage(
  passage: string,
  tasks: string,
): { passage: string; tasks: string } {
  const source = tasks.trim() ? tasks : passage;
  const lifted = findLetteredPassage(source);
  if (lifted) {
    const rest = [lifted.before, lifted.after].filter(Boolean).join("\n\n");
    if (!tasks.trim()) {
      return { passage: lifted.block, tasks: rest };
    }
    const leftChrome = passage.trim();
    const left =
      leftChrome.length > 80 ? `${leftChrome}\n\n${lifted.block}` : lifted.block;
    return { passage: left, tasks: rest };
  }

  if (!tasks.trim()) return { passage, tasks };
  const embedded = findLetteredPassage(passage);
  if (!embedded || !isHeadingTaskPreamble(embedded.before)) {
    return { passage, tasks };
  }
  return {
    passage: embedded.block,
    tasks: [embedded.before, embedded.after, tasks.trim()]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/**
 * "14 Section A" / "15 Paragraph B" printed under a List of Headings.
 * Those numbers are heading matches, even when the import stored the
 * passage title or the paragraphs as the question.
 */
export function headingSectionStems(tasks: string): Map<number, string> {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const stems = new Map<number, string>();
  let inList = false;
  let sawHeading = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^list of headings\b/i.test(t)) {
      inList = true;
      sawHeading = false;
      continue;
    }
    if (!inList) continue;
    if (matchRomanHeading(t)) {
      sawHeading = true;
      continue;
    }
    if (!sawHeading) continue;
    const section = t.match(
      /^(\d{1,2})[.)]?\s+(section|paragraph)\s+([A-I])\b/i,
    );
    if (section) {
      const kind =
        section[2]!.toLowerCase() === "paragraph" ? "Paragraph" : "Section";
      stems.set(Number(section[1]), `${kind} ${section[3]!.toUpperCase()}`);
      continue;
    }
    if (stems.size > 0 && /^Questions?\s+\d+/i.test(t)) break;
  }
  return stems;
}

/**
 * "List of Options / Words" rows such as "A    front feet" … "L    hair".
 * A short printed list can be longer than the options stored on the question.
 */
export function listOfLetterOptions(
  tasks: string,
): { label: string; text: string }[] | null {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const items: { label: string; text: string }[] = [];
  let inList = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^list of (options|words)\b/i.test(t)) {
      inList = true;
      items.length = 0;
      continue;
    }
    if (!inList) continue;
    const row = t.match(/^([A-L])(?:[.)]|\s{2,})(\S.*)$/i);
    if (!row) {
      if (items.length > 0) break;
      continue;
    }
    const text = row[2]!.trim();
    if (text.length > 40) break;
    items.push({ label: row[1]!.toUpperCase(), text });
  }
  return items.length >= 4 ? items : null;
}

function sameLetterOption(
  a: { label: string; text: string },
  b: { label: string; text: string },
): boolean {
  return (
    a.label.trim().toLowerCase() === b.label.trim().toLowerCase() &&
    a.text.trim().toLowerCase() === b.text.trim().toLowerCase()
  );
}

/** Fill a word list that the import cut short (A–K stored, "L hair" still in the paper). */
export function withPrintedWordList<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const printed = listOfLetterOptions(tasks);
  if (!printed) return questions;
  return questions.map((question) => {
    const options = question.content.options ?? [];
    if (options.length < 2 || options.length >= printed.length) return question;
    const prefix = printed.slice(0, options.length);
    if (!options.every((opt, index) => sameLetterOption(opt, prefix[index]!))) {
      return question;
    }
    return {
      ...question,
      content: { ...question.content, options: printed },
    };
  });
}

/** Roman "List of Headings" printed above matching-heading questions. */
export function listOfHeadings(
  tasks: string,
): { label: string; text: string }[] | null {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) =>
    /^list of headings\b/i.test(line.trim()),
  );
  if (start < 0) return null;
  const items: { label: string; text: string }[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    if (!t) continue;
    const heading = matchRomanHeading(t);
    if (!heading) {
      if (items.length) break;
      continue;
    }
    items.push(heading);
  }
  return items.length >= 3 ? items : null;
}

type HeadingQuestion = {
  number: number;
  type: string;
  content: {
    options?: { label: string; text: string }[];
    stem?: string;
  };
};

/**
 * Matching-heading imports sometimes store paragraphs A–H as the options,
 * so the passage is drawn again on the right. When a List of Headings is
 * present, those long lettered options become the roman headings instead.
 */
export function withHeadingBank<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const headings = listOfHeadings(tasks);
  if (!headings) return questions;
  const sectionStems = headingSectionStems(tasks);
  return questions.map((question) => {
    const sectionStem = sectionStems.get(question.number);
    const options = question.content.options ?? [];
    const passageOption = (opt: { label: string; text: string }) =>
      /^[A-I]$/i.test(opt.label.trim()) && opt.text.trim().length > 80;
    const romanOption = (opt: { label: string; text: string }) =>
      /^(?:xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)$/i.test(opt.label.trim());
    const headingStem =
      question.type === "MATCHING" &&
      /^(?:paragraph|section)\s+[A-I]$/i.test(
        (question.content.stem ?? "").trim(),
      );
    const copiedPassage =
      question.type === "MATCHING" &&
      options.length >= 3 &&
      options.every(passageOption);
    const mixedPassage =
      question.type === "MATCHING" &&
      options.some(romanOption) &&
      options.some(passageOption);
    if (!sectionStem && !copiedPassage && !headingStem && !mixedPassage) {
      return question;
    }
    return {
      ...question,
      type: "MATCHING",
      content: {
        ...question.content,
        ...(sectionStem ? { stem: sectionStem } : {}),
        options: headings,
      },
    };
  });
}

function nextContent(
  lines: string[],
  from: number,
): { index: number; text: string } | null {
  for (let i = from; i < lines.length; i += 1) {
    const text = lines[i]!.trim();
    if (text) return { index: i, text };
  }
  return null;
}

/**
 * "READING PASSAGE 3" on its own line, with a blank line before "in boxes…",
 * belongs in the sentence around it.
 * YES / NO / NOT GIVEN printed as three words, then three "if…" lines, are
 * one gloss each.
 */
function joinWrappedPassageSentences(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    const next = nextContent(lines, i + 1);
    if (t && /^READING PASSAGE\s+\d+$/i.test(t) && next && /^[a-z]/.test(next.text)) {
      const piece = `${t} ${next.text}`;
      let prevIndex = out.length - 1;
      while (prevIndex >= 0 && !out[prevIndex]!.trim()) prevIndex -= 1;
      const prev = prevIndex >= 0 ? out[prevIndex]!.trim() : "";
      if (prev && !/[.?!]$/.test(prev) && !/^READING PASSAGE\s+\d+$/i.test(prev)) {
        out.splice(prevIndex, out.length - prevIndex, `${prev} ${piece}`);
      } else {
        out.push(piece);
      }
      i = next.index;
      continue;
    }
    out.push(lines[i]!);
  }
  return zipYesNoGloss(out.join("\n"));
}

function zipYesNoGloss(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const yes = lines[i]!.trim();
    if (!/^YES$/i.test(yes)) {
      out.push(lines[i]!);
      continue;
    }
    const no = nextContent(lines, i + 1);
    const ng = no ? nextContent(lines, no.index + 1) : null;
    if (!no || !ng || !/^NO$/i.test(no.text) || !/^NOT GIVEN$/i.test(ng.text)) {
      out.push(lines[i]!);
      continue;
    }
    const gloss: { index: number; text: string }[] = [];
    let from = ng.index + 1;
    while (gloss.length < 3) {
      const row = nextContent(lines, from);
      if (!row || !/^if\b/i.test(row.text)) break;
      gloss.push(row);
      from = row.index + 1;
    }
    if (gloss.length !== 3) {
      out.push(lines[i]!);
      continue;
    }
    out.push(`YES ${gloss[0]!.text}`);
    out.push(`NO ${gloss[1]!.text}`);
    out.push(`NOT GIVEN ${gloss[2]!.text}`);
    i = gloss[2]!.index;
  }
  return out.join("\n");
}

/**
 * Import glitches: a letter glued to the next word (`Ddomestic` is `domestic`),
 * and the same word spelled `ddomestic` later in the passage and questions.
 */
export function repairImportedText(text: string): string {
  const unglued = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line.replace(/^([A-H])([a-z]{4,})/, (full, letter: string, word: string) => {
        if (word[0]!.toLowerCase() !== letter.toLowerCase()) return full;
        return word;
      }),
    )
    .join("\n");
  return unglued
    .replace(/\bddomestic\b/g, "domestic")
    .replace(/^(list of headings)(?=[ivx])/gim, "$1\n");
}

function inlineBlankNumbers(text: string): number[] {
  const found = new Set<number>();
  const re =
    /(?:(?<!\d)(\d{1,2})\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)|(?<=\S\s)(\d{1,2})\s{2,}(?=[A-Za-z]))/gu;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const n = Number(match[1] ?? match[2]);
    if (n >= 1 && n <= 40) found.add(n);
  }
  return [...found];
}

function splitMdCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  const cells = s.split("|").map((cell) => cell.trim());
  while (cells.length && !cells[cells.length - 1]) cells.pop();
  return cells;
}

/** "| A 1753 | B 1806 | C 1816 |" — a year-matching bank, one letter per cell. */
function isYearLetterTableRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|")) return false;
  const cells = splitMdCells(t).filter(Boolean);
  if (cells.length < 2) return false;
  return cells.every((cell) => /^[A-G]\s+\d{3,4}$/i.test(cell));
}

/** "| A | form and function | B | long yawns |" — not a completion table. */
function isLetterWordTableRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|") || BLANK_MARK_RE.test(t)) return false;
  const cells = splitMdCells(t);
  if (cells.length < 2 || cells.length % 2 !== 0) return false;
  for (let i = 0; i < cells.length; i += 2) {
    const label = cells[i] ?? "";
    const text = cells[i + 1] ?? "";
    if (!/^[A-L]$/i.test(label)) return false;
    if (!text || text.length > 40) return false;
  }
  return true;
}

function isMarkdownSeparatorRow(line: string): boolean {
  const compact = line.trim().replace(/\s+/g, "");
  return /^\|?(?::?-{3,}:?\|)+$/.test(compact);
}

/**
 * A summary word box stored as a markdown table
 * ("| A | half-yawns | B | sneeze |") rather than one letter per line.
 */
function markdownWordTables(
  tasks: string,
): { options: { label: string; text: string }[]; numbers: number[] }[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[]; numbers: number[] }[] =
    [];
  let i = 0;
  while (i < lines.length) {
    if (!isLetterWordTableRow(lines[i]!)) {
      i += 1;
      continue;
    }
    const start = i;
    const options: { label: string; text: string }[] = [];
    while (i < lines.length) {
      const row = lines[i]!.trim();
      if (!row) {
        i += 1;
        continue;
      }
      if (isMarkdownSeparatorRow(row)) {
        i += 1;
        continue;
      }
      if (!isLetterWordTableRow(row)) break;
      const cells = splitMdCells(row);
      for (let c = 0; c < cells.length; c += 2) {
        options.push({
          label: cells[c]!.toUpperCase(),
          text: cells[c + 1]!,
        });
      }
      i += 1;
    }
    const labels = options.map((opt) => opt.label).join("");
    if (options.length < 4 || !labels.startsWith("ABCD")) continue;
    let from = 0;
    for (let k = start - 1; k >= 0; k -= 1) {
      if (/^Questions?\s+\d+/i.test(lines[k]!.trim())) {
        from = k;
        break;
      }
    }
    const numbers = inlineBlankNumbers(lines.slice(from, start).join("\n"));
    if (numbers.length) runs.push({ options, numbers });
  }
  return runs;
}

/** "A competitiveness" … "E city" printed under a summary, not a sentence MCQ. */
function shortLetterRuns(
  tasks: string,
): { options: { label: string; text: string }[]; numbers: number[] }[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[]; numbers: number[] }[] =
    [];
  for (let i = 0; i < lines.length; i += 1) {
    const first = lines[i]!.trim().match(/^A(?:[.)]\s*|\s+)(\S.*)$/i);
    if (!first || first[1]!.trim().length > 32) continue;
    let prev = i - 1;
    while (prev >= 0 && !lines[prev]!.trim()) prev -= 1;
    if (isNumberedChoiceStem(lines[prev]?.trim() ?? "")) continue;
    const options: { label: string; text: string }[] = [];
    let expected = "A";
    let j = i;
    for (; j < lines.length; j += 1) {
      const t = lines[j]!.trim();
      if (!t) continue;
      const row = t.match(/^([A-L])(?:[.)]\s*|\s+)(\S.*)$/i);
      if (
        !row ||
        row[1]!.toUpperCase() !== expected ||
        row[2]!.trim().length > 32
      ) {
        break;
      }
      options.push({ label: expected, text: row[2]!.trim() });
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
    }
    if (options.length < 3) continue;
    const before = lines.slice(Math.max(0, i - 40), i).join("\n");
    runs.push({ options, numbers: inlineBlankNumbers(before) });
    i = j;
  }
  return runs;
}

function isShortWordRow(line: string): { label: string; text: string } | null {
  const row = line.trim().match(/^([A-L])(?:[.)]\s*|\s+)(\S.*)$/i);
  if (!row) return null;
  const text = row[2]!.trim();
  if (text.length > 24 || /[.?!]$/.test(text) || text.split(/\s+/).length > 3) {
    return null;
  }
  return { label: row[1]!.toUpperCase(), text };
}

/**
 * A summary word list split by a later "Questions" header
 * (A, D, then Questions 37–40, then B, C, E, F, G) is still one A–G bank.
 */
function scatteredWordLists(
  tasks: string,
): { options: { label: string; text: string }[]; numbers: number[] }[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[]; numbers: number[] }[] =
    [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!/list of words,\s*[A-L]\s*[-–—]\s*[A-L]/i.test(lines[i]!.trim())) {
      continue;
    }
    const byLetter = new Map<string, string>();
    let j = i + 1;
    let sawLetter = false;
    for (; j < lines.length; j += 1) {
      const t = lines[j]!.trim();
      if (!t) continue;
      const row = isShortWordRow(t);
      if (row) {
        byLetter.set(row.label, row.text);
        sawLetter = true;
        continue;
      }
      if (/^Questions?\s+\d+/i.test(t) && sawLetter) {
        let k = j + 1;
        while (k < lines.length && !lines[k]!.trim()) k += 1;
        if (isShortWordRow(lines[k] ?? "")) continue;
      }
      if (sawLetter) break;
    }
    if (byLetter.size < 4) continue;
    const options = [...byLetter.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, text]) => ({ label, text }));
    const numbers = inlineBlankNumbers(lines.slice(i, j).join("\n"));
    if (numbers.length) runs.push({ options, numbers });
    i = j;
  }
  return runs;
}

/**
 * A year table ("| A 1753 | B 1806 |") followed by numbered questions.
 * Those questions choose a letter; the years stay in the shared bank.
 */
export function withYearLetterBank<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[]; numbers: number[] }[] =
    [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!isYearLetterTableRow(lines[i]!)) continue;
    const options: { label: string; text: string }[] = [];
    let j = i;
    for (; j < lines.length; j += 1) {
      const row = lines[j]!.trim();
      if (!row || isMarkdownSeparatorRow(row)) continue;
      if (!isYearLetterTableRow(row)) break;
      for (const cell of splitMdCells(row).filter(Boolean)) {
        const parsed = cell.match(/^([A-G])\s+(\d{3,4})$/i);
        if (!parsed) continue;
        options.push({
          label: parsed[1]!.toUpperCase(),
          text: parsed[2]!,
        });
      }
    }
    const labels = options.map((opt) => opt.label).join("");
    if (options.length < 4 || !labels.startsWith("ABCD")) {
      i = Math.max(i, j - 1);
      continue;
    }
    const numbers: number[] = [];
    for (let k = j; k < lines.length; k += 1) {
      const t = lines[k]!.trim();
      if (!t) continue;
      if (/^Questions?\s+\d+/i.test(t)) break;
      const stem = t.match(/^(\d{1,2})[.)]?\s+\S/);
      if (stem) numbers.push(Number(stem[1]));
    }
    if (numbers.length) runs.push({ options, numbers });
    i = Math.max(i, j - 1);
  }
  if (!runs.length) return questions;
  return questions.map((question) => {
    const run = runs.find((item) => item.numbers.includes(question.number));
    if (!run) return question;
    if ((question.content.options?.length ?? 0) >= 2) return question;
    return {
      ...question,
      type: "MATCHING",
      content: { ...question.content, options: run.options },
    };
  });
}

/**
 * A summary followed by a short A–E word list fills those gaps by letter.
 * Gap-fill rows with no options, and a multiple-choice row that repeats the
 * same list, share that bank.
 */
export function withSummaryWordList<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const runs = [
    ...shortLetterRuns(tasks),
    ...scatteredWordLists(tasks),
    ...markdownWordTables(tasks),
  ];
  if (!runs.length) return questions;
  return questions.map((question) => {
    const candidates = runs.filter((item) => item.numbers.includes(question.number));
    const run = candidates.sort((a, b) => b.options.length - a.options.length)[0];
    if (!run) return question;
    const options = question.content.options ?? [];
    if (options.some((opt) => opt.text.trim().length > 32)) return question;
    if (options.length >= 2) {
      const same =
        options.length === run.options.length &&
        options.every(
          (opt, index) =>
            opt.label.trim().toUpperCase() === run.options[index]!.label &&
            opt.text.trim().toLowerCase() === run.options[index]!.text.toLowerCase(),
        );
      const subset =
        options.length < run.options.length &&
        options.every((opt) =>
          run.options.some(
            (item) =>
              item.label === opt.label.trim().toUpperCase() &&
              item.text.toLowerCase() === opt.text.trim().toLowerCase(),
          ),
        );
      if (!same && !subset) return question;
    }
    return {
      ...question,
      type: "MATCHING",
      content: { ...question.content, options: run.options },
    };
  });
}

/** "24 The Manatuto…" is an MCQ stem. "26 ……" is a summary gap. */
function isNumberedChoiceStem(line: string): boolean {
  const t = line.trim();
  if (!/^\d{1,2}\s+\S/.test(t)) return false;
  return !/(?:[.…_…]|\.){2,}|_{2,}|\u2026/u.test(t);
}

function previousContentLine(lines: string[], index: number): string {
  for (let i = index - 1; i >= 0; i -= 1) {
    const text = lines[i]!.trim();
    if (text) return text;
  }
  return "";
}

/**
 * "A. Since the speakers…" through "D. Because…" printed above questions
 * 38–40. Longer than a summary word, and the import may have kept only C and D.
 */
function letterStatementRuns(
  tasks: string,
): { options: { label: string; text: string }[]; numbers: number[] }[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[]; numbers: number[] }[] =
    [];
  for (let i = 0; i < lines.length; i += 1) {
    const first = lines[i]!.trim().match(/^A[.)]\s+(\S.*)$/);
    if (!first || first[1]!.trim().length > 160) continue;
    if (isNumberedChoiceStem(previousContentLine(lines, i))) continue;
    const options: { label: string; text: string }[] = [];
    let expected = "A";
    let j = i;
    for (; j < lines.length; j += 1) {
      const t = lines[j]!.trim();
      if (!t) continue;
      const row = t.match(/^([A-H])[.)]\s+(\S.*)$/);
      if (
        !row ||
        row[1]!.toUpperCase() !== expected ||
        row[2]!.trim().length > 160
      ) {
        break;
      }
      options.push({ label: expected, text: row[2]!.trim() });
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
    }
    if (options.length < 3) continue;
    const numbers: number[] = [];
    for (let k = j; k < lines.length; k += 1) {
      const t = lines[k]!.trim();
      if (!t) continue;
      if (/^Questions?\s+\d+/i.test(t)) break;
      const stem = t.match(/^(\d{1,2})[.)]?\s+\S/);
      if (!stem) {
        if (numbers.length) break;
        continue;
      }
      numbers.push(Number(stem[1]));
    }
    if (numbers.length) runs.push({ options, numbers });
    i = j;
  }
  return runs;
}

/**
 * A matching list printed as A–D sentences. Restore letters the import dropped
 * (stored C and D only, paper still has A and B).
 */
export function withStatementBank<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const runs = letterStatementRuns(tasks);
  if (!runs.length) return questions;
  return questions.map((question) => {
    const run = runs.find((item) => item.numbers.includes(question.number));
    if (!run) return question;
    const options = question.content.options ?? [];
    const subset =
      options.length === 0 ||
      options.every((opt) =>
        run.options.some(
          (item) =>
            item.label === opt.label.trim().toUpperCase() &&
            item.text.toLowerCase() === opt.text.trim().toLowerCase(),
        ),
      );
    if (!subset || options.length >= run.options.length) return question;
    return {
      ...question,
      type: "MATCHING",
      content: { ...question.content, options: run.options },
    };
  });
}

function isPeopleListOption(text: string): boolean {
  const t = text.trim();
  if (t.length < 2 || t.length > 90) return false;
  if (/[.?!]$/.test(t)) return false;
  return t.split(/\s+/).length <= 12;
}

/**
 * "List of People and organisationsA Scott Klara" then B–F on their own lines.
 * The import kept B–F and dropped the leading A glued to the heading.
 */
function leadingLetterBanks(
  tasks: string,
): { options: { label: string; text: string }[] }[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const runs: { options: { label: string; text: string }[] }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const t = lines[i]!.trim();
    if (!t) continue;
    const glued = t.match(/^(.*[a-z])([A-H])\s+(\S.*)$/);
    let label = "";
    let text = "";
    let ownLine = false;
    if (glued && glued[1]!.trim().length > 8) {
      label = glued[2]!.toUpperCase();
      text = glued[3]!.trim();
    } else {
      const row = t.match(/^([A-H])(?:[.)]\s*|\s+)(\S.*)$/);
      if (!row) continue;
      label = row[1]!.toUpperCase();
      text = row[2]!.trim();
      ownLine = true;
    }
    if (label !== "A" || !isPeopleListOption(text)) continue;
    if (ownLine && isNumberedChoiceStem(previousContentLine(lines, i))) continue;
    const options = [{ label: "A", text }];
    let expected = "B";
    let j = i + 1;
    for (; j < lines.length; j += 1) {
      const rowText = lines[j]!.trim();
      if (!rowText) continue;
      const row = rowText.match(/^([A-H])(?:[.)]\s*|\s+)(\S.*)$/);
      if (!row || row[1]!.toUpperCase() !== expected) break;
      const optionText = row[2]!.trim();
      if (!isPeopleListOption(optionText)) break;
      options.push({ label: expected, text: optionText });
      expected = String.fromCharCode(expected.charCodeAt(0) + 1);
    }
    if (options.length < 3) continue;
    runs.push({ options });
    i = j - 1;
  }
  return runs;
}

/**
 * A matching bank stored from B (or later) while the paper still has A.
 * Prepend the missing letters. Keep the stored B–F labels for scoring.
 */
export function withRecoveredLeadingLetter<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const runs = leadingLetterBanks(tasks);
  if (!runs.length) return questions;
  return questions.map((question) => {
    const options = question.content.options ?? [];
    if (options.length < 2) return question;
    if (/^A$/i.test(options[0]?.label.trim() ?? "")) return question;
    for (const run of runs) {
      for (let start = 1; start < run.options.length; start += 1) {
        const tail = run.options.slice(start);
        if (tail.length !== options.length) continue;
        const aligned = options.every((opt, index) => {
          const row = tail[index]!;
          return (
            opt.label.trim().toUpperCase() === row.label &&
            opt.text.trim().toLowerCase() === row.text.toLowerCase()
          );
        });
        if (!aligned) continue;
        return {
          ...question,
          content: {
            ...question.content,
            options: [...run.options.slice(0, start), ...options],
          },
        };
      }
    }
    return question;
  });
}

/**
 * "Which paragraph contains…? Write the correct letter, A–J" has no word
 * list on the paper. The dropdown is A–J. Do not draw a letter-only box,
 * and do not borrow a neighbouring people list.
 */
export function withParagraphLetterBank<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const flat = tasks.replace(/\r\n/g, "\n").replace(/\s+/g, " ");
  const ranges: {
    from: number;
    to: number;
    start: number;
    end: number;
    at: number;
  }[] = [];
  const re =
    /which (?:paragraph|section) contains[\s\S]{0,320}?write the (?:correct|appropriate) letter,?\s*([A-Z])\s*[-–—]\s*([A-Za-z]),?\s*(?:in boxes|for box(?:es)?)\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(flat))) {
    const from = match[1]!.toUpperCase().charCodeAt(0);
    // "A-l" is the usual misread of "A-I" in these paragraph instructions.
    const endToken = match[2]!;
    const to =
      endToken === "l"
        ? "I".charCodeAt(0)
        : endToken.toUpperCase().charCodeAt(0);
    if (to < from || to - from > 15) continue;
    ranges.push({
      from,
      to,
      start: Number(match[3]),
      end: Number(match[4]),
      at: match.index,
    });
  }
  if (!ranges.length) return questions;
  const owned = new Set(questions.map((question) => question.number));
  const covers = (start: number, end: number) => {
    for (let n = start; n <= end; n += 1) {
      if (owned.has(n)) return true;
    }
    return false;
  };
  for (const range of ranges) {
    if (covers(range.start, range.end)) continue;
    const before = flat.slice(Math.max(0, range.at - 400), range.at);
    const headers = [
      ...before.matchAll(/Questions?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi),
    ];
    const last = headers[headers.length - 1];
    if (!last) continue;
    const start = Number(last[1]);
    const end = Number(last[2]);
    if (covers(start, end)) {
      range.start = start;
      range.end = end;
    }
  }
  return questions.map((question) => {
    if ((question.content.options?.length ?? 0) >= 2) return question;
    const range = ranges.find(
      (item) => question.number >= item.start && question.number <= item.end,
    );
    if (!range) return question;
    const options: { label: string; text: string }[] = [];
    for (let code = range.from; code <= range.to; code += 1) {
      const label = String.fromCharCode(code);
      options.push({ label, text: label });
    }
    return {
      ...question,
      type: "MATCHING",
      content: { ...question.content, options },
    };
  });
}

const YES_NO_OPTIONS = [
  { label: "YES", text: "YES" },
  { label: "NO", text: "NO" },
  { label: "NOT GIVEN", text: "NOT GIVEN" },
];

/**
 * The paper says YES / NO / NOT GIVEN, but the import stored TRUE / FALSE.
 * Use the paper's words for the questions that follow that gloss.
 */
export function withYesNoBank<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => /^YES\s+if\b/i.test(line.trim()));
  if (start < 0) return questions;
  const hasNo = lines.some((line) => /^NO\s+if\b/i.test(line.trim()));
  const hasNg = lines.some((line) => /^NOT GIVEN\s+if\b/i.test(line.trim()));
  if (!hasNo || !hasNg) return questions;
  const numbers = new Set<number>();
  for (let i = start; i < lines.length; i += 1) {
    const match = lines[i]!.trim().match(/^(\d{1,2})\s+\S/);
    if (match) numbers.add(Number(match[1]));
  }
  return questions.map((question) => {
    if (!numbers.has(question.number) || question.type !== "TRUE_FALSE_NG") {
      return question;
    }
    const options = question.content.options ?? [];
    const closed =
      options.length === 0 ||
      options.every((opt) =>
        /^(TRUE|FALSE|NOT GIVEN|YES|NO)$/i.test(opt.label.trim()),
      );
    if (!closed) return question;
    return {
      ...question,
      content: { ...question.content, options: YES_NO_OPTIONS },
    };
  });
}

/**
 * "21 … caves?" split across lines, with A–D only in the paper.
 * Restore the rest of the stem and the options when none were stored.
 */
export function withRecoveredChoices<T extends HeadingQuestion>(
  questions: T[],
  tasks: string,
): T[] {
  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const blocks = new Map<
    number,
    { stem: string; options: { label: string; text: string }[] }
  >();
  for (let i = 0; i < lines.length; i += 1) {
    const head = lines[i]!.trim().match(/^(\d{1,2})\s+(.+)$/);
    if (!head) continue;
    const number = Number(head[1]);
    const stemParts = [head[2]!.trim()];
    const options: { label: string; text: string }[] = [];
    let expected = "A";
    for (let j = i + 1; j < lines.length; j += 1) {
      const t = lines[j]!.trim();
      if (!t) continue;
      const row = t.match(/^([A-H])(?:[.)]\s*|\s+)(\S.*)$/);
      if (row && row[1]!.toUpperCase() === expected) {
        options.push({ label: expected, text: row[2]!.trim() });
        expected = String.fromCharCode(expected.charCodeAt(0) + 1);
        continue;
      }
      if (options.length > 0) break;
      if (/^Questions?\s+\d+/i.test(t) || /^\d{1,2}\s+\S/.test(t)) break;
      if (t.length > 100) break;
      stemParts.push(t);
    }
    if (options.length >= 2) {
      blocks.set(number, { stem: stemParts.join(" "), options });
    }
  }
  return questions.map((question) => {
    if ((question.content.options?.length ?? 0) >= 2) return question;
    const block = blocks.get(question.number);
    if (!block) return question;
    const stored = (question.content.stem ?? "").trim();
    const stem =
      !stored ||
      block.stem.toLowerCase().startsWith(stored.toLowerCase().slice(0, 24))
        ? block.stem
        : stored;
    return {
      ...question,
      content: { ...question.content, stem, options: block.options },
    };
  });
}

export function splitReadingPassageAndTasks(content: string): {
  passage: string;
  tasks: string;
} {
  const normalized = repairImportedText(content);
  // Find the first real task header — skip spend-time blurbs like
  // "Questions 1-13 which are based on Reading Passage 1 below."
  const re = /\nQuestions?\s+(\d+)(?:\s*[-–—]\s*(\d+)|\s+and\s+(\d+))?\b([^\n]*)/gi;
  let m: RegExpExecArray | null;
  let passage = normalized;
  let tasks = "";
  while ((m = re.exec(normalized)) !== null) {
    const rest = (m[4] ?? "").trim();
    if (
      /\bwhich are based on\b/i.test(rest) ||
      /\bbased on\s+(?:reading\s+)?passage\b/i.test(rest)
    ) {
      continue;
    }
    const idx = m.index;
    if (idx > 40) {
      passage = normalized.slice(0, idx);
      tasks = normalized.slice(idx).trim();
      break;
    }
  }
  const split = pullEmbeddedPassage(passage, tasks);
  return {
    passage: stripPassageChrome(split.passage),
    tasks: joinWrappedPassageSentences(split.tasks),
  };
}

const BLANK_MARK_RE = /(?:[.…_…]|\.){2,}|_{2,}|\u2026+|_____/u;

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(BLANK_MARK_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isInstructionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/^Questions?\s+\d+/i.test(t)) return false;
  if (/^example\s+(?:paragraph|section)\s+[A-I]\b/i.test(t)) return true;
  if (/^White your answers\b/i.test(t)) return true;
  if (/^(NB|Note)\b/i.test(t)) return true;
  if (
    /^(Do the following|In boxes|Write |Choose |Complete |Match |Matching\b|Look at|Reading Passage|Read the |Now read |Answer the questions|According to |Which paragraph|Which section|Which types|TRUE\s*\/\s*FALSE|YES\s*\/\s*NO)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /true\s+if|false\s+if|yes\s+if|no\s+if|not\s+given|agrees with the|no more than|one word only|one word and\/or|list of (points|headings|words|options)|types of products|which paragraph contains/i.test(
      t,
    ) &&
    t.length < 160
  ) {
    return true;
  }
  return false;
}

function lineHasInlineBlank(line: string): boolean {
  return (
    (BLANK_MARK_RE.test(line) &&
      /(?<!\d)\d{1,2}\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/u.test(
        line,
      )) ||
    /(?<=\S\s)\d{1,2}\s{2,}(?=[A-Za-z])/u.test(line)
  );
}

/** Letter or roman-numeral bank rows ("A. …", "A    …", "vii   …"). */
function isOptionBankLine(line: string): boolean {
  const t = line.trim();
  if (/^[A-L][.)]\s+\S/i.test(t)) return true;
  if (/^[A-L]\s{2,}\S/.test(t)) return true;
  const single = t.match(/^[A-L]\s+(\S.*)$/i);
  if (
    single &&
    single[1]!.trim().length <= 32 &&
    !/[.?!]$/.test(single[1]!.trim())
  ) {
    return true;
  }
  return /^(?:xii|xi|viii|vii|vi|iv|iii|ii|ix|x|v|i)(?:[.)]|\s{2,})\s*\S/i.test(t);
}

function isDuplicateStemLine(
  line: string,
  stemByNumber: Map<number, string>,
): boolean {
  const t = line.trim();
  if (!t) return false;

  const numbered = t.match(/^(\d{1,2})[.)]?\s+(.+)$/);
  if (numbered) {
    const stem = stemByNumber.get(Number(numbered[1]));
    if (!stem) return false;
    const body = normalizeForCompare(numbered[2] ?? "");
    if (!body) return false;
    return body === stem || stem.includes(body) || body.includes(stem);
  }

  const norm = normalizeForCompare(t);
  if (norm.length < 20) return false;
  for (const stem of stemByNumber.values()) {
    if (stem === norm || stem.includes(norm) || norm.includes(stem)) {
      return true;
    }
  }
  return false;
}

type HeaderMatch = {
  start: number;
  end: number;
  header: string;
};

/**
 * True when "Questions N-M …" is a mid-sentence reference (e.g. a line-wrapped
 * "(Questions 23-26) and the list…"), not a real group header.
 */
function isEmbeddedQuestionRangeReference(rest: string): boolean {
  const r = rest.trim();
  if (!r) return false;
  // Broken wrap: "Questions 23-26) and the list of points…"
  if (/^[)\].,;:]/.test(r)) return true;
  // Parenthetical cite still on the same line after the range
  if (/^\)\s/.test(r) || /^\([^)]*\)/.test(r)) return true;
  return false;
}

/**
 * Match IELTS group headers, including Listening lines like:
 *   "LISTENING SECTION 1    Questions 1-10"
 *   "Questions 27 and 28"
 */
export function matchQuestionGroupHeader(line: string): HeaderMatch | null {
  const t = line.trim().replace(/\t+/g, " ").replace(/\s+/g, " ");
  if (!t) return null;

  let m = t.match(/^Questions?\s+(\d+)\s*[-–—]\s*(\d+)\b(.*)$/i);
  if (m) {
    const start = Number(m[1]);
    const end = Number(m[2]);
    const rest = (m[3] ?? "").trim();
    if (isEmbeddedQuestionRangeReference(rest)) return null;
    // Spend-time blurbs (not task group headers): "Questions 1-13 which are based on Reading Passage 1 below."
    if (/based on (Reading\s+)?Passage/i.test(rest)) return null;
    return {
      start,
      end,
      header: rest
        ? `Questions ${start}-${end} ${rest}`
        : `Questions ${start}-${end}`,
    };
  }

  m = t.match(/^Questions?\s+(\d+)\s+and\s+(\d+)\b(.*)$/i);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    const rest = (m[3] ?? "").trim();
    if (isEmbeddedQuestionRangeReference(rest)) return null;
    return {
      start,
      end,
      header: rest
        ? `Questions ${start} and ${end} ${rest}`
        : `Questions ${start} and ${end}`,
    };
  }

  // Prefixed section title + Questions range (Listening)
  m = t.match(
    /^(.*?\b(?:SECTION|Section|PART|Part)\s*\d+)\s+Questions?\s+(\d+)\s*[-–—]\s*(\d+)\b(.*)$/i,
  );
  if (m) {
    const section = m[1]!.trim();
    const start = Number(m[2]);
    const end = Number(m[3]);
    const rest = (m[4] ?? "").trim();
    return {
      start,
      end,
      header: rest
        ? `${section} · Questions ${start}-${end} ${rest}`
        : `${section} · Questions ${start}-${end}`,
    };
  }

  // "LISTENING SECTION 1 Questions 1-10" without requiring SECTION word order variants
  m = t.match(
    /^(LISTENING\s+SECTION\s*\d+)\s+Questions?\s+(\d+)\s*[-–—]\s*(\d+)\b(.*)$/i,
  );
  if (m) {
    const section = m[1]!.trim();
    const start = Number(m[2]);
    const end = Number(m[3]);
    const rest = (m[4] ?? "").trim();
    return {
      start,
      end,
      header: rest
        ? `${section} · Questions ${start}-${end} ${rest}`
        : `${section} · Questions ${start}-${end}`,
    };
  }

  // Summary/notes often omit "Questions N–M" and only say
  // "Write your answers in boxes 24–26 on your answer sheet." (Test 2 Reading).
  m = t.match(
    /\bboxes?\s+(\d+)\s*(?:[-–—]\s*(\d+)|\s+and\s+(\d+))\b/i,
  );
  if (m && /answer sheet|write (your )?answers|correct letter/i.test(t)) {
    const a = Number(m[1]);
    const b = Number(m[2] ?? m[3]);
    const start = Math.min(a, b);
    const end = Math.max(a, b);
    return {
      start,
      end,
      header: `Questions ${start}-${end}`,
    };
  }

  return null;
}

/**
 * Split task/notes text into IELTS question groups for interleaved rendering.
 */
export function parseReadingQuestionGroups(
  tasks: string,
  questions: {
    number: number;
    type: string;
    content: { stem?: string; blank?: boolean };
  }[],
): ReadingQuestionGroup[] {
  if (!tasks.trim()) return [];

  const stemByNumber = new Map<number, string>();
  const rawStemByNumber = new Map<number, string>();
  for (const q of questions) {
    const raw = (q.content.stem ?? "").trim();
    if (raw) rawStemByNumber.set(q.number, raw);
    const stem = normalizeForCompare(raw);
    if (stem.length >= 8) stemByNumber.set(q.number, stem);
  }

  const lines = tasks.replace(/\r\n/g, "\n").split("\n");
  const groups: ReadingQuestionGroup[] = [];
  let current: {
    header: string;
    start: number;
    end: number;
    body: string[];
  } | null = null;

  const flush = () => {
    if (!current) return;
    const instructions: string[] = [];
    const noteLines: string[] = [];
    const sentenceStems: Record<number, string> = {};
    let liftedSentenceLines = false;

    const skipNote = new Set<number>();
    for (let i = 0; i < current.body.length; i += 1) {
      if (
        !isLetterWordTableRow(current.body[i]!) &&
        !isYearLetterTableRow(current.body[i]!)
      ) {
        continue;
      }
      skipNote.add(i);
      if (i > 0 && isMarkdownSeparatorRow(current.body[i - 1]!)) skipNote.add(i - 1);
      if (
        i + 1 < current.body.length &&
        isMarkdownSeparatorRow(current.body[i + 1]!)
      ) {
        skipNote.add(i + 1);
      }
    }

    for (let i = 0; i < current.body.length; i += 1) {
      if (skipNote.has(i)) continue;
      const raw = current.body[i]!;
      const t = raw.trim();
      if (!t) {
        if (noteLines.length) noteLines.push("");
        continue;
      }
      if (isInstructionLine(t)) {
        if (
          current.header.toLowerCase().includes(t.toLowerCase()) ||
          t.length < 4
        ) {
          continue;
        }
        instructions.push(t);
        continue;
      }
      // Render contract: "6 Clarence … _______ …" is that question's sentence,
      // not a shared notes block. Drop it from static notes. If the stored
      // stem is empty, keep the sentence for the answer row (sentenceStems).
      // Shared notes ("Habitat 1 ……") stay inline. See
      // scripts/test-sentence-gap-layout.ts.
      const sentence = perQuestionSentenceStem(t);
      if (sentence) {
        liftedSentenceLines = true;
        const stored = rawStemByNumber.get(sentence.number) ?? "";
        if (!stored || looksLikeRedundantGapStem(stored)) {
          sentenceStems[sentence.number] = sentence.sentence;
        }
        continue;
      }
      // A summary line with numbered gaps ("… 27 …… 28 ……") contains the
      // fragment stems. It is the notes, not a duplicate of those stems.
      if (lineHasInlineBlank(t)) {
        noteLines.push(raw);
        continue;
      }
      if (isDuplicateStemLine(t, stemByNumber)) continue;
      // Option banks are rendered once beside the dropdowns, not inside notes.
      if (isOptionBankLine(t)) continue;
      noteLines.push(raw);
    }

    const joinedNotes = noteLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Shared notes / forms / summaries: keep when a number sits in the gap.
    // Never dump MCQ / matching stems as a static notes block.
    // A heading left after sentence lines are lifted may still show; the
    // sentences themselves were already removed above.
    const hasGapMarks =
      Boolean(joinedNotes) &&
      (lineHasInlineBlank(joinedNotes) || /_{2,}|_____/.test(joinedNotes));
    const recoveredBow =
      !joinedNotes &&
      current.end === current.start + 3 &&
      instructions.some((line) => /bow-chart/i.test(line))
        ? bowChartNotes(current.start)
        : "";
    const usableNotes =
      recoveredBow ||
      (hasGapMarks || (liftedSentenceLines && Boolean(joinedNotes))
        ? joinedNotes
        : "");

    groups.push({
      header: current.header,
      instructions,
      notes: usableNotes,
      sentenceStems,
      start: current.start,
      end: current.end,
    });
    current = null;
  };

  const questionNumbers = new Set(questions.map((question) => question.number));
  const rangeHitsQuestion = (start: number, end: number) => {
    for (let n = start; n <= end; n += 1) {
      if (questionNumbers.has(n)) return true;
    }
    return false;
  };

  for (const line of lines) {
    const hit = matchQuestionGroupHeader(line);
    if (hit) {
      const trimmed = line.trim();
      const boxesOnly =
        !/^Questions?\s+\d+/i.test(trimmed) && /\bboxes?\s+\d+/i.test(trimmed);
      // "boxes 1-6" on a paper that restarted numbering, while the real
      // items are Questions 14-19. Keep it as an instruction.
      if (boxesOnly && !rangeHitsQuestion(hit.start, hit.end)) {
        if (current) current.body.push(line);
        continue;
      }
      // Same range repeated (bad OCR/wrap) → keep as body, don't duplicate UI.
      if (
        current &&
        current.start === hit.start &&
        current.end === hit.end
      ) {
        current.body.push(line);
        continue;
      }
      // Umbrella "Questions 27–40" + later "boxes 27–33" → tighten to 27–33
      // instead of rendering two overlapping headers (Test 2 Passage 3).
      if (
        current &&
        hit.start >= current.start &&
        hit.end <= current.end &&
        (hit.start > current.start || hit.end < current.end)
      ) {
        current.start = hit.start;
        current.end = hit.end;
        current.header = `Questions ${hit.start}-${hit.end}`;
        current.body.push(line);
        continue;
      }
      // Carry "Complete the summary…" lines that sat above a boxes-only header
      // into the new group (Test 2 Reading Q24–26).
      const carry: string[] = [];
      if (current) {
        while (current.body.length) {
          const last = current.body[current.body.length - 1]!;
          if (
            /^(Complete the|Choose ONE WORD|Choose NO MORE THAN|Write your answers in boxes)/i.test(
              last.trim(),
            )
          ) {
            carry.unshift(current.body.pop()!);
            continue;
          }
          if (!last.trim()) {
            current.body.pop();
            continue;
          }
          break;
        }
      }
      flush();
      current = {
        header: hit.header,
        start: hit.start,
        end: hit.end,
        body: carry,
      };
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();

  return groups;
}

/** @deprecated Prefer parseReadingQuestionGroups for interleaved UI. */
export function filterReadingTaskNotes(
  tasks: string,
  questions: { number: number; content: { stem?: string } }[],
): string {
  const groups = parseReadingQuestionGroups(
    tasks,
    questions.map((q) => ({
      number: q.number,
      type: "SHORT_ANSWER",
      content: q.content,
    })),
  );
  return groups
    .map((g) =>
      [g.header, ...g.instructions, g.notes].filter(Boolean).join("\n"),
    )
    .join("\n\n")
    .trim();
}
