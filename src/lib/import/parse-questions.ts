import { INLINE_GAP_STEM } from "@/lib/questions/gap-stems";
import type { QuestionDraft } from "./schemas";
import { QuestionTypeSchema } from "./schemas";

/**
 * IELTS official-style question parser (Listening / Reading).
 *
 * Handles:
 * - Gap fill blanks: "1 ........................." / "7 ………………….." / "her 9  and"
 * - Numbered statements (TFNG / matching): "11 They specialise..."
 * - MCQ blocks: "16 Stem..." + A/B/C options
 * - Optional markdown template: "### Q1 [gap_fill]"
 *
 * Gap / notes / table blanks that appear inline in the part body get an
 * empty stem (`INLINE_GAP_STEM`) + `blank: true`. The full notes stay in
 * `part.content` — do not store sliding-window stem snippets.
 */

const TYPE_ALIASES: Record<string, string> = {
  gap_fill: "GAP_FILL",
  gapfill: "GAP_FILL",
  fill: "GAP_FILL",
  blank: "GAP_FILL",
  mcq: "MULTIPLE_CHOICE",
  multiple_choice: "MULTIPLE_CHOICE",
  multiplechoice: "MULTIPLE_CHOICE",
  choice: "MULTIPLE_CHOICE",
  tfng: "TRUE_FALSE_NG",
  true_false_ng: "TRUE_FALSE_NG",
  truefalse: "TRUE_FALSE_NG",
  matching: "MATCHING",
  match: "MATCHING",
  short_answer: "SHORT_ANSWER",
  short: "SHORT_ANSWER",
  table: "TABLE_COMPLETION",
  table_completion: "TABLE_COMPLETION",
  map: "MAP_LABELING",
  map_labeling: "MAP_LABELING",
  essay: "ESSAY",
  writing: "ESSAY",
  speaking: "SPEAKING_PROMPT",
  speaking_prompt: "SPEAKING_PROMPT",
  prompt: "SPEAKING_PROMPT",
};

function normalizeType(raw?: string): QuestionDraft["type"] {
  if (!raw) return "SHORT_ANSWER";
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = TYPE_ALIASES[key] ?? key.toUpperCase();
  const parsed = QuestionTypeSchema.safeParse(mapped);
  return parsed.success ? parsed.data : "SHORT_ANSWER";
}

