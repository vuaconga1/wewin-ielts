/**
 * Listen & answer: short open questions about the audio, graded by deterministic rules
 * against teacher-declared answers (no AI, no fuzzy matching).
 * Client-safe (no server imports) so the admin editor can preview grading live.
 */

import { normalizeAnswer } from "@/lib/dictation/fill-blank";
import type {
  ListenAnswerGrade,
  ListenQuestion,
  ListenQuestionMatch,
  ListenQuestionResult,
  PublicListenQuestion,
} from "@/lib/dictation/types";

export const MAX_QUESTIONS = 50;
export const MAX_PROMPT_CHARS = 500;
export const MAX_QA_ANSWER_CHARS = 200;
export const MAX_WORDS_LIMIT = 50;
const MAX_VARIANTS = 20;
const QUESTION_ID = /^[A-Za-z0-9_-]{1,32}$/;

/** After normalizeAnswer apostrophes are gone, so "didn't" is matched as "didnt". */
const NEGATIONS = new Set([
  "not",
  "no",
  "never",
  "nobody",
  "neither",
  "nor",
  "cannot",
  "dont",
  "doesnt",
  "didnt",
  "isnt",
  "arent",
  "wasnt",
  "werent",
  "cant",
  "couldnt",
  "wont",
  "wouldnt",
  "hasnt",
  "havent",
  "hadnt",
  "shouldnt",
]);

export class ListenAnswerConfigError extends Error {
  code: "NO_QUESTIONS" | "INVALID_QUESTIONS";
  constructor(code: "NO_QUESTIONS" | "INVALID_QUESTIONS", message: string) {
    super(message);
    this.code = code;
  }
}

export function countWords(text: string): number {
  const norm = normalizeAnswer(text);
  return norm ? norm.split(" ").length : 0;
}

/** Whole-word containment on normalised text: "in the library" is inside "anna is in the library". */
function containsPhrase(haystack: string, phrase: string): boolean {
  return phrase.length > 0 && ` ${haystack} `.includes(` ${phrase} `);
}

function hasNegation(norm: string): boolean {
  return norm.split(" ").some((w) => NEGATIONS.has(w));
}

function cleanVariants(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const text = item.trim().slice(0, MAX_QA_ANSWER_CHARS);
    const key = normalizeAnswer(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= MAX_VARIANTS) break;
  }
  return out;
}

function parseMatch(raw: unknown): ListenQuestionMatch {
  return raw === "EXACT" ? "EXACT" : "KEYWORD";
}

function parseMaxWords(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_WORDS_LIMIT) {
    throw new ListenAnswerConfigError("INVALID_QUESTIONS", "Word limit must be a whole number from 1 to 50");
  }
  return n;
}

/** Strict validation for admin input. Keeps the given order. */
export function validateQuestions(raw: unknown): ListenQuestion[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ListenAnswerConfigError("NO_QUESTIONS", "Exercise needs at least one question");
  }
  if (raw.length > MAX_QUESTIONS) {
    throw new ListenAnswerConfigError("INVALID_QUESTIONS", `At most ${MAX_QUESTIONS} questions`);
  }
  const ids = new Set<string>();
  return raw.map((item): ListenQuestion => {
    const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const id = typeof q.id === "string" ? q.id.trim() : "";
    if (!QUESTION_ID.test(id) || ids.has(id)) {
      throw new ListenAnswerConfigError("INVALID_QUESTIONS", "Question ids must be unique");
    }
    ids.add(id);
    const prompt = typeof q.prompt === "string" ? q.prompt.trim().slice(0, MAX_PROMPT_CHARS) : "";
    if (!prompt) throw new ListenAnswerConfigError("INVALID_QUESTIONS", "Question text is empty");
    const answers = cleanVariants(q.answers);
    if (answers.length === 0) {
      throw new ListenAnswerConfigError("INVALID_QUESTIONS", "Each question needs an accepted answer");
    }
    const match = parseMatch(q.match);
    const rejectAnswers = cleanVariants(q.rejectAnswers);
    const accepted = answers.map(normalizeAnswer);
    const clash = rejectAnswers.some((r) => {
      const key = normalizeAnswer(r);
      return accepted.some((a) => containsPhrase(a, key));
    });
    if (clash) {
      throw new ListenAnswerConfigError("INVALID_QUESTIONS", "A wrong option overlaps an accepted answer");
    }
    const maxWords = parseMaxWords(q.maxWords);
    const out: ListenQuestion = { id, prompt, answers, match };
    if (rejectAnswers.length) out.rejectAnswers = rejectAnswers;
    if (maxWords != null) out.maxWords = maxWords;
    return out;
  });
}

