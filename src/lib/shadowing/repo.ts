/**
 * Shadowing persistence: Postgres via Prisma, or local JSON files in dev when the
 * shadowing migration has not been applied yet. Production never falls back to files.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { canUsePrisma } from "@/lib/db";
import { DATA_DIR } from "@/lib/paths";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { StoredCueSet } from "@/lib/shadowing/cues";
import type { ShadowingErrorSummary, ShadowingWordResult } from "@/lib/shadowing/types";

export type ShadowingStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ExerciseRecord = {
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
  /** Raw stored cue set; validate with `validCueTimings` before use. */
  cues: unknown;
};

export type ExerciseListRow = Pick<
  ExerciseRecord,
  "id" | "slug" | "title" | "level" | "status" | "order"
> & { attempts: number };

export type ExerciseData = Omit<ExerciseRecord, "id" | "slug" | "cues">;

export type AttemptData = {
  userId: string;
  exerciseId: string;
  sttProvider: string;
  recognizedText: string;
  normalizedText: string;
  score: number;
  wer: number;
  totalWords: number;
  correctCount: number;
  substitutionCount: number;
  deletionCount: number;
  insertionCount: number;
  wordResults: ShadowingWordResult[];
  errorSummary: ShadowingErrorSummary;
  recordingKey: string | null;
  recordingMime: string | null;
  recordingMs: number | null;
  recordingExpiresAt: Date | null;
};

export type AttemptRecord = AttemptData & { id: string; createdAt: Date };

export type AttemptListRow = Pick<
  AttemptRecord,
  | "id"
  | "userId"
  | "score"
  | "correctCount"
  | "totalWords"
  | "recognizedText"
  | "recordingKey"
  | "recordingExpiresAt"
  | "createdAt"
>;

export interface ShadowingRepo {
  kind: "prisma" | "file";
  listExercises(publishedOnly: boolean): Promise<ExerciseListRow[]>;
  findExercise(where: { id?: string; slug?: string }): Promise<ExerciseRecord | null>;
  slugTaken(slug: string): Promise<boolean>;
  createExercise(slug: string, data: ExerciseData): Promise<{ id: string; slug: string }>;
  updateExercise(id: string, data: ExerciseData): Promise<{ id: string; slug: string }>;
  setCues(id: string, cues: StoredCueSet | null): Promise<void>;
  deleteExercise(id: string): Promise<void>;
  /** Recording keys still stored for an exercise (to purge before deletion). */
  recordingKeysForExercise(exerciseId: string): Promise<string[]>;
  createAttempt(id: string, data: AttemptData): Promise<AttemptRecord>;
  findAttempt(id: string): Promise<AttemptRecord | null>;
  listAttempts(
    where: { exerciseId: string; userId?: string },
    limit: number,
  ): Promise<AttemptListRow[]>;
  listExpiredRecordings(now: Date, limit: number): Promise<{ id: string; recordingKey: string }[]>;
  clearRecording(id: string): Promise<void>;
}

// ---------- Prisma ----------

const exerciseSelect = {
  id: true,
  slug: true,
  title: true,
  level: true,
  instructions: true,
  audioUrl: true,
  transcript: true,
  maxRecordSeconds: true,
  status: true,
  order: true,
  cues: true,
} as const;

const attemptListSelect = {
  id: true,
  userId: true,
  score: true,
  correctCount: true,
  totalWords: true,
  recognizedText: true,
  recordingKey: true,
  recordingExpiresAt: true,
  createdAt: true,
} as const;

function toAttemptRecord(row: {
  wordResults: unknown;
  errorSummary: unknown;
} & Omit<AttemptRecord, "wordResults" | "errorSummary">): AttemptRecord {
  return {
    ...row,
    wordResults: row.wordResults as ShadowingWordResult[],
    errorSummary: row.errorSummary as ShadowingErrorSummary,
  };
}

