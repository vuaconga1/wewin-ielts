/**
 * L/R CDI layout helpers:
 * - Reading: left = passage; right = question groups
 * - Listening: interactive notes groups (bold Questions headers + inline blanks)
 */

export type ReadingQuestionGroup = {
  /** e.g. "Questions 1-6 TRUE / FALSE / NOT GIVEN" */
  header: string;
  /** Short instruction lines under the header (no statement dumps) */
  instructions: string[];
  /**
   * Notes / summary / table / form text that contains numbered blanks.
   * Only shown when gap questions use empty stems.
   */
  notes: string;
  start: number;
  end: number;
};

/** Alias — same structure used for Listening sections. */
export type PracticeQuestionGroup = ReadingQuestionGroup;

export function splitReadingPassageAndTasks(content: string): {
  passage: string;
  tasks: string;
} {
  const idx = content.search(/\nQuestions?\s+\d+/i);
  if (idx > 80) {
    return {
      passage: content.slice(0, idx).trim(),
      tasks: content.slice(idx).trim(),
    };
  }
  return { passage: content.trim(), tasks: "" };
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
  if (/^(NB|Note)\b/i.test(t)) return true;
  if (
    /^(Do the following|In boxes|Write |Choose |Complete |Match |Look at|Reading Passage|Which paragraph|Which section|Which types|TRUE\s*\/\s*FALSE|YES\s*\/\s*NO)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /true\s+if|false\s+if|yes\s+if|no\s+if|not\s+given|agrees with the|no more than|one word only|one word and\/or|list of (points|headings|words)|types of products/i.test(
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
    BLANK_MARK_RE.test(line) &&
    /(?:^|[^\d])\d{1,2}\s*(?:[$€£]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/u.test(
      line,
    )
  );
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
  for (const q of questions) {
    const stem = normalizeForCompare(q.content.stem ?? "");
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

    for (const raw of current.body) {
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
      if (isDuplicateStemLine(t, stemByNumber)) continue;
      // Option / bank lines — shown on each MCQ/matching question instead
      if (/^[A-K][.)]\s+/.test(t)) continue;
      noteLines.push(raw);
    }

    const rangeQs = questions.filter(
      (q) => q.number >= current!.start && q.number <= current!.end,
    );
    const needsNotes = rangeQs.some((q) => {
      const stem = (q.content.stem ?? "").trim();
      const isGap =
        q.type === "GAP_FILL" ||
        q.type === "TABLE_COMPLETION" ||
        q.type === "MAP_LABELING" ||
        Boolean(q.content.blank);
      return isGap && stem.length < 8;
    });

    // Listening forms: keep notes whenever this range has inline blanks,
    // even if some questions are missing from the draft.
    const hasBlanksInBody = noteLines.some((l) => lineHasInlineBlank(l));

    const notes =
      needsNotes || hasBlanksInBody
        ? noteLines
            .join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
        : "";

    // Only surface notes that contain numbered blanks (forms / summaries).
    // Never dump MCQ / matching stems as a static notes block.
    const usableNotes =
      notes && (lineHasInlineBlank(notes) || /_{2,}|_____/.test(notes))
        ? notes
        : "";

    groups.push({
      header: current.header,
      instructions,
      notes: usableNotes,
      start: current.start,
      end: current.end,
    });
    current = null;
  };

  for (const line of lines) {
    const hit = matchQuestionGroupHeader(line);
    if (hit) {
      flush();
      current = {
        header: hit.header,
        start: hit.start,
        end: hit.end,
        body: [],
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