/** Lenient read of stored questions: drops anything that no longer validates. */
export function readQuestions(raw: unknown): ListenQuestion[] {
  if (!Array.isArray(raw)) return [];
  const kept: unknown[] = [];
  for (const item of raw) {
    try {
      validateQuestions([...kept, item]);
      kept.push(item);
    } catch {
      /* skip invalid question */
    }
  }
  return kept.length ? validateQuestions(kept) : [];
}

export function toPublicQuestions(questions: ListenQuestion[]): PublicListenQuestion[] {
  return questions.map((q, index) => ({
    id: q.id,
    index,
    prompt: q.prompt,
    maxWords: q.maxWords ?? null,
  }));
}

export function gradeQuestion(question: ListenQuestion, rawAnswer: string): ListenQuestionResult {
  const submitted = String(rawAnswer ?? "").slice(0, MAX_QA_ANSWER_CHARS).trim();
  const base = {
    questionId: question.id,
    prompt: question.prompt,
    submitted,
    expected: question.answers[0],
  };
  const actual = normalizeAnswer(submitted);
  if (!actual) return { ...base, status: "blank" };
  if (question.maxWords != null && actual.split(" ").length > question.maxWords) {
    return { ...base, status: "incorrect", reason: "TOO_MANY_WORDS" };
  }
  const accepted = question.answers.map(normalizeAnswer);
  if (question.match === "EXACT") {
    return { ...base, status: accepted.includes(actual) ? "correct" : "incorrect" };
  }
  const hit = accepted.find((a) => containsPhrase(actual, a));
  if (!hit) return { ...base, status: "incorrect" };
  if ((question.rejectAnswers ?? []).some((r) => containsPhrase(actual, normalizeAnswer(r)))) {
    return { ...base, status: "incorrect", reason: "WRONG_OPTION" };
  }
  if (hasNegation(actual) && !hasNegation(hit)) {
    return { ...base, status: "incorrect", reason: "NEGATED" };
  }
  return { ...base, status: "correct" };
}

export function gradeListenAnswer(
  questions: ListenQuestion[],
  answers: Record<string, string>,
): ListenAnswerGrade {
  if (questions.length === 0) throw new Error("NO_QUESTIONS");
  const questionResults = questions.map((q) => gradeQuestion(q, answers[q.id] ?? ""));
  const correctCount = questionResults.filter((r) => r.status === "correct").length;
  return {
    score: Math.round((correctCount / questions.length) * 100),
    correctCount,
    totalQuestions: questions.length,
    questionResults,
  };
}

function strings(...candidates: unknown[]): string[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c.filter((x): x is string => typeof x === "string");
    if (typeof c === "string" && c.trim()) return [c];
  }
  return [];
}

/**
 * Reads questions pasted as JSON (e.g. produced together with the content by an AI tool):
 * an array, or { questions: [...] }, of { question|prompt, correctAnswers|answers,
 * rejectAnswers?|wrongAnswers?, match?: "KEYWORD"|"EXACT", maxWords? }.
 * New ids are allocated from `nextId`; the result is fully validated.
 */
export function parseQuestionsJson(text: string, nextId: (offset: number) => string): ListenQuestion[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ListenAnswerConfigError("INVALID_QUESTIONS", "Invalid JSON");
  }
  const list =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).questions
      : parsed;
  if (!Array.isArray(list) || list.length === 0) {
    throw new ListenAnswerConfigError("NO_QUESTIONS", "No questions found");
  }
  return validateQuestions(
    list.map((item, i) => {
      const q = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const matchRaw = String(q.match ?? q.matchMode ?? "").toUpperCase();
      return {
        id: nextId(i),
        prompt: q.prompt ?? q.question,
        answers: strings(q.answers, q.correctAnswers, q.acceptedAnswers, q.answer),
        rejectAnswers: strings(q.rejectAnswers, q.wrongAnswers),
        match: matchRaw === "EXACT" ? "EXACT" : "KEYWORD",
        maxWords: q.maxWords,
      };
    }),
  );
}
