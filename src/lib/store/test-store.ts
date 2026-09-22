import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedTestDraft } from "@/lib/import/schemas";
import type { StoredAiScore } from "@/lib/ai/types";
import { BUNDLED_DATA_DIR, DATA_DIR, isVercel } from "@/lib/paths";
import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

const TESTS_DIR = path.join(DATA_DIR, "tests");
const ATTEMPTS_DIR = path.join(DATA_DIR, "attempts");
const BUNDLED_TESTS_DIR = path.join(BUNDLED_DATA_DIR, "tests");

export type StoredTest = ParsedTestDraft & {
  savedAt: string;
};

export type StoredAttempt = {
  id: string;
  testSlug: string;
  userId?: string | null;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  /** When set, only these question numbers are shown / graded (e.g. redo wrong). */
  questionNumbers?: number[];
  /** Speaking: IELTS Part 1/2/3 selection (not imported JSON part.order). */
  speakingPartKinds?: number[];
  timeLimitMinutes: number | null;
  startedAt: string;
  updatedAt?: string;
  finishedAt: string | null;
  answers: Record<string, string>;
  score?: {
    correct: number;
    total: number;
    percent: number;
  };
  /** Speaking / Writing AI examiner result (Whisper + gpt-audio + gpt-4o-mini). */
  aiScore?: StoredAiScore;
  /**
   * One-time token issued only on submit (or auto-submit at timeout).
   * Required to call AI scoring — prevents scoring on abandon / refresh / replay.
   */
  aiScoreNonce?: string | null;
};

/** In-memory TTL for catalog/home list pages (invalidated on draft save). */
const TESTS_CACHE_TTL_MS = 60_000;

let testsCache: { data: StoredTest[]; expiresAt: number } | null = null;

function invalidateTestsCache() {
  testsCache = null;
}

async function ensureDirs() {
  await mkdir(TESTS_DIR, { recursive: true });
  await mkdir(ATTEMPTS_DIR, { recursive: true });
}

type PrismaTestFull = Prisma.TestGetPayload<{
  include: {
    sections: {
      include: {
        questions: { include: { answerKey: true } };
      };
    };
    media: true;
  };
}>;

/** Full test payload (practice / scoring) — includes answer keys. */
const testInclude = {
  sections: {
    include: {
      questions: { include: { answerKey: true as const } },
    },
  },
  media: true,
} satisfies Prisma.TestInclude;

/**
 * Catalog / home / ranking list — skip answerKey to avoid heavy joins.
 * Question stems stay for Speaking queue length on catalog cards.
 */
const testListInclude = {
  sections: {
    include: {
      questions: true,
    },
  },
  media: true,
} satisfies Prisma.TestInclude;

type PrismaTestList = Prisma.TestGetPayload<{ include: typeof testListInclude }>;

function tagsToStrings(tags: Prisma.JsonValue | null): string[] | undefined {
  if (!Array.isArray(tags)) return undefined;
  const out = tags.filter((t): t is string => typeof t === "string");
  return out.length ? out : undefined;
}

function metaRecord(
  meta: Prisma.JsonValue | null,
): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return undefined;
  return meta as Record<string, unknown>;
}

function contentRecord(content: Prisma.JsonValue): Record<string, unknown> {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content as Record<string, unknown>;
  }
  return {};
}

function acceptableList(
  value: Prisma.JsonValue | null | undefined,
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = value.filter((v): v is string => typeof v === "string");
  return out.length ? out : undefined;
}