const ANSWER_LINE = /^(?:answer|answers|key)\s*:\s*(.+)$/i;
const ACCEPTABLE_LINE = /^(?:acceptableAnswers|acceptable)\s*:\s*(.+)$/i;
const EXPLANATION_LINE = /^(?:explanation|explain)\s*:\s*(.+)$/i;
const QUESTION_HEADER =
  /^(?:#{1,6}\s*)?(?:Q(?:uestion)?\s*)?(\d+)\s*(?:[\[(]([a-z_]+)[\])])?\s*[:.\-]?\s*(.*)$/i;

export function parseQuestionsFromPartBody(body: string): QuestionDraft[] {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const templated = parseTemplatedQuestions(normalized);
  if (templated.length > 0) return templated;

  const ielts = parseIeltsStyleQuestions(normalized);
  if (ielts.length > 0) return ielts;

  return parseNumberedListFallback(normalized);
}

type TaskHint = QuestionDraft["type"] | "UNKNOWN";

function detectTaskType(instructionBlock: string): TaskHint {
  const t = instructionBlock.toLowerCase();
  if (
    /true\s+if|false\s+if|not\s+given|yes\s+if|no\s+if|true\s*\/\s*false|yes\s*\/\s*no|agrees with the information|agrees with the (views|claims)/.test(
      t,
    )
  ) {
    return "TRUE_FALSE_NG";
  }
  if (
    /label the (map|plan|diagram|floor)|floor plan|label the diagram/.test(t)
  ) {
    return "MAP_LABELING";
  }
  if (
    /choose the correct heading|list of headings|correct heading for each paragraph/.test(
      t,
    )
  ) {
    return "MATCHING";
  }
  if (/complete the table/.test(t)) {
    return "TABLE_COMPLETION";
  }
  if (
    /which paragraph contains|which section contains|choose.*(from the box|FOUR answers|THREE answers)|list of words|list of researchers|match each statement|match each characteristic|write the correct letter,\s*a-[a-k]|matching the each correct year|match.*year/i.test(
      t,
    )
  ) {
    return "MATCHING";
  }
  if (
    /which (choir|tourist|country|statement)|next to questions\s+\d+/i.test(t) &&
    /correct letter/i.test(t)
  ) {
    return "MATCHING";
  }
  if (
    /choose the correct letter|choose.*letter,\s*a,\s*b\s*(or|&)\s*c/.test(t)
  ) {
    return "MULTIPLE_CHOICE";
  }
  // Short-answer prompts ("Answer the questions below… NO MORE THAN…")
  // are NOT notes/summary gap-fill — stems belong on each question.
  if (
    /answer the questions below/.test(t) &&
    /no more than|one word|write.*word/.test(t)
  ) {
    return "SHORT_ANSWER";
  }
  if (
    /complete the notes|complete the summary|complete the sentences|complete the form|one word|no more than|write.*word/.test(
      t,
    )
  ) {
    return "GAP_FILL";
  }
  return "UNKNOWN";
}

type SubBlock = {
  startQ?: number;
  endQ?: number;
  lines: string[];
};

function parseIeltsStyleQuestions(body: string): QuestionDraft[] {
  const lines = body.split("\n");
  const blocks: SubBlock[] = [];
  let current: SubBlock = { lines: [] };
  // Paper headers: "Questions 1-10", "Question 26", "LISTENING SECTION 1 Questions 1-10"
  const rangeRe =
    /^(?:(?:LISTENING\s+)?SECTION\s+\d+\s+)?Questions?\s+(\d+)(?:\s*[-–—]\s*(\d+)|\s+and\s+(\d+))?\b/i;

  for (const line of lines) {
    const trimmed = line.trim().replace(/\t+/g, " ").replace(/\s+/g, " ");
    const m = trimmed.match(rangeRe);
    // Spend-time blurbs are not task blocks: "Questions 14-26 which are based on Reading Passage 2"
    if (m && /based on (Reading\s+)?Passage/i.test(trimmed)) {
      current.lines.push(line);
      continue;
    }
    if (m) {
      if (current.lines.length) blocks.push(current);
      const startQ = Number(m[1]);
      const endQ = m[2] ? Number(m[2]) : m[3] ? Number(m[3]) : startQ;
      current = {
        startQ: Math.min(startQ, endQ),
        endQ: Math.max(startQ, endQ),
        lines: [line],
      };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length) blocks.push(current);

  const effectiveBlocks = blocks.length === 0 ? [{ lines }] : blocks;
  const byNumber = new Map<number, QuestionDraft>();

  for (const block of effectiveBlocks) {
    const text = block.lines.join("\n");
    const hint = detectTaskType(text);
    const range =
      block.startQ != null && block.endQ != null
        ? { start: block.startQ, end: block.endQ }
        : null;

    const bank = extractLetterBank(block.lines);
    const skipUnnumberedMcq =
      hint === "MATCHING" ||
      hint === "TRUE_FALSE_NG" ||
      hint === "SHORT_ANSWER";
    const fromMcq = [
      ...extractMcqQuestions(block.lines, range),
      ...(skipUnnumberedMcq
        ? []
        : extractUnnumberedMcqQuestions(block.lines, range)),
    ];
    const fromStatements = extractNumberedStatements(
      block.lines,
      hint,
      bank,
      range,
    );
    // Prefer statements/MCQ over blank snippets for TFNG / matching /
    // short-answer / paragraph-heading tasks (avoids "5 Elements… 5 ……"
    // garbage stems and empty inputs for "9   What is…?" prompts).
    const preferStatements =
      hint === "TRUE_FALSE_NG" ||
      hint === "MATCHING" ||
      hint === "SHORT_ANSWER" ||
      /which paragraph contains|which section contains|list of researchers/i.test(
        text,
      );
    const fromBlanks = preferStatements
      ? []
      : extractBlankQuestions(text, hint, range);

    const ordered = preferStatements
      ? [...fromStatements, ...fromMcq, ...fromBlanks]
      : [...fromBlanks, ...fromMcq, ...fromStatements];

    for (const q of ordered) {
      if (range && (q.number < range.start || q.number > range.end)) continue;
      const prev = byNumber.get(q.number);
      if (!prev) {
        byNumber.set(q.number, q);
        continue;
      }
      const prevScore = questionRichness(prev);
      const nextScore = questionRichness(q);
      if (nextScore > prevScore) byNumber.set(q.number, q);
    }

    // Ensure every number in declared range exists (gap-fill notes may omit
    // dots; diagram/map tasks may live in images with only a Questions N–M header).
    if (range && shouldSynthesizeGaps(hint, text) && !preferStatements) {
      const instructionStem = instructionStemFromBlock(text);
      for (let n = range.start; n <= range.end; n++) {
        if (byNumber.has(n)) continue;
        const ctx = findNumberContext(text, n);
        const type = gapTypeFromHint(hint);
        // Number found in body ⇒ blank is inline in part.content → empty stem.
        // Missing from text (diagram/map in image) ⇒ synthetic placeholder stem.
        byNumber.set(n, {
          number: n,
          order: 0,
          type,
          content: ctx
            ? { stem: INLINE_GAP_STEM, blank: true }
            : {
                stem: instructionStem
                  ? `${instructionStem} (Q${n})`
                  : `Question ${n}`,
                blank: true,
                synthetic: true,
              },
        });
      }
    }

      // Matching / TFNG: fill missing numbers from statement-like lines in range
    if (range && preferStatements) {
      for (let n = range.start; n <= range.end; n++) {
        if (byNumber.has(n)) continue;
        const ctx = findNumberContext(text, n);
        if (!ctx) continue;
        const type =
          hint === "TRUE_FALSE_NG"
            ? "TRUE_FALSE_NG"
            : hint === "MATCHING"
              ? "MATCHING"
              : "SHORT_ANSWER";
        const content: Record<string, unknown> = {
          stem: cleanStatementStem(ctx, n),
        };
        if (type === "MATCHING" && bank.length) content.options = bank;
        if (type === "TRUE_FALSE_NG") {
          content.options = tfngOptions(text);
        }
        byNumber.set(n, { number: n, order: 0, type, content });
      }

      // Paper IELTS often lists TFNG statements without "1 / 2 / 3" prefixes.
      if (hint === "TRUE_FALSE_NG") {
        fillUnnumberedTfngStatements(byNumber, block.lines, range, text);
      }
      // Matching labels (map features / exhibitions) without numbers
      if (hint === "MATCHING") {
        fillUnnumberedMatchingLabels(byNumber, block.lines, range, bank);
      }
    }

    // Sub-range matching inside a larger MCQ section:
    // "…write the correct letter, A-F, next to questions 27-30"
    const subRangeMatch = text.match(
      /(?:next to |boxes?\s+)?questions?\s+(\d+)\s*[-–—]\s*(\d+)/i,
    );
    if (subRangeMatch && /from the box|interesting features|choose\s+(two|three|four)\s+answers/i.test(text)) {
      const subRange = {
        start: Number(subRangeMatch[1]),
        end: Number(subRangeMatch[2]),
      };
      if (
        !range ||
        subRange.start !== range.start ||
        subRange.end !== range.end
      ) {
        fillUnnumberedMatchingLabels(
          byNumber,
          block.lines,
          subRange,
          bank.length ? bank : extractLetterBank(block.lines),
        );
      }
    }
  }

  const numbers = [...byNumber.keys()].sort((a, b) => a - b);
  return numbers.map((n, order) => ({ ...byNumber.get(n)!, order }));
}

function questionRichness(q: QuestionDraft): number {
  const opts = Array.isArray(
    (q.content as { options?: unknown }).options,
  )
    ? ((q.content as { options: unknown[] }).options.length)
    : 0;
  const stem = String((q.content as { stem?: string }).stem ?? "");
  const blankPenalty = (q.content as { blank?: boolean }).blank ? -40 : 0;
  return (
    opts * 100 +
    Math.min(stem.length, 200) +
    (q.type === "MULTIPLE_CHOICE" ? 50 : 0) +
    (q.type === "TRUE_FALSE_NG" || q.type === "MATCHING" ? 30 : 0) +
    blankPenalty
  );
}

function cleanStatementStem(raw: string, number: number): string {
  return raw
    .replace(new RegExp(`\\b${number}\\b\\s*[.…_…]{2,}.*$`, "u"), "")
    .replace(new RegExp(`^.*?\\b${number}\\b[.)]?\\s*`), "")
    .replace(/\s*[.…_…]{2,}\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tfngOptions(text: string): { label: string; text: string }[] {
  const yesNo = /yes\s+if|no\s+if|yes\s*\/\s*no/i.test(text);
  return yesNo
    ? [
        { label: "YES", text: "YES" },
        { label: "NO", text: "NO" },
        { label: "NOT GIVEN", text: "NOT GIVEN" },
      ]
    : [
        { label: "TRUE", text: "TRUE" },
        { label: "FALSE", text: "FALSE" },
        { label: "NOT GIVEN", text: "NOT GIVEN" },
      ];
}

function isLikelyInstructionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^Questions?\s+\d+/i.test(t)) return true;
  if (/^(NB|Note)\b/i.test(t)) return true;
  if (
    /^(Do the following|In boxes|Write |Choose |Complete |Match |Look at|Reading Passage|TRUE\s*\/\s*FALSE|YES\s*\/\s*NO)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /true\s+if|false\s+if|not\s+given|agrees with the/i.test(t) &&
    t.length < 140
  ) {
    return true;
  }
  return false;
}

/**
 * Assign unnumbered TFNG statement paragraphs to missing question numbers
 * in order (common in Word exports that omit "1." / "2." prefixes).
 */
function fillUnnumberedTfngStatements(
  byNumber: Map<number, QuestionDraft>,
  lines: string[],
  range: { start: number; end: number },
  blockText: string,
): void {
  const missing: number[] = [];
  for (let n = range.start; n <= range.end; n++) {
    if (!byNumber.has(n)) missing.push(n);
  }
  if (missing.length === 0) return;

  const statements: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || isLikelyInstructionLine(t)) continue;
    if (/^\d{1,2}[.)]?\s+/.test(t)) continue;
    if (/^[A-K][.)]\s+/.test(t)) continue;
    if (t.length < 20) continue;
    if (!/^[A-Z“"']/.test(t)) continue;
    statements.push(t);
  }

  const opts = tfngOptions(blockText);
  for (let i = 0; i < missing.length && i < statements.length; i++) {
    const n = missing[i]!;
    byNumber.set(n, {
      number: n,
      order: 0,
      type: "TRUE_FALSE_NG",
      content: { stem: statements[i]!, options: opts },
    });
  }
}

