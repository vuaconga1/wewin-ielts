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

/** Drop spend-time / "Questions N–M based on Passage" chrome from left passage. */
function stripPassageChrome(passage: string): string {
  return passage
    .replace(/\r\n/g, "\n")
    .replace(
      /^(\s*You should spend about \d+ minutes on[^\n]*\n*)+/i,
      "",
    )
    .replace(
      /^(\s*Questions?\s+\d+\s*[-–—]\s*\d+\s+which are based on (?:Reading\s+)?Passage[^\n]*\n*)+/i,
      "",
    )
    .replace(
      /^(\s*Questions?\s+\d+(?:\s*[-–—]\s*\d+)?\s+which are based on (?:Reading\s+)?Passage[^\n]*\n*)+/i,
      "",
    )
    .replace(/^\n+/, "")
    .trim();
}

export function splitReadingPassageAndTasks(content: string): {
  passage: string;
  tasks: string;
} {
  const normalized = content.replace(/\r\n/g, "\n");
  // Find the first real task header — skip spend-time blurbs like
  // "Questions 1-13 which are based on Reading Passage 1 below."
  const re = /\nQuestions?\s+(\d+)(?:\s*[-–—]\s*(\d+)|\s+and\s+(\d+))?\b([^\n]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized)) !== null) {
    const rest = (m[4] ?? "").trim();
    if (/based on (Reading\s+)?Passage/i.test(rest)) continue;
    const idx = m.index;
    if (idx > 40) {
      return {
        passage: stripPassageChrome(normalized.slice(0, idx)),
        tasks: normalized.slice(idx).trim(),
      };
    }
  }
  return { passage: stripPassageChrome(normalized), tasks: "" };
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