function prismaTestToStored(
  test: PrismaTestFull | PrismaTestList,
): StoredTest {
  const audioFiles = test.media
    .filter((m) => m.type === "AUDIO")
    .map((m) => m.path);

  return {
    title: test.title,
    slug: test.slug,
    skill: test.skill,
    examType: test.examType,
    timeLimitMinutes: test.timeLimitMinutes ?? undefined,
    tags: tagsToStrings(test.tags),
    sourceFolder: test.sourceFolder ?? undefined,
    description: test.description ?? undefined,
    parts: [...test.sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        title: section.title,
        order: section.order,
        content: section.content ?? undefined,
        meta: metaRecord(section.meta),
        questions: [...section.questions]
          .sort((a, b) => a.order - b.order)
          .map((q) => {
            const withKey =
              "answerKey" in q
                ? (q as PrismaTestFull["sections"][number]["questions"][number])
                : null;
            return {
              number: q.number,
              order: q.order,
              type: q.type,
              content: contentRecord(q.content),
              mediaUrl: q.mediaUrl ?? undefined,
              correctAnswer: withKey?.answerKey?.correctAnswer ?? undefined,
              acceptableAnswers: acceptableList(
                withKey?.answerKey?.acceptableAnswers,
              ),
              explanation: withKey?.answerKey?.explanation ?? undefined,
            };
          }),
      })),
    audioFiles: audioFiles.length ? audioFiles : undefined,
    savedAt: test.updatedAt.toISOString(),
  };
}

async function listTestsFromPrisma(): Promise<StoredTest[] | null> {
  if (!(await canUsePrisma())) return null;
  try {
    const rows = await prisma.test.findMany({
      where: { status: { in: ["PUBLISHED", "DRAFT"] } },
      include: testListInclude,
      orderBy: { updatedAt: "desc" },
    });
    if (!rows.length) return null;
    return rows.map(prismaTestToStored);
  } catch {
    return null;
  }
}

async function getTestFromPrisma(slug: string): Promise<StoredTest | null> {
  if (!(await canUsePrisma())) return null;
  try {
    const row = await prisma.test.findFirst({
      where: {
        slug,
        status: { in: ["PUBLISHED", "DRAFT"] },
      },
      include: testInclude,
    });
    return row ? prismaTestToStored(row) : null;
  } catch {
    return null;
  }
}

async function readTestsFromDir(dir: string): Promise<StoredTest[]> {
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    return await Promise.all(
      files.map(async (f) => {
        const raw = await readFile(path.join(dir, f), "utf8");
        return JSON.parse(raw) as StoredTest;
      }),
    );
  } catch {
    return [];
  }
}

/** Writable DATA_DIR first; on Vercel also merge bundled deploy artifact tests. */
async function listTestsFromFs(): Promise<StoredTest[]> {
  await ensureDirs();
  const bySlug = new Map<string, StoredTest>();

  const bundledSame =
    path.resolve(BUNDLED_TESTS_DIR) === path.resolve(TESTS_DIR);
  if (!bundledSame) {
    for (const t of await readTestsFromDir(BUNDLED_TESTS_DIR)) {
      bySlug.set(t.slug, t);
    }
  }
  for (const t of await readTestsFromDir(TESTS_DIR)) {
    bySlug.set(t.slug, t);
  }

  return [...bySlug.values()].sort((a, b) =>
    a.savedAt < b.savedAt ? 1 : -1,
  );
}

