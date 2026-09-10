/**
 * Parse answer keys document.
 *
 * Supported formats:
 * 1. Line list:  "1. answer" / "Q1: answer"
 * 2. Spreadsheet paste (Google Sheets / Excel) — 2 blocks side by side:
 *      STT | Đáp án | STT | Đáp án
 *      1   | Bittens | 21  | A
 * 3. Word table via mammoth (cells often become one-per-line):
 *      STT / Đáp án / 1 / Bittens / 2 / group …
 * 4. Skill sections in one file: "Listening" / "Reading" headings
 */

export type KeysMap = Map<number, { answer: unknown; acceptable?: string[] }>;

const KEY_LINE =
  /^(?:Q(?:uestion)?\s*)?(\d+)\s*[:).\-]\s*(.+)$/i;

const HEADER_MARKERS = /^(stt|đáp án|dap an|answer|no\.?|#)$/i;

const SKILL_HEADING = /^(listening|reading|writing|speaking)\b/i;

export type KeysParseOptions = {
  /** READING: T/F/NGV → TRUE/FALSE/NOT GIVEN. LISTENING: giữ nguyên chữ cái A–G. */
  skill?: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
};

export function parseKeysDocument(
  text: string,
  options: KeysParseOptions = {},
): KeysMap {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return new Map();

  const scoped = scopeKeysBySkill(normalized, options.skill);

  const fromSpreadsheet = parseSpreadsheetKeys(scoped, options);
  if (fromSpreadsheet.size >= 5) return fromSpreadsheet;

  const fromTable = parseAlternatingTableKeys(scoped);
  if (fromTable.size >= 5) return fromTable;

  if (fromSpreadsheet.size > 0) return fromSpreadsheet;
  if (fromTable.size > 0) return fromTable;

  return parseLineKeys(scoped, options);
}

/** If keys file has Listening/Reading sections, keep only the matching skill block. */
function scopeKeysBySkill(text: string, skill?: KeysParseOptions["skill"]): string {
  if (!skill) return text;
  const lines = text.split("\n");
  const blocks: { skill: string; lines: string[] }[] = [];
  let current: { skill: string; lines: string[] } | null = null;
  for (const line of lines) {
    const t = line.trim();
    const m = t.match(SKILL_HEADING);
    // Allow "Listening REAL EXAM VOL 6 TEST 4" style headings
    if (m && t.length < 90 && !/^\d/.test(t.slice(m[0].length).trim())) {
      current = { skill: m[1]!.toUpperCase(), lines: [] };
      blocks.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }

  if (blocks.length === 0) return text;
  const match = blocks.find((b) => b.skill === skill);
  if (match) return match.lines.join("\n");
  // No matching section — return full text (don't lose keys)
  return text;
}

function parseLineKeys(text: string, options: KeysParseOptions): KeysMap {
  const map: KeysMap = new Map();
  const lines = text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (SKILL_HEADING.test(line) && line.length < 40) continue;

    const m = line.match(KEY_LINE);
    if (!m) continue;

    const number = Number(m[1]);
    let answerRaw = m[2]!.trim();
    let acceptable: string[] | undefined;

    if (answerRaw.includes("|")) {
      const parts = answerRaw.split("|").map((s) => s.trim()).filter(Boolean);
      answerRaw = parts[0]!;
      if (parts.length > 1) acceptable = parts.slice(1);
    }

    map.set(number, {
      answer: normalizeAnswerToken(answerRaw, options.skill),
      acceptable,
    });
  }

  return map;
}

/**
 * Parse tab/comma-separated rows copied from spreadsheet.
 * Expects optional header row with STT + Đáp án (possibly duplicated for cols 3-4).
 */
function parseSpreadsheetKeys(text: string, options: KeysParseOptions): KeysMap {
  const map: KeysMap = new Map();
  const lines = text.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (/^test\s+\d+/i.test(line) && !line.includes("\t") && !line.includes(",")) {
      continue;
    }
    if (SKILL_HEADING.test(line) && line.length < 40) continue;

    const cells = splitCells(line);
    if (cells.length < 2) continue;

    if (cells.every((c) => HEADER_MARKERS.test(c) || c === "")) continue;
    if (HEADER_MARKERS.test(cells[0]!)) continue;

    if (cells.length >= 4) {
      const leftNum = parseIntCell(cells[0]!);
      const leftAns = cells[1]?.trim();
      const rightNum = parseIntCell(cells[2]!);
      const rightAns = cells[3]?.trim();

      if (leftNum != null && leftAns) {
        map.set(leftNum, {
          answer: normalizeAnswerToken(leftAns, options.skill),
        });
      }
      if (rightNum != null && rightAns) {
        map.set(rightNum, {
          answer: normalizeAnswerToken(rightAns, options.skill),
        });
      }
      continue;
    }

    const num = parseIntCell(cells[0]!);
    const ans = cells[1]?.trim();
    if (num != null && ans) {
      map.set(num, { answer: normalizeAnswerToken(ans, options.skill) });
    }
  }

  return map;
}

