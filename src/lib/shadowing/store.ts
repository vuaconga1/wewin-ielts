import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { mediaUrl } from "@/lib/media/url";
import { prisma } from "@/lib/prisma";
import { tokenize } from "@/lib/dictation/scoring";
import { clampRecordSeconds, gradeShadowing, pickClosestAlternatives } from "@/lib/shadowing/scoring";
import { validCueTimings } from "@/lib/shadowing/cues";
import {
  deleteRecording,
  readRecording,
  recordingKeyFor,
  saveRecording,
} from "@/lib/shadowing/recording-storage";
import {
  getShadowingRepo,
  type AttemptListRow,
  type AttemptRecord,
  type ExerciseData,
  type ExerciseListRow,
  type ShadowingRepo,
  type ShadowingStatus,
} from "@/lib/shadowing/repo";
import {
  DEFAULT_MAX_RECORD_SECONDS,
  MAX_RECORD_SECONDS,
  MIN_RECORD_SECONDS,
  type PublicShadowingExercise,
  type ShadowingAdminAttempt,
  type ShadowingAttemptResult,
  type ShadowingCatalogItem,
  type ShadowingHistoryItem,
  type SttProviderId,
} from "@/lib/shadowing/types";

const CATALOG_TAG = "shadowing-catalog";
const MAX_RECOGNIZED_CHARS = 5_000;
const HISTORY_LIMIT = 30;
const ADMIN_ATTEMPTS_LIMIT = 100;
export const RECORDING_RETENTION_DAYS = 18;
const PURGE_INTERVAL_MS = 10 * 60 * 1000;
const PURGE_BATCH = 50;

const STT_PROVIDERS: readonly SttProviderId[] = ["web-speech"];

export class ShadowingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Viewer = { id: string; role?: string | null } | null;

function canReviewOthers(viewer: Viewer): boolean {
  return viewer?.role === "ADMIN" || viewer?.role === "TEACHER";
}

async function requireRepo(): Promise<ShadowingRepo> {
  const repo = await getShadowingRepo();
  if (!repo) throw new ShadowingError("DB_UNAVAILABLE", "Database unavailable");
  return repo;
}

export function invalidateShadowingCatalog(slug?: string) {
  try {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/learn/shadowing");
    revalidatePath("/learn/shadowing/level/[level]", "page");
    if (slug) revalidatePath(`/learn/shadowing/${slug}`);
  } catch {
    /* outside request scope */
  }
}

function recordingUrl(attemptId: string): string {
  return `/api/shadowing/attempts/${attemptId}/recording`;
}

function recordingAvailable(a: Pick<AttemptRecord, "recordingKey" | "recordingExpiresAt">): boolean {
  return Boolean(
    a.recordingKey && (!a.recordingExpiresAt || a.recordingExpiresAt.getTime() > Date.now()),
  );
}

// ---------- Learner ----------