async function getTestFromFs(slug: string): Promise<StoredTest | null> {
  await ensureDirs();
  const candidates = [path.join(TESTS_DIR, `${slug}.json`)];
  if (path.resolve(BUNDLED_TESTS_DIR) !== path.resolve(TESTS_DIR)) {
    candidates.push(path.join(BUNDLED_TESTS_DIR, `${slug}.json`));
  }
  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as StoredTest;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function saveTestDraft(draft: ParsedTestDraft): Promise<StoredTest> {
  await ensureDirs();
  const stored: StoredTest = { ...draft, savedAt: new Date().toISOString() };
  const file = path.join(TESTS_DIR, `${draft.slug}.json`);
  await writeFile(file, JSON.stringify(stored, null, 2), "utf8");
  invalidateTestsCache();
  return stored;
}

export async function listTests(): Promise<StoredTest[]> {
  const now = Date.now();
  if (testsCache && now < testsCache.expiresAt) {
    return structuredClone(testsCache.data);
  }

  const fromDb = await listTestsFromPrisma();
  const tests = fromDb ?? (await listTestsFromFs());
  testsCache = {
    data: structuredClone(tests),
    expiresAt: now + TESTS_CACHE_TTL_MS,
  };
  return tests;
}

export async function getTestBySlug(slug: string): Promise<StoredTest | null> {
  const fromDb = await getTestFromPrisma(slug);
  if (fromDb) return fromDb;
  return getTestFromFs(slug);
}

function asStoredAttempt(value: Prisma.JsonValue | null | undefined): StoredAttempt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string" || typeof obj.testSlug !== "string") return null;
  if (obj.mode !== "PRACTICE" && obj.mode !== "FULL") return null;
  if (!Array.isArray(obj.sectionOrders)) return null;
  if (typeof obj.startedAt !== "string") return null;
  if (typeof obj.answers !== "object" || obj.answers === null || Array.isArray(obj.answers)) {
    return null;
  }
  return value as unknown as StoredAttempt;
}

function attemptScoreFields(attempt: StoredAttempt): {
  scoreRaw: number | null;
  scoreBand: number | null;
} {
  return {
    scoreRaw:
      attempt.score && typeof attempt.score.correct === "number"
        ? attempt.score.correct
        : null,
    scoreBand:
      attempt.aiScore && typeof attempt.aiScore.overallBand === "number"
        ? attempt.aiScore.overallBand
        : null,
  };
}

/** Prefer a real User FK; keep guest / unknown ids only inside payload JSON. */
async function resolvePrismaUserId(
  userId: string | null | undefined,
): Promise<string | null> {
  if (!userId) return null;
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return row?.id ?? null;
  } catch {
    return null;
  }
}

