/**
 * Dictation persistence: Postgres via Prisma, or local JSON files in dev when
 * the DB is unreachable / the dictation migration has not been applied yet.
 * Production never falls back to files (Vercel FS is ephemeral).
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@/generated/prisma/client";
import { canUsePrisma } from "@/lib/db";
import { DATA_DIR } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import type {
  DictationErrorSummary,
  DictationMode,
  DictationSettings,
  DictationWordResult,
  FillBlankGap,
  FillBlankGapResult,
} from "@/lib/dictation/types";

export type DictationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ExerciseRecord = {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  instructions: string | null;
  audioUrl: string;
  transcript: string;
  mode: DictationMode;
  gaps: unknown;
  settings: unknown;
  status: DictationStatus;
  order: number;
};

export type ExerciseListRow = Pick<
  ExerciseRecord,
  "id" | "slug" | "title" | "level" | "mode" | "status" | "order"
> & { attempts: number };

export type ExerciseData = Omit<ExerciseRecord, "id" | "slug" | "settings" | "gaps"> & {
  settings: DictationSettings;
  gaps: FillBlankGap[] | null;
};

export type AttemptRecord = {
  id: string;
  userId: string | null;
  exerciseId: string;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: Date;
};

export type AttemptCompletion = {
  submittedText: string;
  normalizedText: string;
  score: number;
  correctCount: number;
  totalWords: number;
  listenCount: number;
  completedAt: Date;
  durationSeconds: number;
  wordResults: DictationWordResult[];
  errorSummary: DictationErrorSummary;
  submittedAnswers: Record<string, string> | null;
  gapResults: FillBlankGapResult[] | null;
};

export type CompletedAttemptRow = {
  id: string;
  score: number;
  correctCount: number;
  totalWords: number;
  durationSeconds: number;
  completedAt: Date;
};

export type CompletedAttemptDetail = Pick<AttemptRecord, "id" | "userId" | "exerciseId"> &
  AttemptCompletion;

export interface DictationRepo {
  kind: "prisma" | "file";
  listExercises(publishedOnly: boolean): Promise<ExerciseListRow[]>;
  findExercise(where: { id?: string; slug?: string }): Promise<ExerciseRecord | null>;
  slugTaken(slug: string, excludeId?: string): Promise<boolean>;
  createExercise(slug: string, data: ExerciseData): Promise<{ id: string; slug: string }>;
  updateExercise(id: string, data: ExerciseData): Promise<{ id: string; slug: string }>;
  deleteExercise(id: string): Promise<void>;
  createAttempt(exerciseId: string, userId: string | null): Promise<AttemptRecord>;
  findAttempt(id: string): Promise<AttemptRecord | null>;
  /** Returns false when the attempt was no longer IN_PROGRESS. */
  completeAttempt(id: string, data: AttemptCompletion): Promise<boolean>;
  /** Returns false when the attempt does not exist or is already completed. */
  deleteInProgressAttempt(id: string): Promise<boolean>;
  listCompletedAttempts(
    userId: string,
    exerciseId: string,
    limit: number,
  ): Promise<CompletedAttemptRow[]>;
  findCompletedAttempt(id: string): Promise<CompletedAttemptDetail | null>;
}

const EMPTY_SUMMARY: DictationErrorSummary = { missing: [], incorrect: [], extra: [] };

// ---------- Prisma ----------