/**
 * Assign short unnumbered labels (exhibitions, map areas) to missing
 * matching question numbers in order.
 */
function fillUnnumberedMatchingLabels(
  byNumber: Map<number, QuestionDraft>,
  lines: string[],
  range: { start: number; end: number },
  bank: { label: string; text: string }[],
): void {
  const missing: number[] = [];
  for (let n = range.start; n <= range.end; n++) {
    if (!byNumber.has(n)) missing.push(n);
  }
  if (missing.length === 0) return;

  const labels: string[] = [];
  for (const line of lines) {
    let t = line.trim();
    if (!t || isLikelyInstructionLine(t)) continue;
    if (/^\d{1,2}[.)]?\s+/.test(t)) continue;
    if (/^(Interesting features|Exhibitions|Locations|List of)\b/i.test(t)) {
      continue;
    }
    // Skip bank entries "A. the realistic colours"
    if (/^[A-K][.)]\s+/.test(t) && t.length > 20) continue;
    // Strip teacher-filled trailing letter
    t = t.replace(/\s+[A-F]\s*$/i, "").trim();
    if (t.length < 3 || t.length > 60) continue;
    if (/^[A-K]$/i.test(t)) continue;
    labels.push(t);
  }

  for (let i = 0; i < missing.length && i < labels.length; i++) {
    const n = missing[i]!;
    const content: Record<string, unknown> = { stem: labels[i]! };
    if (bank.length) content.options = bank;
    byNumber.set(n, {
      number: n,
      order: 0,
      type: "MATCHING",
      content,
    });
  }
}

