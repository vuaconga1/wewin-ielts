import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { mediaUrl } from "@/lib/media/url";
import { gradeDictation, parseDictationSettings, tokenize } from "@/lib/dictation/scoring";
import {
  buildPublicSegments,
  buildResultSegments,
  FillBlankConfigError,
  gradeFillBlank,
  MAX_ANSWER_CHARS,
  readGaps,
  validateGaps,
} from "@/lib/dictation/fill-blank";
import {
  gradeListenAnswer,
  ListenAnswerConfigError,
  MAX_QA_ANSWER_CHARS,
  readQuestions,
  toPublicQuestions,
  validateQuestions,
} from "@/lib/dictation/listen-answer";
import {
  getDictationRepo,
  type DictationRepo,
  type DictationStatus,
  type ExerciseData,
  type ExerciseListRow,
} from "@/lib/dictation/repo";
import type {
  DictationAttemptReview,
  DictationCatalogItem,
  DictationHistoryItem,
  DictationMode,
  DictationSettings,
  DictationSubmitResult,
  FillBlankGap,
  FillBlankSubmitResult,
  ListenAnswerSubmitResult,
  ListenQuestion,
  PublicDictationExercise,
} from "@/lib/dictation/types";

const CATALOG_TAG = "dictation-catalog";
const MAX_SUBMIT_CHARS = 10_000;
const MAX_LISTEN_COUNT = 10_000;
const HISTORY_LIMIT = 30;

export class DictationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function requireRepo(): Promise<DictationRepo> {
  const repo = await getDictationRepo();
  if (!repo) throw new DictationError("DB_UNAVAILABLE", "Database unavailable");
  return repo;
}

export function invalidateDictationCatalog(slug?: string) {
  try {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/learn/dictation");
    revalidatePath("/learn/fill-blank");
    revalidatePath("/learn/listen-answer");
    if (slug) {
      revalidatePath(`/learn/dictation/${slug}`);
      revalidatePath(`/learn/fill-blank/${slug}`);
      revalidatePath(`/learn/listen-answer/${slug}`);
    }
  } catch {
    /* outside request scope */
  }
}