async function createAttemptInPrisma(
  attempt: StoredAttempt,
): Promise<boolean> {
  if (!(await canUsePrisma())) return false;
  try {
    const test = await prisma.test.findFirst({
      where: { slug: attempt.testSlug },
      select: { id: true },
    });
    if (!test) return false;

    const userId = await resolvePrismaUserId(attempt.userId);
    const { scoreRaw, scoreBand } = attemptScoreFields(attempt);

    await prisma.attempt.create({
      data: {
        id: attempt.id,
        userId,
        testId: test.id,
        mode: attempt.mode,
        sectionIds: attempt.sectionOrders,
        timeLimitMinutes: attempt.timeLimitMinutes,
        startedAt: new Date(attempt.startedAt),
        finishedAt: attempt.finishedAt ? new Date(attempt.finishedAt) : null,
        scoreRaw,
        scoreBand,
        payload: attempt as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function getAttemptFromPrisma(id: string): Promise<StoredAttempt | null> {
  if (!(await canUsePrisma())) return null;
  try {
    const row = await prisma.attempt.findUnique({
      where: { id },
      include: { test: { select: { slug: true } } },
    });
    if (!row) return null;

    const fromPayload = asStoredAttempt(row.payload);
    if (fromPayload) {
      return {
        ...fromPayload,
        id: row.id,
        testSlug: fromPayload.testSlug || row.test.slug,
        finishedAt:
          fromPayload.finishedAt ??
          (row.finishedAt ? row.finishedAt.toISOString() : null),
      };
    }

    // Legacy Prisma rows without practice payload
    const sectionOrders = Array.isArray(row.sectionIds)
      ? row.sectionIds.filter((n): n is number => typeof n === "number")
      : [];
    return {
      id: row.id,
      testSlug: row.test.slug,
      userId: row.userId,
      mode: row.mode,
      sectionOrders,
      timeLimitMinutes: row.timeLimitMinutes,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
      answers: {},
      score:
        row.scoreRaw != null
          ? { correct: row.scoreRaw, total: row.scoreRaw, percent: 0 }
          : undefined,
    };
  } catch {
    return null;
  }
}

async function saveAttemptInPrisma(attempt: StoredAttempt): Promise<boolean> {
  if (!(await canUsePrisma())) return false;
  try {
    const existing = await prisma.attempt.findUnique({
      where: { id: attempt.id },
      select: { id: true },
    });
    if (!existing) {
      return createAttemptInPrisma(attempt);
    }

    const userId = await resolvePrismaUserId(attempt.userId);
    const { scoreRaw, scoreBand } = attemptScoreFields(attempt);

    await prisma.attempt.update({
      where: { id: attempt.id },
      data: {
        userId,
        mode: attempt.mode,
        sectionIds: attempt.sectionOrders,
        timeLimitMinutes: attempt.timeLimitMinutes,
        finishedAt: attempt.finishedAt ? new Date(attempt.finishedAt) : null,
        scoreRaw,
        scoreBand,
        payload: attempt as unknown as Prisma.InputJsonValue,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function deleteAttemptFromPrisma(id: string): Promise<boolean> {
  if (!(await canUsePrisma())) return false;
  try {
    await prisma.attempt.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

async function listAttemptsFromPrisma(options?: {
  userId?: string;
}): Promise<StoredAttempt[] | null> {
  if (!(await canUsePrisma())) return null;
  try {
    const rows = await prisma.attempt.findMany({
      where: options?.userId ? { userId: options.userId } : undefined,
      include: { test: { select: { slug: true } } },
      orderBy: { startedAt: "desc" },
    });

    const attempts: StoredAttempt[] = [];
    for (const row of rows) {
      const fromPayload = asStoredAttempt(row.payload);
      if (fromPayload) {
        attempts.push({
          ...fromPayload,
          id: row.id,
          testSlug: fromPayload.testSlug || row.test.slug,
        });
        continue;
      }
      const sectionOrders = Array.isArray(row.sectionIds)
        ? row.sectionIds.filter((n): n is number => typeof n === "number")
        : [];
      attempts.push({
        id: row.id,
        testSlug: row.test.slug,
        userId: row.userId,
        mode: row.mode,
        sectionOrders,
        timeLimitMinutes: row.timeLimitMinutes,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
        answers: {},
        score:
          row.scoreRaw != null
            ? { correct: row.scoreRaw, total: row.scoreRaw, percent: 0 }
            : undefined,
      });
    }
    return attempts;
  } catch {
    return null;
  }
}

async function createAttemptOnFs(attempt: StoredAttempt): Promise<void> {
  await ensureDirs();
  await writeFile(
    path.join(ATTEMPTS_DIR, `${attempt.id}.json`),
    JSON.stringify(attempt, null, 2),
    "utf8",
  );
}

async function getAttemptFromFs(id: string): Promise<StoredAttempt | null> {
  await ensureDirs();
  try {
    const raw = await readFile(path.join(ATTEMPTS_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredAttempt;
  } catch {
    return null;
  }
}

async function saveAttemptOnFs(attempt: StoredAttempt): Promise<void> {
  await ensureDirs();
  await writeFile(
    path.join(ATTEMPTS_DIR, `${attempt.id}.json`),
    JSON.stringify(attempt, null, 2),
    "utf8",
  );
}

async function deleteAttemptFromFs(id: string): Promise<boolean> {
  await ensureDirs();
  try {
    await unlink(path.join(ATTEMPTS_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

async function listAttemptsFromFs(options?: {
  userId?: string;
}): Promise<StoredAttempt[]> {
  await ensureDirs();
  const files = await readdir(ATTEMPTS_DIR);
  const attempts: StoredAttempt[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await readFile(path.join(ATTEMPTS_DIR, f), "utf8");
    attempts.push(JSON.parse(raw) as StoredAttempt);
  }
  let list = attempts.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  if (options?.userId) {
    list = list.filter((a) => a.userId === options.userId);
  }
  return list;
}

export async function createAttempt(input: {
  testSlug: string;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  questionNumbers?: number[];
  speakingPartKinds?: number[];
  timeLimitMinutes: number | null;
  userId?: string | null;
}): Promise<StoredAttempt> {
  const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const attempt: StoredAttempt = {
    id,
    testSlug: input.testSlug,
    userId: input.userId ?? null,
    mode: input.mode,
    sectionOrders: input.sectionOrders,
    questionNumbers: input.questionNumbers?.length
      ? [...input.questionNumbers]
      : undefined,
    speakingPartKinds: input.speakingPartKinds?.length
      ? [...input.speakingPartKinds]
      : undefined,
    timeLimitMinutes: input.timeLimitMinutes,
    startedAt: now,
    updatedAt: now,
    finishedAt: null,
    answers: {},
  };

  // Durable path on Vercel/Neon; FS remains local/dev fallback (+ dual-write when DB works).
  const wroteDb = await createAttemptInPrisma(attempt);
  if (wroteDb) {
    // Best-effort local mirror for same-instance continuity in long-lived Node.
    try {
      await createAttemptOnFs(attempt);
    } catch {
      /* ignore — DB is source of truth */
    }
    return attempt;
  }

  // On Vercel, /tmp is not shared across serverless instances — never return an
  // att_* that only exists on this instance's disk.
  if (isVercel) {
    throw new Error(
      "Không lưu được bài làm vào database. Kiểm tra Neon (DATABASE_URL) và thử lại.",
    );
  }

  await createAttemptOnFs(attempt);
  return attempt;
}

export async function getAttempt(id: string): Promise<StoredAttempt | null> {
  const fromDb = await getAttemptFromPrisma(id);
  if (fromDb) return fromDb;
  return getAttemptFromFs(id);
}

export async function saveAttempt(attempt: StoredAttempt): Promise<void> {
  attempt.updatedAt = new Date().toISOString();
  const wroteDb = await saveAttemptInPrisma(attempt);
  if (!wroteDb) {
    await saveAttemptOnFs(attempt);
    return;
  }
  try {
    await saveAttemptOnFs(attempt);
  } catch {
    /* ignore — DB is source of truth */
  }
}

/** Remove an open attempt so it does not appear in history. */
export async function deleteAttempt(id: string): Promise<boolean> {
  const deletedDb = await deleteAttemptFromPrisma(id);
  const deletedFs = await deleteAttemptFromFs(id);
  return deletedDb || deletedFs;
}

function sameNumberSet(a: number[] | undefined, b: number[] | undefined): boolean {
  const left = [...(a ?? [])].sort((x, y) => x - y);
  const right = [...(b ?? [])].sort((x, y) => x - y);
  if (left.length !== right.length) return false;
  return left.every((v, i) => v === right[i]);
}

export async function findOpenAttempt(input: {
  testSlug: string;
  userId: string;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  questionNumbers?: number[];
  speakingPartKinds?: number[];
}): Promise<StoredAttempt | null> {
  const list = await listAttempts({ userId: input.userId });
  return (
    list.find(
      (a) =>
        !a.finishedAt &&
        a.testSlug === input.testSlug &&
        a.mode === input.mode &&
        a.userId === input.userId &&
        sameNumberSet(a.sectionOrders, input.sectionOrders) &&
        sameNumberSet(a.questionNumbers, input.questionNumbers) &&
        sameNumberSet(a.speakingPartKinds, input.speakingPartKinds),
    ) ?? null
  );
}

export async function listAttempts(options?: {
  userId?: string;
}): Promise<StoredAttempt[]> {
  const fromDb = await listAttemptsFromPrisma(options);
  const fromFs = await listAttemptsFromFs(options);

  if (!fromDb) return fromFs;

  const byId = new Map<string, StoredAttempt>();
  for (const a of fromFs) byId.set(a.id, a);
  for (const a of fromDb) byId.set(a.id, a); // Prisma wins
  return [...byId.values()].sort((a, b) =>
    a.startedAt < b.startedAt ? 1 : -1,
  );
}