function inRange(
  n: number,
  range: { start: number; end: number } | null,
): boolean {
  if (!range) return n >= 1 && n <= 40;
  return n >= range.start && n <= range.end;
}

function extractLetterBank(
  lines: string[],
): { label: string; text: string }[] {
  const bank: { label: string; text: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]!.trim();
    // Roman-numeral heading bank: "i. Fluctuations…" / "viii Determining…"
    const roman = t.match(/^([ivxlcdm]{1,6})[.)]\s+(.+)$/i);
    if (roman) {
      bank.push({
        label: roman[1]!.toLowerCase(),
        text: roman[2]!.trim(),
      });
      continue;
    }
    const sameLine = t.match(/^([A-K])\s+(.+)$/);
    if (sameLine) {
      bank.push({ label: sameLine[1]!, text: sameLine[2]!.trim() });
      continue;
    }
    // Mammoth often splits "A" and "form and function" onto separate lines
    const letterOnly = t.match(/^([A-K])$/);
    if (letterOnly) {
      let j = i + 1;
      while (j < lines.length && !lines[j]!.trim()) j += 1;
      const next = lines[j]?.trim() ?? "";
      if (next && !/^[A-K]$/.test(next) && !/^\d/.test(next)) {
        bank.push({ label: letterOnly[1]!, text: next });
      }
    }
  }
  const seen = new Set<string>();
  return bank.filter((b) => {
    if (seen.has(b.label)) return false;
    seen.add(b.label);
    return true;
  });
}