// Throw (not null/[]) when the DB is unreachable so a transient outage is never cached as 404/empty.
export const listPublishedShadowing = unstable_cache(
  async (): Promise<ShadowingCatalogItem[]> => {
    const repo = await requireRepo();
    const rows = await repo.listExercises(true);
    return rows.map(({ id, slug, title, level }) => ({ id, slug, title, level }));
  },
  ["shadowing-catalog-v1"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

const getPublishedShadowingRow = unstable_cache(
  async (slug: string) => {
    const repo = await requireRepo();
    const row = await repo.findExercise({ slug });
    if (!row || row.status !== "PUBLISHED") return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      level: row.level,
      instructions: row.instructions,
      audioUrl: row.audioUrl,
      maxRecordSeconds: row.maxRecordSeconds,
      transcript: row.transcript,
      cues: validCueTimings(row.cues, row.transcript, row.audioUrl),
    };
  },
  ["shadowing-exercise-v3"],
  { revalidate: 300, tags: [CATALOG_TAG] },
);

export async function getPublicShadowing(slug: string): Promise<PublicShadowingExercise | null> {
  const row = await getPublishedShadowingRow(slug);
  return row ? { ...row, audioUrl: mediaUrl(row.audioUrl) } : null;
}

function toResult(attempt: AttemptRecord, transcript: string): ShadowingAttemptResult {
  const available = recordingAvailable(attempt);
  return {
    attemptId: attempt.id,
    sttProvider: attempt.sttProvider,
    recognizedText: attempt.recognizedText,
    transcript,
    createdAt: attempt.createdAt.toISOString(),
    score: attempt.score,
    wer: attempt.wer,
    totalWords: attempt.totalWords,
    correctCount: attempt.correctCount,
    substitutionCount: attempt.substitutionCount,
    deletionCount: attempt.deletionCount,
    insertionCount: attempt.insertionCount,
    normalizedText: attempt.normalizedText,
    wordResults: attempt.wordResults,
    errorSummary: attempt.errorSummary,
    recordingUrl: available ? recordingUrl(attempt.id) : null,
    recordingExpiresAt: available ? attempt.recordingExpiresAt?.toISOString() ?? null : null,
  };
}

export type RecordingUpload = { buffer: Buffer; mime: string; ext: string; durationMs: number | null };

export async function submitShadowingAttempt(input: {
  slug: string;
  userId: string;
  sttProvider: string;
  recognizedText: string;
  /** Per-chunk alternative guesses from the recognizer, best first. */
  alternatives?: unknown;
  recording: RecordingUpload | null;
}): Promise<ShadowingAttemptResult> {
  const repo = await requireRepo();
  const exercise = await repo.findExercise({ slug: input.slug });
  if (!exercise || exercise.status !== "PUBLISHED") {
    throw new ShadowingError("NOT_FOUND", "Exercise not found");
  }
  if (!STT_PROVIDERS.includes(input.sttProvider as SttProviderId)) {
    throw new ShadowingError("INVALID_PROVIDER", "Unsupported speech recognizer");
  }
  const recognizedText = (
    pickClosestAlternatives(exercise.transcript, input.alternatives) ?? input.recognizedText
  )
    .trim()
    .slice(0, MAX_RECOGNIZED_CHARS);
  if (tokenize(recognizedText).length === 0) {
    throw new ShadowingError("NO_SPEECH", "Nothing was recognized");
  }

  const grade = gradeShadowing(exercise.transcript, recognizedText);
  const attemptId = randomUUID();
  let recordingKey: string | null = null;
  if (input.recording) {
    recordingKey = recordingKeyFor(attemptId, input.recording.ext);
    await saveRecording(recordingKey, input.recording.buffer, input.recording.mime);
  }

  try {
    const attempt = await repo.createAttempt(attemptId, {
      userId: input.userId,
      exerciseId: exercise.id,
      sttProvider: input.sttProvider,
      recognizedText,
      ...grade,
      recordingKey,
      recordingMime: input.recording?.mime ?? null,
      recordingMs: input.recording?.durationMs ?? null,
      recordingExpiresAt: recordingKey
        ? new Date(Date.now() + RECORDING_RETENTION_DAYS * 24 * 60 * 60 * 1000)
        : null,
    });
    void purgeExpiredRecordings();
    return toResult(attempt, exercise.transcript);
  } catch (err) {
    if (recordingKey) await deleteRecording(recordingKey);
    throw err;
  }
}

async function loadAttemptFor(attemptId: string, viewer: Viewer) {
  if (!viewer) throw new ShadowingError("UNAUTHORIZED", "Sign in required");
  const repo = await requireRepo();
  const attempt = await repo.findAttempt(attemptId);
  if (!attempt) throw new ShadowingError("NOT_FOUND", "Attempt not found");
  if (attempt.userId !== viewer.id && !canReviewOthers(viewer)) {
    throw new ShadowingError("FORBIDDEN", "Attempt belongs to another user");
  }
  return { repo, attempt };
}

export async function getShadowingAttempt(
  attemptId: string,
  viewer: Viewer,
): Promise<ShadowingAttemptResult> {
  const { repo, attempt } = await loadAttemptFor(attemptId, viewer);
  const exercise = await repo.findExercise({ id: attempt.exerciseId });
  if (!exercise) throw new ShadowingError("NOT_FOUND", "Exercise not found");
  return toResult(attempt, exercise.transcript);
}

export async function getShadowingRecording(
  attemptId: string,
  viewer: Viewer,
): Promise<{ body: Buffer; mime: string }> {
  const { attempt } = await loadAttemptFor(attemptId, viewer);
  if (!recordingAvailable(attempt) || !attempt.recordingKey) {
    throw new ShadowingError("RECORDING_GONE", "Recording no longer available");
  }
  const body = await readRecording(attempt.recordingKey);
  if (!body) throw new ShadowingError("RECORDING_GONE", "Recording no longer available");
  return { body, mime: attempt.recordingMime || "audio/webm" };
}

function toHistoryItem(r: AttemptListRow): ShadowingHistoryItem {
  return {
    attemptId: r.id,
    score: r.score,
    correctCount: r.correctCount,
    totalWords: r.totalWords,
    createdAt: r.createdAt.toISOString(),
    hasRecording: recordingAvailable(r),
  };
}

export async function listShadowingHistory(input: {
  slug: string;
  userId: string;
}): Promise<ShadowingHistoryItem[]> {
  const repo = await requireRepo();
  const exercise = await repo.findExercise({ slug: input.slug });
  if (!exercise) throw new ShadowingError("NOT_FOUND", "Exercise not found");
  const rows = await repo.listAttempts(
    { exerciseId: exercise.id, userId: input.userId },
    HISTORY_LIMIT,
  );
  return rows.map(toHistoryItem);
}

let lastPurgeAt = 0;

/** Deletes recordings past the retention window. Throttled per server instance. */
export async function purgeExpiredRecordings(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastPurgeAt < PURGE_INTERVAL_MS) return 0;
  lastPurgeAt = now;
  try {
    const repo = await getShadowingRepo();
    if (!repo) return 0;
    const expired = await repo.listExpiredRecordings(new Date(now), PURGE_BATCH);
    for (const row of expired) {
      await deleteRecording(row.recordingKey);
      await repo.clearRecording(row.id);
    }
    return expired.length;
  } catch (err) {
    console.warn("[shadowing] purge failed", err);
    return 0;
  }
}