const prismaRepo: DictationRepo = {
  kind: "prisma",
  async listExercises(publishedOnly) {
    const select = {
      id: true,
      slug: true,
      title: true,
      level: true,
      mode: true,
      status: true,
      order: true,
    } as const;
    const orderBy = [{ order: "asc" as const }, { createdAt: "asc" as const }];
    if (publishedOnly) {
      const rows = await prisma.dictationExercise.findMany({
        where: { status: "PUBLISHED" },
        orderBy,
        select,
      });
      return rows.map((r) => ({ ...r, attempts: 0 }));
    }
    const rows = await prisma.dictationExercise.findMany({
      orderBy,
      select: { ...select, _count: { select: { attempts: true } } },
    });
    return rows.map(({ _count, ...r }) => ({ ...r, attempts: _count.attempts }));
  },
  async findExercise(where) {
    if (!where.id && !where.slug) return null;
    return prisma.dictationExercise.findFirst({
      where: where.id ? { id: where.id } : { slug: where.slug },
      select: {
        id: true,
        slug: true,
        title: true,
        level: true,
        instructions: true,
        audioUrl: true,
        transcript: true,
        mode: true,
        gaps: true,
        settings: true,
        status: true,
        order: true,
      },
    });
  },
  async slugTaken(slug, excludeId) {
    const row = await prisma.dictationExercise.findUnique({
      where: { slug },
      select: { id: true },
    });
    return Boolean(row && row.id !== excludeId);
  },
  async createExercise(slug, data) {
    return prisma.dictationExercise.create({
      data: { ...data, gaps: data.gaps ?? Prisma.DbNull, slug },
      select: { id: true, slug: true },
    });
  },
  async updateExercise(id, data) {
    return prisma.dictationExercise.update({
      where: { id },
      data: { ...data, gaps: data.gaps ?? Prisma.DbNull },
      select: { id: true, slug: true },
    });
  },
  async deleteExercise(id) {
    await prisma.dictationExercise.delete({ where: { id } });
  },
  async createAttempt(exerciseId, userId) {
    return prisma.dictationAttempt.create({
      data: { exerciseId, userId },
      select: { id: true, userId: true, exerciseId: true, status: true, startedAt: true },
    });
  },
  async findAttempt(id) {
    return prisma.dictationAttempt.findUnique({
      where: { id },
      select: { id: true, userId: true, exerciseId: true, status: true, startedAt: true },
    });
  },
  async completeAttempt(id, data) {
    const updated = await prisma.dictationAttempt.updateMany({
      where: { id, status: "IN_PROGRESS" },
      data: {
        ...data,
        submittedAnswers: data.submittedAnswers ?? Prisma.DbNull,
        gapResults: data.gapResults ?? Prisma.DbNull,
        status: "COMPLETED",
      },
    });
    return updated.count > 0;
  },
  async deleteInProgressAttempt(id) {
    const deleted = await prisma.dictationAttempt.deleteMany({
      where: { id, status: "IN_PROGRESS" },
    });
    return deleted.count > 0;
  },
  async listCompletedAttempts(userId, exerciseId, limit) {
    const rows = await prisma.dictationAttempt.findMany({
      where: { userId, exerciseId, status: "COMPLETED" },
      orderBy: { startedAt: "desc" },
      take: limit,
      select: {
        id: true,
        score: true,
        correctCount: true,
        totalWords: true,
        durationSeconds: true,
        completedAt: true,
        startedAt: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      score: r.score ?? 0,
      correctCount: r.correctCount ?? 0,
      totalWords: r.totalWords ?? 0,
      durationSeconds: r.durationSeconds ?? 0,
      completedAt: r.completedAt ?? r.startedAt,
    }));
  },
  async findCompletedAttempt(id) {
    const r = await prisma.dictationAttempt.findFirst({
      where: { id, status: "COMPLETED" },
      select: {
        id: true,
        userId: true,
        exerciseId: true,
        submittedText: true,
        normalizedText: true,
        score: true,
        correctCount: true,
        totalWords: true,
        listenCount: true,
        startedAt: true,
        completedAt: true,
        durationSeconds: true,
        wordResults: true,
        errorSummary: true,
        submittedAnswers: true,
        gapResults: true,
      },
    });
    if (!r) return null;
    return {
      id: r.id,
      userId: r.userId,
      exerciseId: r.exerciseId,
      submittedText: r.submittedText ?? "",
      normalizedText: r.normalizedText ?? "",
      score: r.score ?? 0,
      correctCount: r.correctCount ?? 0,
      totalWords: r.totalWords ?? 0,
      listenCount: r.listenCount,
      completedAt: r.completedAt ?? r.startedAt,
      durationSeconds: r.durationSeconds ?? 0,
      wordResults: (r.wordResults ?? []) as DictationWordResult[],
      errorSummary: (r.errorSummary ?? EMPTY_SUMMARY) as DictationErrorSummary,
      submittedAnswers: (r.submittedAnswers ?? null) as Record<string, string> | null,
      gapResults: (r.gapResults ?? null) as FillBlankGapResult[] | null,
    };
  },
};

// ---------- Local JSON (dev only) ----------

const FILE_DIR = path.join(DATA_DIR, "dictation");
const EXERCISES_FILE = path.join(FILE_DIR, "exercises.json");
const ATTEMPTS_FILE = path.join(FILE_DIR, "attempts.json");

type StoredAttempt = Omit<AttemptRecord, "startedAt"> &
  Partial<Omit<AttemptCompletion, "completedAt">> & {
    startedAt: string;
    completedAt?: string;
  };

type StoredExercise = ExerciseRecord & { createdAt: string; updatedAt: string };

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

function toAttempt(a: StoredAttempt): AttemptRecord {
  return {
    id: a.id,
    userId: a.userId,
    exerciseId: a.exerciseId,
    status: a.status,
    startedAt: new Date(a.startedAt),
  };
}

function sortExercises(rows: StoredExercise[]) {
  return [...rows].sort(
    (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt),
  );
}