function extractBlankQuestions(
  text: string,
  hint: TaskHint,
  range: { start: number; end: number } | null,
): QuestionDraft[] {
  const questions: QuestionDraft[] = [];
  // Numbered blanks with dots/underscores (notes/table/form).
  // Also mid-line space blanks: "her 9  and" — but NOT line-leading
  // "9   What is…?" short-answer stems (those are statements, not gaps).
  const re =
    /(?:^|[\s(])(\d{1,2})\s*(?:[$£€]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)|(?<=\S)[\s(](\d{1,2})\s{2,}(?=[a-zA-Z(])/gu;
  let m: RegExpExecArray | null;
  const seen = new Set<number>();

  while ((m = re.exec(text)) !== null) {
    const number = Number(m[1] ?? m[2]);
    if (!inRange(number, range)) continue;
    if (seen.has(number)) continue;
    seen.add(number);

    // Detect blank position only — stem stays empty because the full notes
    // (with this blank) are stored on part.content for the CDI left pane.
    // Dotted blanks are never MCQ / matching / TFNG even if the block hint is.
    let type: QuestionDraft["type"] = "GAP_FILL";
    if (hint === "MAP_LABELING") type = "MAP_LABELING";
    else if (hint === "TABLE_COMPLETION") type = "TABLE_COMPLETION";

    questions.push({
      number,
      order: 0,
      type,
      content: { stem: INLINE_GAP_STEM, blank: true },
    });
  }

  return questions;
}

function shouldSynthesizeGaps(hint: TaskHint, text: string): boolean {
  if (
    hint === "GAP_FILL" ||
    hint === "MAP_LABELING" ||
    hint === "TABLE_COMPLETION"
  ) {
    return true;
  }
  if (hint === "UNKNOWN") {
    return /complete the|label the|write (one|no more than)|fill in/i.test(
      text,
    );
  }
  return false;
}

function gapTypeFromHint(hint: TaskHint): QuestionDraft["type"] {
  if (hint === "MAP_LABELING") return "MAP_LABELING";
  if (hint === "TABLE_COMPLETION") return "TABLE_COMPLETION";
  return "GAP_FILL";
}

function instructionStemFromBlock(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^Questions?\s+\d+/i.test(l));
  const useful = lines
    .filter((l) =>
      /complete|label|write|notes|diagram|table|summary|form/i.test(l),
    )
    .slice(0, 2);
  if (useful.length) return useful.join(" — ").slice(0, 160);
  return lines.slice(0, 2).join(" — ").slice(0, 160);
}

/**
 * Locate number `n` in the part body. Used to decide whether a missing gap
 * is inline (present) vs synthetic (diagram/map image-only).
 * For statement / matching fill, returns a cleaned surrounding snippet.
 * Callers for gap-fill must NOT use the snippet as a stored stem — use
 * INLINE_GAP_STEM when the number is found.
 */
function findNumberContext(text: string, n: number): string | null {
  const re = new RegExp(
    `(?:^|[\\s(])(${n})(?=\\s|(?:[$£€]\\s*)?(?:[.…_…]|\\u2026)|$)`,
    "m",
  );
  const m = re.exec(text);
  if (!m) return null;
  const start = Math.max(0, m.index - 40);
  let snippet = text.slice(start, m.index + String(n).length + 28);
  if (start > 0) {
    snippet = snippet.replace(/^\S*\s+/, "");
  }
  return snippet.replace(/\s+/g, " ").trim();
}

function extractMcqQuestions(
  lines: string[],
  range: { start: number; end: number } | null,
): QuestionDraft[] {
  const questions: QuestionDraft[] = [];
  let i = 0;

  while (i < lines.length) {
    const t = lines[i]!.trim();
    const stemMatch = t.match(/^(\d{1,2})[.)]?\s+(.+)$/);
    if (!stemMatch) {
      i += 1;
      continue;
    }

    const number = Number(stemMatch[1]);
    if (!inRange(number, range)) {
      i += 1;
      continue;
    }

    const options: { label: string; text: string }[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const optLine = lines[j]!.trim();
      if (!optLine) {
        j += 1;
        continue;
      }
      // Word often emits "A the examples used." without "A." / "A)"
      const om =
        optLine.match(/^([A-E])[.)]\s+(.+)$/) ||
        optLine.match(/^([A-E])\s+(.+)$/);
      if (!om) break;
      // Avoid treating "A more expensive products" bank lines as MCQ options
      // when the stem wasn't a real question — still OK inside MCQ blocks.
      options.push({ label: om[1]!, text: om[2]!.trim() });
      j += 1;
      if (options.length >= 5) break;
    }

    if (options.length >= 2) {
      questions.push({
        number,
        order: 0,
        type: "MULTIPLE_CHOICE",
        content: {
          stem: stemMatch[2]!.trim(),
          options,
        },
      });
      i = j;
      continue;
    }

    i += 1;
  }

  return questions;
}

