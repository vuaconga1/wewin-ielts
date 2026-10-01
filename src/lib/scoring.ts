/**
 * Simple answer comparison for Listening / Reading auto-grade.
 */

import {
  buildMultiSelectPairMap,
  type MultiSelectContent,
} from "@/lib/practice/multi-select";

export function normalizeForCompare(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'");
}

/** Map sheet abbreviations ↔ full forms */
const EQUIV: Record<string, string[]> = {
  true: ["true", "t", "yes", "y"],
  false: ["false", "f", "no", "n"],
  "not given": ["not given", "ng", "ngv", "n/g"],
  yes: ["yes", "y", "true", "t"],
  no: ["no", "n", "false", "f"],
};

function expandAliases(n: string): Set<string> {
  const set = new Set<string>([n]);
  for (const [canon, aliases] of Object.entries(EQUIV)) {
    if (n === canon || aliases.includes(n)) {
      set.add(canon);
      for (const a of aliases) set.add(a);
    }
  }
  return set;
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** `n/g` is a NOT GIVEN abbreviation, not two answers. */
function isNotGivenSlash(value: string): boolean {
  return value.trim().toLowerCase().replace(/\s+/g, "") === "n/g";
}

function isPureNumberToken(value: string): boolean {
  return /^\d+(?:[.,]\d+)?$/.test(value.trim());
}

/**
 * Split on `/` that is not inside parentheses.
 * `1/2` and `12/05/1990` stay one numeric token. `10/ten` still splits.
 */
function splitTopLevelSlashes(raw: string): string[] {
  const trimmed = collapseSpaces(raw);
  if (!trimmed || isNotGivenSlash(trimmed)) return trimmed ? [trimmed] : [];

  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of trimmed) {
    if (ch === "(" || ch === "（") depth += 1;
    else if ((ch === ")" || ch === "）") && depth > 0) depth -= 1;
    else if ((ch === "/" || ch === "／") && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);

  const cleaned = parts.map(collapseSpaces).filter(Boolean);
  if (cleaned.length < 2) return [trimmed];
  if (cleaned.every(isPureNumberToken)) return [trimmed];
  return cleaned;
}

type ParenGroup = {
  start: number;
  end: number;
  inner: string;
  /** No space before `(`, as in `word(other)`. */
  glued: boolean;
};

function parseParenGroups(input: string): ParenGroup[] {
  const groups: ParenGroup[] = [];
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    if (ch !== "(" && ch !== "（") continue;
    let depth = 1;
    let j = i + 1;
    for (; j < input.length && depth > 0; j += 1) {
      const c = input[j]!;
      if (c === "(" || c === "（") depth += 1;
      else if (c === ")" || c === "）") depth -= 1;
    }
    if (depth !== 0) break;
    groups.push({
      start: i,
      end: j,
      inner: input.slice(i + 1, j - 1),
      glued: i > 0 && !/\s/.test(input[i - 1]!),
    });
    i = j - 1;
  }
  return groups;
}

/**
 * Parentheses:
 * - `word(other)` (no space): `word` OR `other`. Concatenation is also
 *   accepted, but not required.
 * - `(the) royal antelope` / `20.25 (am)`: the bracketed word is optional.
 *   The phrase with and without it is correct; the optional word alone is not.
 * Empty groups are ignored. A slash inside a group is alternatives for that slot.
 */
function parenthesisForms(input: string): string[] {
  const groups = parseParenGroups(input);
  if (groups.length === 0) return [];

  const choicesPerGroup = groups.map((group) => {
    const alternatives = splitTopLevelSlashes(group.inner)
      .map(collapseSpaces)
      .filter(Boolean);
    return ["", ...alternatives];
  });

  const forms: string[] = [];
  const walk = (index: number, built: string, cursor: number) => {
    if (forms.length > 64) return;
    if (index === groups.length) {
      const collapsed = collapseSpaces(built + input.slice(cursor));
      if (collapsed) forms.push(collapsed);
      return;
    }
    const group = groups[index]!;
    const prefix = built + input.slice(cursor, group.start);
    for (const choice of choicesPerGroup[index]!) {
      walk(index + 1, prefix + choice, group.end);
    }
  };
  walk(0, "", 0);

  for (const group of groups) {
    if (!group.glued) continue;
    for (const alt of splitTopLevelSlashes(group.inner)) {
      const collapsed = collapseSpaces(alt);
      if (collapsed) forms.push(collapsed);
    }
  }
  return forms;
}