const prismaRepo: ShadowingRepo = {
  kind: "prisma",
  async listExercises(publishedOnly) {
    const orderBy = [{ order: "asc" as const }, { createdAt: "asc" as const }];
    const select = { id: true, slug: true, title: true, level: true, status: true, order: true } as const;
    if (publishedOnly) {
      const rows = await prisma.shadowingExercise.findMany({
        where: { status: "PUBLISHED" },
        orderBy,
        select,
      });
      return rows.map((r) => ({ ...r, attempts: 0 }));
    }
    const rows = await prisma.shadowingExercise.findMany({
      orderBy,
      select: { ...select, _count: { select: { attempts: true } } },
    });
    return rows.map(({ _count, ...r }) => ({ ...r, attempts: _count.attempts }));
  },
  async findExercise(where) {
    if (!where.id && !where.slug) return null;
    return prisma.shadowingExercise.findFirst({
      where: where.id ? { id: where.id } : { slug: where.slug },
      select: exerciseSelect,
    });
  },
  async slugTaken(slug) {
    const row = await prisma.shadowingExercise.findUnique({ where: { slug }, select: { id: true } });
    return Boolean(row);
  },
  async createExercise(slug, data) {
    return prisma.shadowingExercise.create({ data: { ...data, slug }, select: { id: true, slug: true } });
  },
  async updateExercise(id, data) {
    return prisma.shadowingExercise.update({ where: { id }, data, select: { id: true, slug: true } });
  },
  async setCues(id, cues) {
    await prisma.shadowingExercise.update({
      where: { id },
      data: { cues: cues ?? Prisma.DbNull },
      select: { id: true },
    });
  },
  async deleteExercise(id) {
    await prisma.shadowingExercise.delete({ where: { id } });
  },
  async recordingKeysForExercise(exerciseId) {
    const rows = await prisma.shadowingAttempt.findMany({
      where: { exerciseId, recordingKey: { not: null } },
      select: { recordingKey: true },
    });
    return rows.map((r) => r.recordingKey).filter((k): k is string => Boolean(k));
  },
  async createAttempt(id, data) {
    const row = await prisma.shadowingAttempt.create({ data: { ...data, id } });
    return toAttemptRecord(row);
  },
  async findAttempt(id) {
    const row = await prisma.shadowingAttempt.findUnique({ where: { id } });
    return row ? toAttemptRecord(row) : null;
  },
  async listAttempts(where, limit) {
    return prisma.shadowingAttempt.findMany({
      where: { exerciseId: where.exerciseId, ...(where.userId ? { userId: where.userId } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: attemptListSelect,
    });
  },
  async listExpiredRecordings(now, limit) {
    const rows = await prisma.shadowingAttempt.findMany({
      where: { recordingKey: { not: null }, recordingExpiresAt: { lte: now } },
      take: limit,
      select: { id: true, recordingKey: true },
    });
    return rows.flatMap((r) => (r.recordingKey ? [{ id: r.id, recordingKey: r.recordingKey }] : []));
  },
  async clearRecording(id) {
    await prisma.shadowingAttempt.update({
      where: { id },
      data: { recordingKey: null, recordingExpiresAt: null },
    });
  },
};

// ---------- Local JSON (dev only) ----------

const FILE_DIR = path.join(DATA_DIR, "shadowing");
const EXERCISES_FILE = path.join(FILE_DIR, "exercises.json");
const ATTEMPTS_FILE = path.join(FILE_DIR, "attempts.json");

type StoredExercise = ExerciseRecord & { createdAt: string; updatedAt: string };
type StoredAttempt = Omit<AttemptRecord, "createdAt" | "recordingExpiresAt"> & {
  createdAt: string;
  recordingExpiresAt: string | null;
};

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJson(file: string, rows: unknown[]) {
  await mkdir(FILE_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

function fromStoredAttempt(a: StoredAttempt): AttemptRecord {
  return {
    ...a,
    createdAt: new Date(a.createdAt),
    recordingExpiresAt: a.recordingExpiresAt ? new Date(a.recordingExpiresAt) : null,
  };
}

function toExerciseRecord(e: StoredExercise): ExerciseRecord {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    level: e.level,
    instructions: e.instructions,
    audioUrl: e.audioUrl,
    transcript: e.transcript,
    maxRecordSeconds: e.maxRecordSeconds,
    status: e.status,
    order: e.order,
    cues: e.cues ?? null,
  };
}

const fileRepo: ShadowingRepo = {
  kind: "file",
  async listExercises(publishedOnly) {
    const [exercises, attempts] = await Promise.all([
      readJson<StoredExercise>(EXERCISES_FILE),
      publishedOnly ? Promise.resolve([]) : readJson<StoredAttempt>(ATTEMPTS_FILE),
    ]);
    return [...exercises]
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
      .filter((e) => !publishedOnly || e.status === "PUBLISHED")
      .map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        level: e.level,
        status: e.status,
        order: e.order,
        attempts: attempts.filter((a) => a.exerciseId === e.id).length,
      }));
  },
  async findExercise(where) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const row = rows.find((e) => (where.id ? e.id === where.id : e.slug === where.slug));
    return row ? toExerciseRecord(row) : null;
  },
  async slugTaken(slug) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    return rows.some((e) => e.slug === slug);
  },
  async createExercise(slug, data) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const now = new Date().toISOString();
    const row: StoredExercise = { ...data, id: randomUUID(), slug, cues: null, createdAt: now, updatedAt: now };
    rows.push(row);
    await writeJson(EXERCISES_FILE, rows);
    return { id: row.id, slug };
  },
  async updateExercise(id, data) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const idx = rows.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("NOT_FOUND");
    rows[idx] = { ...rows[idx], ...data, updatedAt: new Date().toISOString() };
    await writeJson(EXERCISES_FILE, rows);
    return { id, slug: rows[idx].slug };
  },
  async setCues(id, cues) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const idx = rows.findIndex((e) => e.id === id);
    if (idx < 0) throw new Error("NOT_FOUND");
    rows[idx] = { ...rows[idx], cues, updatedAt: new Date().toISOString() };
    await writeJson(EXERCISES_FILE, rows);
  },
  async deleteExercise(id) {
    const [exercises, attempts] = await Promise.all([
      readJson<StoredExercise>(EXERCISES_FILE),
      readJson<StoredAttempt>(ATTEMPTS_FILE),
    ]);
    await writeJson(EXERCISES_FILE, exercises.filter((e) => e.id !== id));
    await writeJson(ATTEMPTS_FILE, attempts.filter((a) => a.exerciseId !== id));
  },
  async recordingKeysForExercise(exerciseId) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    return rows
      .filter((a) => a.exerciseId === exerciseId && a.recordingKey)
      .map((a) => a.recordingKey as string);
  },
  async createAttempt(id, data) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const row: StoredAttempt = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      recordingExpiresAt: data.recordingExpiresAt?.toISOString() ?? null,
    };
    rows.push(row);
    await writeJson(ATTEMPTS_FILE, rows);
    return fromStoredAttempt(row);
  },
  async findAttempt(id) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const row = rows.find((a) => a.id === id);
    return row ? fromStoredAttempt(row) : null;
  },
  async listAttempts(where, limit) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    return rows
      .filter((a) => a.exerciseId === where.exerciseId && (!where.userId || a.userId === where.userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((a) => {
        const r = fromStoredAttempt(a);
        return {
          id: r.id,
          userId: r.userId,
          score: r.score,
          correctCount: r.correctCount,
          totalWords: r.totalWords,
          recognizedText: r.recognizedText,
          recordingKey: r.recordingKey,
          recordingExpiresAt: r.recordingExpiresAt,
          createdAt: r.createdAt,
        };
      });
  },
  async listExpiredRecordings(now, limit) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    return rows
      .filter(
        (a) =>
          a.recordingKey &&
          a.recordingExpiresAt &&
          new Date(a.recordingExpiresAt).getTime() <= now.getTime(),
      )
      .slice(0, limit)
      .map((a) => ({ id: a.id, recordingKey: a.recordingKey as string }));
  },
  async clearRecording(id) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const idx = rows.findIndex((a) => a.id === id);
    if (idx < 0) return;
    rows[idx] = { ...rows[idx], recordingKey: null, recordingExpiresAt: null };
    await writeJson(ATTEMPTS_FILE, rows);
  },
};

// ---------- Backend selection ----------

const PROBE_TTL_SUCCESS_MS = 60_000;
const PROBE_TTL_ERROR_MS = 2_000;
let tableProbe: { ok: boolean; checkedAt: number } | null = null;

async function shadowingTablesExist(): Promise<boolean> {
  const now = Date.now();
  if (tableProbe) {
    const ttl = tableProbe.ok ? PROBE_TTL_SUCCESS_MS : PROBE_TTL_ERROR_MS;
    if (now - tableProbe.checkedAt < ttl) return tableProbe.ok;
  }
  try {
    const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
      SELECT to_regclass('"ShadowingExercise"') IS NOT NULL AS ok`;
    tableProbe = { ok: Boolean(rows[0]?.ok), checkedAt: now };
  } catch {
    tableProbe = { ok: false, checkedAt: now };
  }
  return tableProbe.ok;
}

/** null = no usable backend (production without DB / migration). */
export async function getShadowingRepo(): Promise<ShadowingRepo | null> {
  if ((await canUsePrisma()) && (await shadowingTablesExist())) return prismaRepo;
  if (process.env.NODE_ENV === "production") {
    console.warn("[shadowing] Postgres unavailable or migration not applied");
    return null;
  }
  return fileRepo;
}