/**
 * Word Listening MCQs often land as unnumbered stems + A/B/C lines
 * (from nested &lt;ol&gt;). Assign numbers in order within the Questions range.
 */
function extractUnnumberedMcqQuestions(
  lines: string[],
  range: { start: number; end: number } | null,
): QuestionDraft[] {
  if (!range) return [];
  const questions: QuestionDraft[] = [];
  let nextNum = range.start;
  let i = 0;

  while (i < lines.length && nextNum <= range.end) {
    const t = lines[i]!.trim();
    if (!t || /^\d{1,2}[.)]?\s+/.test(t) || /^([A-E])[.)]\s+/.test(t) || /^([A-E])\s{1,4}\S/.test(t)) {
      i += 1;
      continue;
    }
    // Stem candidate: not an instruction / list header, followed by A/B options
    if (
      /^Questions?\s+\d+/i.test(t) ||
      /^Choose\b/i.test(t) ||
      /^(List of|Interesting features|Exhibitions|Locations)\b/i.test(t)
    ) {
      i += 1;
      continue;
    }

    const options: { label: string; text: string }[] = [];
    let j = i + 1;
    while (j < lines.length) {
      const optLine = lines[j]!.trim();
      if (!optLine) {
        j += 1;
        continue;
      }
      const om =
        optLine.match(/^([A-E])[.)]\s+(.+)$/) ||
        optLine.match(/^([A-E])\s+(.+)$/);
      if (!om) break;
      options.push({ label: om[1]!, text: om[2]!.trim() });
      j += 1;
      if (options.length >= 5) break;
    }

    if (options.length >= 2 && t.length >= 12) {
      questions.push({
        number: nextNum,
        order: 0,
        type: "MULTIPLE_CHOICE",
        content: { stem: t, options },
      });
      nextNum += 1;
      i = j;
      continue;
    }
    i += 1;
  }

  return questions;
}