const fileRepo: DictationRepo = {
  kind: "file",
  async listExercises(publishedOnly) {
    const [exercises, attempts] = await Promise.all([
      readJson<StoredExercise>(EXERCISES_FILE),
      publishedOnly ? Promise.resolve([]) : readJson<StoredAttempt>(ATTEMPTS_FILE),
    ]);
    return sortExercises(exercises)
      .filter((e) => !publishedOnly || e.status === "PUBLISHED")
      .map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        level: e.level,
        mode: e.mode ?? "FULL_TEXT",
        status: e.status,
        order: e.order,
        attempts: attempts.filter((a) => a.exerciseId === e.id).length,
      }));
  },
  async findExercise(where) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const row = rows.find((e) => (where.id ? e.id === where.id : e.slug === where.slug));
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      level: row.level,
      instructions: row.instructions,
      audioUrl: row.audioUrl,
      transcript: row.transcript,
      mode: row.mode ?? "FULL_TEXT",
      gaps: row.gaps ?? null,
      settings: row.settings,
      status: row.status,
      order: row.order,
    };
  },
  async slugTaken(slug, excludeId) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    return rows.some((e) => e.slug === slug && e.id !== excludeId);
  },
  async createExercise(slug, data) {
    const rows = await readJson<StoredExercise>(EXERCISES_FILE);
    const now = new Date().toISOString();
    const row: StoredExercise = { ...data, id: randomUUID(), slug, createdAt: now, updatedAt: now };
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
  async deleteExercise(id) {
    const [exercises, attempts] = await Promise.all([
      readJson<StoredExercise>(EXERCISES_FILE),
      readJson<StoredAttempt>(ATTEMPTS_FILE),
    ]);
    await writeJson(EXERCISES_FILE, exercises.filter((e) => e.id !== id));
    await writeJson(ATTEMPTS_FILE, attempts.filter((a) => a.exerciseId !== id));
  },
  async createAttempt(exerciseId, userId) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const row: StoredAttempt = {
      id: randomUUID(),
      userId,
      exerciseId,
      status: "IN_PROGRESS",
      startedAt: new Date().toISOString(),
    };
    rows.push(row);
    await writeJson(ATTEMPTS_FILE, rows);
    return toAttempt(row);
  },
  async findAttempt(id) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const row = rows.find((a) => a.id === id);
    return row ? toAttempt(row) : null;
  },
  async completeAttempt(id, data) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const idx = rows.findIndex((a) => a.id === id && a.status === "IN_PROGRESS");
    if (idx < 0) return false;
    rows[idx] = {
      ...rows[idx],
      ...data,
      completedAt: data.completedAt.toISOString(),
      status: "COMPLETED",
    };
    await writeJson(ATTEMPTS_FILE, rows);
    return true;
  },
  async deleteInProgressAttempt(id) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const kept = rows.filter((a) => !(a.id === id && a.status === "IN_PROGRESS"));
    if (kept.length === rows.length) return false;
    await writeJson(ATTEMPTS_FILE, kept);
    return true;
  },
  async listCompletedAttempts(userId, exerciseId, limit) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    return rows
      .filter(
        (a) => a.userId === userId && a.exerciseId === exerciseId && a.status === "COMPLETED",
      )
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        score: a.score ?? 0,
        correctCount: a.correctCount ?? 0,
        totalWords: a.totalWords ?? 0,
        durationSeconds: a.durationSeconds ?? 0,
        completedAt: new Date(a.completedAt ?? a.startedAt),
      }));
  },
  async findCompletedAttempt(id) {
    const rows = await readJson<StoredAttempt>(ATTEMPTS_FILE);
    const a = rows.find((r) => r.id === id && r.status === "COMPLETED");
    if (!a) return null;
    return {
      id: a.id,
      userId: a.userId,
      exerciseId: a.exerciseId,
      submittedText: a.submittedText ?? "",
      normalizedText: a.normalizedText ?? "",
      score: a.score ?? 0,
      correctCount: a.correctCount ?? 0,
      totalWords: a.totalWords ?? 0,
      listenCount: a.listenCount ?? 0,
      completedAt: new Date(a.completedAt ?? a.startedAt),
      durationSeconds: a.durationSeconds ?? 0,
      wordResults: a.wordResults ?? [],
      errorSummary: a.errorSummary ?? EMPTY_SUMMARY,
      submittedAnswers: a.submittedAnswers ?? null,
      gapResults: a.gapResults ?? null,
    };
  },
};

// ---------- Backend selection ----------

const PROBE_TTL_MS = 30_000;
let tableProbe: { ok: boolean; checkedAt: number } | null = null;

async function dictationTablesExist(): Promise<boolean> {
  const now = Date.now();
  if (tableProbe && now - tableProbe.checkedAt < PROBE_TTL_MS) return tableProbe.ok;
  try {
    const rows = await prisma.$queryRaw<{ ok: boolean }[]>`
      SELECT to_regclass('"DictationExercise"') IS NOT NULL AS ok`;
    tableProbe = { ok: Boolean(rows[0]?.ok), checkedAt: now };
  } catch {
    tableProbe = { ok: false, checkedAt: now };
  }
  return tableProbe.ok;
}

/** null = no usable backend (production without DB / migration). */
export async function getDictationRepo(): Promise<DictationRepo | null> {
  if ((await canUsePrisma()) && (await dictationTablesExist())) return prismaRepo;
  if (process.env.NODE_ENV === "production") {
    console.warn("[dictation] Postgres unavailable or migration not applied");
    return null;
  }
  return fileRepo;
}