/**
 * Expand one official key into every string that should score as correct.
 * The original key is always included, so typing it exactly still matches.
 */
export function expandAnswerAlternatives(raw: string): string[] {
  const out = new Set<string>();
  const visit = (value: string) => {
    const trimmed = collapseSpaces(value);
    if (!trimmed || out.has(trimmed)) return;
    out.add(trimmed);

    const parts = splitTopLevelSlashes(trimmed);
    if (parts.length > 1) {
      for (const form of [parts.join("/"), parts.join(" / ")]) {
        const collapsed = collapseSpaces(form);
        if (collapsed) out.add(collapsed);
      }
      for (const part of parts) visit(part);
      return;
    }

    if (/[()（）]/.test(trimmed)) {
      for (const form of parenthesisForms(trimmed)) visit(form);
    }
  };

  visit(raw);
  return [...out];
}

function addNormalizedCandidates(value: unknown, candidates: Set<string>): void {
  if (value == null) return;
  if (Array.isArray(value)) {
    for (const item of value) addNormalizedCandidates(item, candidates);
    return;
  }
  if (typeof value === "object") {
    // matching map { "1": "A", "2": "B" } — compare JSON loosely
    candidates.add(normalizeForCompare(JSON.stringify(value)));
    return;
  }

  const text = typeof value === "string" ? value : String(value);
  const alternatives =
    typeof value === "string" ? expandAnswerAlternatives(text) : [text];
  for (const alt of alternatives) {
    const normalized = normalizeForCompare(alt);
    if (!normalized) continue;
    for (const alias of expandAliases(normalized)) candidates.add(alias);
  }
}

function userMatchesCandidates(
  userAnswer: unknown,
  candidates: Set<string>,
): boolean {
  const user = normalizeForCompare(userAnswer);
  if (!user) return false;
  for (const alias of expandAliases(user)) {
    if (candidates.has(alias)) return true;
  }
  return false;
}

export function isAnswerCorrect(
  userAnswer: unknown,
  correctAnswer: unknown,
  acceptableAnswers?: string[],
): boolean {
  const candidates = new Set<string>();
  addNormalizedCandidates(correctAnswer, candidates);
  if (acceptableAnswers) {
    for (const answer of acceptableAnswers) addNormalizedCandidates(answer, candidates);
  }
  return userMatchesCandidates(userAnswer, candidates);
}

export type AnswerStatus = "correct" | "wrong" | "skipped" | "no_key";

export type GradedQuestion = {
  questionNumber: number;
  sectionTitle: string;
  sectionOrder: number;
  type: string;
  stem: string;
  userAnswer: string;
  correctAnswer: unknown;
  isCorrect: boolean;
  status: AnswerStatus;
  explanation?: string;
  options?: { label: string; text: string }[];
};

export type GradeResult = {
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  percent: number;
  items: GradedQuestion[];
};

export function formatAnswerDisplay(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => formatAnswerDisplay(v)).join(", ");
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function isAutoGradable(type: string, correctAnswer: unknown): boolean {
  if (type === "ESSAY" || type === "SPEAKING_PROMPT") return false;
  return correctAnswer != null;
}

/**
 * Order-independent matching for Choose TWO/THREE letter groups.
 * Returns one boolean per user slot (same length as userAnswers).
 */
export function matchMultiSelectAnswers(
  userAnswers: unknown[],
  correctAnswers: unknown[],
): boolean[] {
  const remaining = correctAnswers.map((correct) => {
    const candidates = new Set<string>();
    addNormalizedCandidates(correct, candidates);
    return candidates;
  });
  return userAnswers.map((raw) => {
    const idx = remaining.findIndex((candidates) =>
      userMatchesCandidates(raw, candidates),
    );
    if (idx < 0) return false;
    remaining.splice(idx, 1);
    return true;
  });
}