function extractNumberedStatements(
  lines: string[],
  hint: TaskHint,
  bank: { label: string; text: string }[],
  range: { start: number; end: number } | null,
): QuestionDraft[] {
  const questions: QuestionDraft[] = [];
  const bankTexts = new Set(
    bank.map((b) => b.text.toLowerCase().replace(/\s+/g, " ").trim()),
  );

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]!.trim();
    // Word papers often omit the period: "9   What is…?" / "4 can endure…"
    const m =
      t.match(/^(\d{1,2})[.)]\s*(.+)$/) ||
      t.match(/^(\d{1,2})\)\s+(.+)$/) ||
      t.match(/^(\d{1,2})\s+(.+)$/);
    if (!m) continue;
    const number = Number(m[1]);
    if (!inRange(number, range)) continue;

    // Skip word-bank values left on their own line ("3 seconds") after a letter label
    const prevNonEmpty = [...lines.slice(0, i)]
      .reverse()
      .find((l) => l.trim())
      ?.trim();
    if (prevNonEmpty && /^[A-K]$/.test(prevNonEmpty)) continue;

    const stem = m[2]!
      .trim()
      .replace(new RegExp(`\\b${number}\\b\\s*[.…_…]{2,}.*$`, "u"), "")
      .replace(/\s*[.…_…]{2,}\s*$/u, "")
      .trim();
    if (!stem || stem.length < 3) continue;
    if (bankTexts.has(stem.toLowerCase())) continue;
    // Pure blank markers left after strip — not a statement stem
    if (/^[.…_…_\s]+$/u.test(stem)) continue;
    // Tiny fragments that are bank entries, not questions
    if (
      hint !== "TRUE_FALSE_NG" &&
      hint !== "MATCHING" &&
      stem.length < 12 &&
      !/[?]/.test(stem)
    ) {
      continue;
    }

    let type: QuestionDraft["type"] = "SHORT_ANSWER";
    if (hint === "TRUE_FALSE_NG") type = "TRUE_FALSE_NG";
    else if (hint === "MATCHING") type = "MATCHING";
    else if (hint === "SHORT_ANSWER") type = "SHORT_ANSWER";
    else if (hint === "GAP_FILL") {
      // Full interrogatives without blank marks are short-answer, not notes gaps
      const hasBlankMark = /[.…_…]{2,}|_{2,}|\u2026/u.test(stem);
      type = hasBlankMark ? "GAP_FILL" : "SHORT_ANSWER";
    } else if (hint === "MULTIPLE_CHOICE") type = "MULTIPLE_CHOICE";

    const content: Record<string, unknown> = { stem };
    if (type === "MATCHING" && bank.length) content.options = bank;
    if (type === "TRUE_FALSE_NG") {
      content.options = tfngOptions(lines.join("\n"));
    }

    questions.push({ number, order: 0, type, content });
  }

  return questions;
}

/* ---------------- Template style ---------------- */

function parseTemplatedQuestions(body: string): QuestionDraft[] {
  const lines = body.split("\n");
  const headerIndexes: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i]!.trim();
    if (!t) continue;
    if (/^(?:#{1,3}\s*)?(?:PART|Section|Passage|Task|Topic)\b/i.test(t)) {
      continue;
    }
    // Only markdown/template headers — NOT paper IELTS "Question 26" / "Questions 14-20"
    // (those must go through parseIeltsStyleQuestions).
    const isTemplate =
      /^(?:#{1,6}\s*)?Q(?:uestion)?\s*\d+\s*[\[(][a-z_]+[\])]/i.test(t) ||
      /^(?:#{3,6})\s*Q?\s*\d+\b/.test(t) ||
      /^Q\d+\s*:\s*/i.test(t);
    if (isTemplate) {
      headerIndexes.push(i);
    }
  }

  if (headerIndexes.length === 0) return [];

  const questions: QuestionDraft[] = [];

  for (let qi = 0; qi < headerIndexes.length; qi++) {
    const start = headerIndexes[qi]!;
    const end =
      qi + 1 < headerIndexes.length ? headerIndexes[qi + 1]! : lines.length;
    const header = lines[start]!.trim();
    const hm = header.match(QUESTION_HEADER);
    if (!hm) continue;

    const number = Number(hm[1]);
    const type = normalizeType(hm[2]);
    const inlineStem = hm[3]?.trim() ?? "";
    const blockLines = lines.slice(start + 1, end).map((l) => l.trimEnd());

    let correctAnswer: unknown;
    let acceptableAnswers: string[] | undefined;
    let explanation: string | undefined;
    const contentLines: string[] = [];
    if (inlineStem) contentLines.push(inlineStem);

    for (const line of blockLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        contentLines.push("");
        continue;
      }
      let am = trimmed.match(ANSWER_LINE);
      if (am) {
        correctAnswer = parseAnswerValue(am[1]!);
        continue;
      }
      am = trimmed.match(ACCEPTABLE_LINE);
      if (am) {
        acceptableAnswers = am[1]!
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        continue;
      }
      am = trimmed.match(EXPLANATION_LINE);
      if (am) {
        explanation = am[1]!.trim();
        continue;
      }
      contentLines.push(line);
    }

    const options = parseOptions(
      contentLines.map((l) => l.trim()).filter(Boolean),
    );
    const stem = contentLines
      .filter((l) => {
        const x = l.trim();
        return x && !/^([A-Ha-h]|[1-9])[).:\-]\s+/.test(x);
      })
      .join("\n")
      .trim();

    questions.push({
      number,
      order: questions.length,
      type,
      content: { stem, ...(options.length ? { options } : {}) },
      correctAnswer,
      acceptableAnswers,
      explanation,
    });
  }

  return questions;
}