/**
 * Mammoth often flattens Word tables to one cell per line:
 *   STT
 *   Đáp án
 *   1
 *   Bittens
 *   2
 *   group
 * Or 4-column: 1 / ans / 21 / ans repeating.
 */
function parseAlternatingTableKeys(text: string): KeysMap {
  const map: KeysMap = new Map();
  const tokens = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !HEADER_MARKERS.test(l))
    .filter((l) => !(SKILL_HEADING.test(l) && l.length < 40))
    .filter((l) => !/^test\s+\d+$/i.test(l));

  // Pattern: number, answer, number, answer…
  let i = 0;
  while (i < tokens.length - 1) {
    const num = parseIntCell(tokens[i]!);
    if (num == null) {
      i += 1;
      continue;
    }
    const ans = tokens[i + 1]!;
    // Next token should not also be a lone number in sequence abuse —
    // allow answers that are numbers (e.g. "23", "12.50")
    if (HEADER_MARKERS.test(ans)) {
      i += 1;
      continue;
    }
    // Skip if this looks like "1 2 3" consecutive numbers without answers
    const nextNum = parseIntCell(ans);
    const following = tokens[i + 2];
    if (
      nextNum != null &&
      following != null &&
      parseIntCell(following) != null &&
      Math.abs(nextNum - num) === 1
    ) {
      i += 1;
      continue;
    }

    map.set(num, { answer: normalizeAnswerToken(ans) });
    i += 2;
  }

  return map;
}

function splitCells(line: string): string[] {
  if (line.includes("\t")) {
    return line.split("\t").map((c) => c.trim());
  }
  if (line.includes(",")) {
    const parts = line.split(",").map((c) => c.trim());
    if (parts.length >= 4 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[2]!)) {
      return parts;
    }
    if (parts.length === 2 && /^\d+$/.test(parts[0]!)) {
      return parts;
    }
  }
  const spaced = line.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);
  if (spaced.length >= 4 && /^\d+$/.test(spaced[0]!) && /^\d+$/.test(spaced[2]!)) {
    return spaced;
  }
  if (spaced.length === 2 && /^\d+$/.test(spaced[0]!)) {
    return spaced;
  }
  // Word table row sometimes: "1 Bittens" (single space)
  const single = line.match(/^(\d{1,2})\s+(.+)$/);
  if (single && !/^\d+\s+\d+/.test(line)) {
    return [single[1]!, single[2]!];
  }
  return [line];
}

function parseIntCell(cell: string): number | null {
  const n = Number(cell.trim());
  return Number.isInteger(n) && n >= 1 && n <= 60 ? n : null;
}

/** Normalize abbreviations; giữ nguyên chữ cái A–Z (matching). Chỉ chuẩn hóa NGV. */
export function normalizeAnswerToken(
  raw: string,
  skill?: KeysParseOptions["skill"],
): string {
  void skill;
  const t = raw.trim();
  const upper = t.toUpperCase();

  if (upper === "NGV" || upper === "NG" || upper === "N/G") return "NOT GIVEN";
  if (upper === "YES") return "YES";
  if (upper === "NO") return "NO";

  // T/F giữ nguyên — engine chấm sẽ map TRUE↔T, FALSE↔F khi cần
  return t;
}

export function mergeKeysIntoQuestions<
  T extends {
    number: number;
    correctAnswer?: unknown;
    acceptableAnswers?: string[];
  },
>(questions: T[], keys: KeysMap): T[] {
  return questions.map((q) => {
    if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
      return q;
    }
    const fromKeys = keys.get(q.number);
    if (!fromKeys) return q;
    return {
      ...q,
      correctAnswer: fromKeys.answer,
      acceptableAnswers: q.acceptableAnswers ?? fromKeys.acceptable,
    };
  });
}
