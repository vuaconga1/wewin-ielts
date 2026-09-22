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

export function isAnswerCorrect(
  userAnswer: unknown,
  correctAnswer: unknown,
  acceptableAnswers?: string[],
): boolean {
  const user = normalizeForCompare(userAnswer);
  if (!user) return false;

  const candidates = new Set<string>();
  const add = (v: unknown) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      for (const x of v) add(x);
      return;
    }
    if (typeof v === "object") {
      // matching map { "1": "A", "2": "B" } — compare JSON loosely
      candidates.add(normalizeForCompare(JSON.stringify(v)));
      return;
    }
    const n = normalizeForCompare(v);
    for (const a of expandAliases(n)) candidates.add(a);
  };

  add(correctAnswer);
  if (acceptableAnswers) {
    for (const a of acceptableAnswers) add(a);
  }

  const userAliases = expandAliases(user);
  for (const u of userAliases) {
    if (candidates.has(u)) return true;
  }
  return false;
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
  const remaining = correctAnswers.map((c) => normalizeForCompare(c));
  return userAnswers.map((raw) => {
    const user = normalizeForCompare(raw);
    if (!user) return false;
    const idx = remaining.findIndex((c) => {
      if (!c) return false;
      const aliases = expandAliases(c);
      for (const u of expandAliases(user)) {
        if (aliases.has(u)) return true;
      }
      return false;
    });
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