// ---------- Admin ----------

export type ShadowingAdminRow = ExerciseListRow;

export type ShadowingAdminDetail = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  transcript: string;
  maxRecordSeconds: number;
  status: ShadowingStatus;
  order: number;
};

export type ShadowingInput = {
  title: string;
  level?: string | null;
  instructions?: string | null;
  audioUrl: string;
  transcript: string;
  maxRecordSeconds?: number;
  status?: string;
  order?: number;
};

export async function listShadowingForAdmin(): Promise<ShadowingAdminRow[]> {
  const repo = await getShadowingRepo();
  return repo ? repo.listExercises(false) : [];
}

export async function getShadowingForAdmin(id: string): Promise<ShadowingAdminDetail | null> {
  const repo = await getShadowingRepo();
  return repo ? repo.findExercise({ id }) : null;
}

async function userLabels(ids: string[]): Promise<Map<string, string>> {
  const labels = new Map<string, string>();
  if (ids.length === 0) return labels;
  try {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, fullName: true },
    });
    for (const u of users) labels.set(u.id, u.fullName ? `${u.fullName} (${u.username})` : u.username);
  } catch {
    /* DB unreachable — fall back to ids */
  }
  return labels;
}

export async function listShadowingAttemptsForAdmin(
  exerciseId: string,
): Promise<ShadowingAdminAttempt[]> {
  const repo = await getShadowingRepo();
  if (!repo) return [];
  const rows = await repo.listAttempts({ exerciseId }, ADMIN_ATTEMPTS_LIMIT);
  const labels = await userLabels([...new Set(rows.map((r) => r.userId))]);
  return rows.map((r) => ({
    ...toHistoryItem(r),
    userId: r.userId,
    userLabel: labels.get(r.userId) ?? r.userId,
    recognizedText: r.recognizedText,
    recordingUrl: recordingAvailable(r) ? recordingUrl(r.id) : null,
  }));
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

async function uniqueSlug(repo: ShadowingRepo, title: string): Promise<string> {
  const base = slugify(title) || "shadowing";
  for (let n = 1; n < 1000; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await repo.slugTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function normalizeInput(input: ShadowingInput): ExerciseData {
  const title = String(input.title ?? "").trim();
  const audioUrl = String(input.audioUrl ?? "").trim();
  const transcript = String(input.transcript ?? "").trim();
  if (!title) throw new ShadowingError("INVALID_TITLE", "Missing title");
  if (!audioUrl) throw new ShadowingError("INVALID_AUDIO", "Missing audio");
  if (tokenize(transcript).length === 0) {
    throw new ShadowingError("EMPTY_TRANSCRIPT", "Transcript is empty");
  }
  const status: ShadowingStatus =
    input.status === "DRAFT" || input.status === "ARCHIVED" ? input.status : "PUBLISHED";
  const order = Number(input.order);
  return {
    title,
    level: String(input.level ?? "").trim() || null,
    instructions: String(input.instructions ?? "").trim() || null,
    audioUrl,
    transcript,
    maxRecordSeconds: clampRecordSeconds(
      input.maxRecordSeconds,
      DEFAULT_MAX_RECORD_SECONDS,
      MIN_RECORD_SECONDS,
      MAX_RECORD_SECONDS,
    ),
    status,
    order: Number.isFinite(order) ? Math.max(0, Math.floor(order)) : 0,
  };
}

export async function createShadowing(input: ShadowingInput): Promise<{ id: string; slug: string }> {
  const repo = await requireRepo();
  const data = normalizeInput(input);
  const row = await repo.createExercise(await uniqueSlug(repo, data.title), data);
  invalidateShadowingCatalog(row.slug);
  return row;
}

export async function updateShadowing(
  id: string,
  input: ShadowingInput,
): Promise<{ id: string; slug: string }> {
  const repo = await requireRepo();
  const data = normalizeInput(input);
  if (!(await repo.findExercise({ id }))) {
    throw new ShadowingError("NOT_FOUND", "Exercise not found");
  }
  const row = await repo.updateExercise(id, data);
  invalidateShadowingCatalog(row.slug);
  return row;
}

export async function deleteShadowing(id: string): Promise<void> {
  const repo = await requireRepo();
  const existing = await repo.findExercise({ id });
  if (!existing) throw new ShadowingError("NOT_FOUND", "Exercise not found");
  const keys = await repo.recordingKeysForExercise(id);
  await repo.deleteExercise(id);
  await Promise.all(keys.map((k) => deleteRecording(k)));
  invalidateShadowingCatalog(existing.slug);
}