export const listPublishedDictations = unstable_cache(
  async (mode: DictationMode): Promise<DictationCatalogItem[]> => {
    const repo = await getDictationRepo();
    if (!repo) return [];
    const rows = await repo.listExercises(true);
    return rows
      .filter((r) => r.mode === mode)
      .map(({ id, slug, title, level, mode }) => ({ id, slug, title, level, mode }));
  },
  ["dictation-catalog-v3"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

/**
 * Cached public row: the transcript is reduced to gap segments (or dropped for questions)
 * and answers never leave the server.
 */
const getPublishedDictationRow = unstable_cache(
  async (slug: string) => {
    const repo = await getDictationRepo();
    if (!repo) return null;
    const row = await repo.findExercise({ slug });
    if (!row || row.status !== "PUBLISHED") return null;
    const fillBlank = row.mode === "FILL_BLANK";
    const gaps = fillBlank ? readGaps(row.gaps, row.transcript) : [];
    if (fillBlank && gaps.length === 0) return null;
    const qa = row.mode === "QUESTION_ANSWER";
    const questions = qa ? readQuestions(row.questions) : [];
    if (qa && questions.length === 0) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      level: row.level,
      instructions: row.instructions,
      audioUrl: row.audioUrl,
      settings: row.settings ?? null,
      mode: row.mode,
      segments: fillBlank ? buildPublicSegments(row.transcript, gaps) : null,
      questions: qa ? toPublicQuestions(questions) : null,
    };
  },
  ["dictation-exercise-v3"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

export async function getPublicDictation(
  slug: string,
): Promise<PublicDictationExercise | null> {
  const row = await getPublishedDictationRow(slug);
  if (!row) return null;
  return {
    ...row,
    audioUrl: mediaUrl(row.audioUrl),
    settings: parseDictationSettings(row.settings),
  };
}

export async function startDictationAttempt(input: {
  slug: string;
  userId: string | null;
}): Promise<{ attemptId: string; startedAt: string }> {
  const repo = await requireRepo();
  const exercise = await repo.findExercise({ slug: input.slug });
  if (!exercise || exercise.status !== "PUBLISHED") {
    throw new DictationError("NOT_FOUND", "Exercise not found");
  }
  const attempt = await repo.createAttempt(exercise.id, input.userId);
  return { attemptId: attempt.id, startedAt: attempt.startedAt.toISOString() };
}

/** Keeps only known gap / question ids with string answers, each capped in length. */
function sanitizeAnswers(
  raw: unknown,
  items: { id: string }[],
  maxChars: number,
): Record<string, string> {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const item of items) {
    const value = obj[item.id];
    out[item.id] = typeof value === "string" ? value.slice(0, maxChars) : "";
  }
  return out;
}

export async function submitDictationAttempt(input: {
  attemptId: string;
  userId: string | null;
  /** FULL_TEXT payload */
  text?: unknown;
  /** FILL_BLANK / QUESTION_ANSWER payload: { [gapId | questionId]: answer } */
  answers?: unknown;
  listenCount: number;
}): Promise<DictationSubmitResult | FillBlankSubmitResult | ListenAnswerSubmitResult> {
  const repo = await requireRepo();
  const attempt = await repo.findAttempt(input.attemptId);
  if (!attempt) throw new DictationError("NOT_FOUND", "Attempt not found");
  if (attempt.userId && attempt.userId !== input.userId) {
    throw new DictationError("FORBIDDEN", "Attempt belongs to another user");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new DictationError("ALREADY_SUBMITTED", "Attempt already submitted");
  }
  const exercise = await repo.findExercise({ id: attempt.exerciseId });
  if (!exercise) throw new DictationError("NOT_FOUND", "Exercise not found");

  const settings = parseDictationSettings(exercise.settings);
  let listenCount = Math.max(0, Math.min(MAX_LISTEN_COUNT, Math.floor(input.listenCount) || 0));
  if (settings.maxListenCount != null) {
    listenCount = Math.min(listenCount, settings.maxListenCount);
  }
  const completedAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((completedAt.getTime() - attempt.startedAt.getTime()) / 1000),
  );

  if (exercise.mode === "FILL_BLANK") {
    if (!input.answers || typeof input.answers !== "object") {
      throw new DictationError("INVALID_BODY", "Missing answers");
    }
    const gaps = readGaps(exercise.gaps, exercise.transcript);
    if (gaps.length === 0) throw new DictationError("NOT_FOUND", "Exercise has no gaps");
    const answers = sanitizeAnswers(input.answers, gaps, MAX_ANSWER_CHARS);
    const grade = gradeFillBlank(exercise.transcript, gaps, answers);
    const ok = await repo.completeAttempt(attempt.id, {
      submittedText: "",
      normalizedText: "",
      score: grade.score,
      correctCount: grade.correctCount,
      totalWords: grade.totalGaps,
      listenCount,
      completedAt,
      durationSeconds,
      wordResults: [],
      errorSummary: { missing: [], incorrect: [], extra: [] },
      submittedAnswers: answers,
      gapResults: grade.gapResults,
      questionResults: null,
    });
    if (!ok) throw new DictationError("ALREADY_SUBMITTED", "Attempt already submitted");
    return {
      ...grade,
      mode: "FILL_BLANK",
      attemptId: attempt.id,
      listenCount,
      durationSeconds,
      transcript: exercise.transcript,
      segments: buildResultSegments(exercise.transcript, gaps, grade.gapResults),
    };
  }

  if (exercise.mode === "QUESTION_ANSWER") {
    if (!input.answers || typeof input.answers !== "object") {
      throw new DictationError("INVALID_BODY", "Missing answers");
    }
    const questions = readQuestions(exercise.questions);
    if (questions.length === 0) throw new DictationError("NOT_FOUND", "Exercise has no questions");
    const answers = sanitizeAnswers(input.answers, questions, MAX_QA_ANSWER_CHARS);
    const grade = gradeListenAnswer(questions, answers);
    const ok = await repo.completeAttempt(attempt.id, {
      submittedText: "",
      normalizedText: "",
      score: grade.score,
      correctCount: grade.correctCount,
      totalWords: grade.totalQuestions,
      listenCount,
      completedAt,
      durationSeconds,
      wordResults: [],
      errorSummary: { missing: [], incorrect: [], extra: [] },
      submittedAnswers: answers,
      gapResults: null,
      questionResults: grade.questionResults,
    });
    if (!ok) throw new DictationError("ALREADY_SUBMITTED", "Attempt already submitted");
    return {
      ...grade,
      mode: "QUESTION_ANSWER",
      attemptId: attempt.id,
      listenCount,
      durationSeconds,
      transcript: exercise.transcript,
    };
  }

  if (typeof input.text !== "string") {
    throw new DictationError("INVALID_BODY", "Missing text");
  }
  const text = input.text.slice(0, MAX_SUBMIT_CHARS);
  const grade = gradeDictation(exercise.transcript, text);
  const ok = await repo.completeAttempt(attempt.id, {
    submittedText: text,
    normalizedText: grade.normalizedText,
    score: grade.score,
    correctCount: grade.correctCount,
    totalWords: grade.totalWords,
    listenCount,
    completedAt,
    durationSeconds,
    wordResults: grade.wordResults,
    errorSummary: grade.errorSummary,
    submittedAnswers: null,
    gapResults: null,
    questionResults: null,
  });
  if (!ok) throw new DictationError("ALREADY_SUBMITTED", "Attempt already submitted");

  return {
    ...grade,
    mode: "FULL_TEXT",
    attemptId: attempt.id,
    listenCount,
    durationSeconds,
    transcript: exercise.transcript,
  };
}

/** Drops an unsubmitted attempt when the learner leaves the page mid-session. */
export async function abandonDictationAttempt(input: {
  attemptId: string;
  userId: string | null;
}): Promise<void> {
  const repo = await requireRepo();
  const attempt = await repo.findAttempt(input.attemptId);
  if (!attempt || attempt.status !== "IN_PROGRESS") return;
  if (attempt.userId && attempt.userId !== input.userId) {
    throw new DictationError("FORBIDDEN", "Attempt belongs to another user");
  }
  await repo.deleteInProgressAttempt(attempt.id);
}

export async function listDictationHistory(input: {
  slug: string;
  userId: string;
}): Promise<DictationHistoryItem[]> {
  const repo = await requireRepo();
  const exercise = await repo.findExercise({ slug: input.slug });
  if (!exercise) throw new DictationError("NOT_FOUND", "Exercise not found");
  const rows = await repo.listCompletedAttempts(input.userId, exercise.id, HISTORY_LIMIT);
  return rows.map((r) => ({
    attemptId: r.id,
    score: r.score,
    correctCount: r.correctCount,
    totalWords: r.totalWords,
    durationSeconds: r.durationSeconds,
    completedAt: r.completedAt.toISOString(),
  }));
}

export async function getDictationAttemptReview(input: {
  attemptId: string;
  userId: string | null;
}): Promise<DictationAttemptReview> {
  const repo = await requireRepo();
  const attempt = await repo.findCompletedAttempt(input.attemptId);
  if (!attempt) throw new DictationError("NOT_FOUND", "Attempt not found");
  if (attempt.userId && attempt.userId !== input.userId) {
    throw new DictationError("FORBIDDEN", "Attempt belongs to another user");
  }
  const exercise = await repo.findExercise({ id: attempt.exerciseId });
  if (!exercise) throw new DictationError("NOT_FOUND", "Exercise not found");
  if (attempt.questionResults) {
    return {
      mode: "QUESTION_ANSWER",
      attemptId: attempt.id,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalWords,
      questionResults: attempt.questionResults,
      listenCount: attempt.listenCount,
      durationSeconds: attempt.durationSeconds,
      transcript: exercise.transcript,
      completedAt: attempt.completedAt.toISOString(),
    };
  }
  if (attempt.gapResults) {
    const gaps = exercise.mode === "FILL_BLANK" ? readGaps(exercise.gaps, exercise.transcript) : [];
    return {
      mode: "FILL_BLANK",
      attemptId: attempt.id,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalGaps: attempt.totalWords,
      gapResults: attempt.gapResults,
      listenCount: attempt.listenCount,
      durationSeconds: attempt.durationSeconds,
      transcript: exercise.transcript,
      segments: buildResultSegments(exercise.transcript, gaps, attempt.gapResults),
      completedAt: attempt.completedAt.toISOString(),
    };
  }
  return {
    mode: "FULL_TEXT",
    attemptId: attempt.id,
    score: attempt.score,
    correctCount: attempt.correctCount,
    totalWords: attempt.totalWords,
    normalizedText: attempt.normalizedText,
    wordResults: attempt.wordResults,
    errorSummary: attempt.errorSummary,
    listenCount: attempt.listenCount,
    durationSeconds: attempt.durationSeconds,
    transcript: exercise.transcript,
    submittedText: attempt.submittedText,
    completedAt: attempt.completedAt.toISOString(),
  };
}

// ---------- Admin ----------

export type DictationAdminRow = ExerciseListRow;

export type DictationAdminDetail = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  transcript: string;
  mode: DictationMode;
  gaps: FillBlankGap[];
  questions: ListenQuestion[];
  settings: DictationSettings;
  status: DictationStatus;
  order: number;
};