function parseOptions(lines: string[]): { label: string; text: string }[] {
  const options: { label: string; text: string }[] = [];
  for (const line of lines) {
    const m = line.match(/^([A-Ha-h]|[1-9])[).:\-]\s*(.+)$/);
    if (m) options.push({ label: m[1]!.toUpperCase(), text: m[2]!.trim() });
  }
  return options;
}

function parseAnswerValue(raw: string): unknown {
  const t = raw.trim();
  if (t.includes("|")) {
    return t
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (
    /^\d+\s*[-:=]\s*[A-Za-z0-9]+(\s*,\s*\d+\s*[-:=]\s*[A-Za-z0-9]+)+$/.test(t)
  ) {
    const map: Record<string, string> = {};
    for (const part of t.split(",")) {
      const m = part.trim().match(/^(\d+)\s*[-:=]\s*([A-Za-z0-9]+)$/);
      if (m) map[m[1]!] = m[2]!.toUpperCase();
    }
    return map;
  }
  return t;
}

function parseNumberedListFallback(body: string): QuestionDraft[] {
  const lines = body.split("\n");
  const questions: QuestionDraft[] = [];
  let current: { number: number; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    let correctAnswer: unknown;
    const stemLines: string[] = [];
    for (const line of current.lines) {
      const m = line.trim().match(ANSWER_LINE);
      if (m) correctAnswer = parseAnswerValue(m[1]!);
      else stemLines.push(line);
    }
    const options = parseOptions(
      stemLines.map((l) => l.trim()).filter(Boolean),
    );
    questions.push({
      number: current.number,
      order: questions.length,
      type: options.length ? "MULTIPLE_CHOICE" : "SHORT_ANSWER",
      content: {
        stem: stemLines
          .filter((l) => !/^([A-H]|[1-9])[).:\-]\s+/.test(l.trim()))
          .join("\n")
          .trim(),
        ...(options.length ? { options } : {}),
      },
      correctAnswer,
    });
    current = null;
  };

  for (const line of lines) {
    const m = line.trim().match(/^(\d{1,3})[).:\-]\s+(.*)$/);
    if (m) {
      flush();
      current = { number: Number(m[1]), lines: [m[2] ?? ""] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return questions;
}

export function parseWritingTaskAsQuestion(
  body: string,
  taskNumber: number,
): QuestionDraft {
  return {
    number: taskNumber,
    order: 0,
    type: "ESSAY",
    content: {
      stem: body.trim(),
      minWords: /task\s*1/i.test(body) || taskNumber === 1 ? 150 : 250,
    },
  };
}

export function parseSpeakingTopicAsQuestion(
  body: string,
  number: number,
): QuestionDraft {
  return {
    number,
    order: 0,
    type: "SPEAKING_PROMPT",
    content: {
      stem: body.trim(),
    },
  };
}