function gradeOne(
  q: {
    number: number;
    type: string;
    content: Record<string, unknown>;
    correctAnswer?: unknown;
    acceptableAnswers?: string[];
    explanation?: string;
    sectionTitle: string;
    sectionOrder: number;
  },
  userAnswer: string,
  isCorrectOverride?: boolean,
): GradedQuestion {
  const stem = String((q.content as { stem?: string }).stem ?? "");
  const options = (q.content as { options?: { label: string; text: string }[] })
    .options;
  const auto = isAutoGradable(q.type, q.correctAnswer);
  const isCorrect =
    isCorrectOverride ??
    (auto
      ? isAnswerCorrect(userAnswer, q.correctAnswer, q.acceptableAnswers)
      : false);

  let status: AnswerStatus;
  if (!auto) {
    status = "no_key";
  } else if (!userAnswer.trim()) {
    status = "skipped";
  } else if (isCorrect) {
    status = "correct";
  } else {
    status = "wrong";
  }

  const explanation =
    typeof q.explanation === "string" && q.explanation.trim()
      ? q.explanation.trim()
      : undefined;

  return {
    questionNumber: q.number,
    sectionTitle: q.sectionTitle,
    sectionOrder: q.sectionOrder,
    type: q.type,
    stem,
    userAnswer,
    correctAnswer: q.correctAnswer,
    isCorrect,
    status,
    explanation,
    options,
  };
}

export function gradeAnswers(
  questions: {
    number: number;
    type: string;
    content: Record<string, unknown>;
    correctAnswer?: unknown;
    acceptableAnswers?: string[];
    explanation?: string;
    sectionTitle: string;
    sectionOrder: number;
  }[],
  answers: Record<string, string>,
): GradeResult {
  const byNumber = new Map(questions.map((q) => [q.number, q]));
  const pairs = buildMultiSelectPairMap(
    questions.map((q) => ({
      number: q.number,
      content: q.content as MultiSelectContent,
    })),
  );
  const handled = new Set<number>();
  const items: GradedQuestion[] = [];

  for (const q of questions) {
    if (handled.has(q.number)) continue;

    const covers = pairs.get(q.number);
    if (covers && covers.length >= 2) {
      const pairQs = covers
        .map((n) => byNumber.get(n))
        .filter((x): x is (typeof questions)[number] => Boolean(x));
      const leadOptions = (
        pairQs[0]?.content as { options?: { label: string; text: string }[] }
      )?.options;
      const userSlots = covers.map(
        (n) => answers[String(n)] ?? answers[`Q${n}`] ?? "",
      );
      const correctSlots = pairQs.map((pq) => pq.correctAnswer);
      const matchFlags = matchMultiSelectAnswers(userSlots, correctSlots);

      for (let i = 0; i < pairQs.length; i++) {
        const pq = pairQs[i]!;
        handled.add(pq.number);
        const contentWithOptions =
          leadOptions &&
          !(pq.content as { options?: unknown[] }).options?.length
            ? { ...pq.content, options: leadOptions }
            : pq.content;
        items.push(
          gradeOne(
            { ...pq, content: contentWithOptions },
            userSlots[i] ?? "",
            matchFlags[i],
          ),
        );
      }
      continue;
    }

    handled.add(q.number);
    const userAnswer =
      answers[String(q.number)] ?? answers[`Q${q.number}`] ?? "";
    items.push(gradeOne(q, userAnswer));
  }

  // Preserve original question order
  items.sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder) {
      return a.sectionOrder - b.sectionOrder;
    }
    return a.questionNumber - b.questionNumber;
  });

  const gradable = items.filter((i) => i.status !== "no_key");
  const correct = gradable.filter((i) => i.status === "correct").length;
  const wrong = gradable.filter((i) => i.status === "wrong").length;
  const skipped = gradable.filter((i) => i.status === "skipped").length;
  const total = gradable.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return { correct, wrong, skipped, total, percent, items };
}

/** Rough IELTS Listening/Reading band estimate (Academic) */
export function estimateBand(correct: number, total: number): number {
  if (total === 0) return 0;
  const scaled = Math.round((correct / total) * 40);
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 33) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 27) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 19) return 5.5;
  if (scaled >= 15) return 5.0;
  if (scaled >= 13) return 4.5;
  if (scaled >= 10) return 4.0;
  if (scaled >= 8) return 3.5;
  if (scaled >= 6) return 3.0;
  return 2.5;
}