export type DictationInput = {
  title: string;
  level?: string | null;
  instructions?: string | null;
  audioUrl: string;
  transcript: string;
  mode?: string;
  gaps?: unknown;
  questions?: unknown;
  settings?: unknown;
  status?: string;
  order?: number;
};

export async function listDictationsForAdmin(mode?: DictationMode): Promise<DictationAdminRow[]> {
  const repo = await getDictationRepo();
  const rows = repo ? await repo.listExercises(false) : [];
  return mode ? rows.filter((r) => r.mode === mode) : rows;
}

export async function getDictationForAdmin(id: string): Promise<DictationAdminDetail | null> {
  const repo = await getDictationRepo();
  const row = repo ? await repo.findExercise({ id }) : null;
  return row
    ? {
        ...row,
        gaps: readGaps(row.gaps, row.transcript),
        questions: readQuestions(row.questions),
        settings: parseDictationSettings(row.settings),
      }
    : null;
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function uniqueSlug(repo: DictationRepo, title: string): Promise<string> {
  const base = slugify(title) || "dictation";
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await repo.slugTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function normalizeInput(input: DictationInput): ExerciseData {
  const title = String(input.title ?? "").trim();
  const audioUrl = String(input.audioUrl ?? "").trim();
  const transcript = String(input.transcript ?? "").trim();
  if (!title) throw new DictationError("INVALID_TITLE", "Missing title");
  if (!audioUrl) throw new DictationError("INVALID_AUDIO", "Missing audio");
  if (tokenize(transcript).length === 0) {
    throw new DictationError("EMPTY_TRANSCRIPT", "Transcript is empty");
  }
  const mode: DictationMode =
    input.mode === "FILL_BLANK" || input.mode === "QUESTION_ANSWER" ? input.mode : "FULL_TEXT";
  let gaps: FillBlankGap[] | null = null;
  let questions: ListenQuestion[] | null = null;
  try {
    if (mode === "FILL_BLANK") gaps = validateGaps(input.gaps, transcript);
    if (mode === "QUESTION_ANSWER") questions = validateQuestions(input.questions);
  } catch (err) {
    if (err instanceof FillBlankConfigError || err instanceof ListenAnswerConfigError) {
      throw new DictationError(err.code, err.message);
    }
    throw err;
  }
  const status: DictationStatus =
    input.status === "DRAFT" || input.status === "ARCHIVED" ? input.status : "PUBLISHED";
  const order = Number(input.order);
  return {
    title,
    level: String(input.level ?? "").trim() || null,
    instructions: String(input.instructions ?? "").trim() || null,
    audioUrl,
    transcript,
    mode,
    gaps,
    questions,
    settings: parseDictationSettings(input.settings),
    status,
    order: Number.isFinite(order) ? Math.max(0, Math.floor(order)) : 0,
  };
}

export async function createDictation(input: DictationInput): Promise<{ id: string; slug: string }> {
  const repo = await requireRepo();
  const data = normalizeInput(input);
  const row = await repo.createExercise(await uniqueSlug(repo, data.title), data);
  invalidateDictationCatalog(row.slug);
  return row;
}

export async function updateDictation(
  id: string,
  input: DictationInput,
): Promise<{ id: string; slug: string }> {
  const repo = await requireRepo();
  const data = normalizeInput(input);
  if (!(await repo.findExercise({ id }))) {
    throw new DictationError("NOT_FOUND", "Exercise not found");
  }
  const row = await repo.updateExercise(id, data);
  invalidateDictationCatalog(row.slug);
  return row;
}

export async function deleteDictation(id: string): Promise<void> {
  const repo = await requireRepo();
  const existing = await repo.findExercise({ id });
  if (!existing) throw new DictationError("NOT_FOUND", "Exercise not found");
  await repo.deleteExercise(id);
  invalidateDictationCatalog(existing.slug);
}
