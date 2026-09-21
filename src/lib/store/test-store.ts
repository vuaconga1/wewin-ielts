import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedTestDraft } from "@/lib/import/schemas";
import type { StoredAiScore } from "@/lib/ai/types";
import { BUNDLED_DATA_DIR, DATA_DIR } from "@/lib/paths";
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

/** Short in-memory TTL to avoid readdir+N reads on home/tests pages. */
const TESTS_CACHE_TTL_MS = 5_000;

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

const testInclude = {
  sections: {
    include: {
      questions: { include: { answerKey: true as const } },
    },
  },
  media: true,
} satisfies Prisma.TestInclude;

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

function prismaTestToStored(test: PrismaTestFull): StoredTest {
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
          .map((q) => ({
            number: q.number,
            order: q.order,
            type: q.type,
            content: contentRecord(q.content),
            mediaUrl: q.mediaUrl ?? undefined,
            correctAnswer: q.answerKey?.correctAnswer ?? undefined,
            acceptableAnswers: acceptableList(q.answerKey?.acceptableAnswers),
            explanation: q.answerKey?.explanation ?? undefined,
          })),
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
      include: testInclude,
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

export async function createAttempt(input: {
  testSlug: string;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  questionNumbers?: number[];
  speakingPartKinds?: number[];
  timeLimitMinutes: number | null;
  userId?: string | null;
}): Promise<StoredAttempt> {
  await ensureDirs();
  const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finishedAt: null,
    answers: {},
  };
  await writeFile(
    path.join(ATTEMPTS_DIR, `${id}.json`),
    JSON.stringify(attempt, null, 2),
    "utf8",
  );
  return attempt;
}

export async function getAttempt(id: string): Promise<StoredAttempt | null> {
  await ensureDirs();
  try {
    const raw = await readFile(path.join(ATTEMPTS_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredAttempt;
  } catch {
    return null;
  }
}

export async function saveAttempt(attempt: StoredAttempt): Promise<void> {
  await ensureDirs();
  attempt.updatedAt = new Date().toISOString();
  await writeFile(
    path.join(ATTEMPTS_DIR, `${attempt.id}.json`),
    JSON.stringify(attempt, null, 2),
    "utf8",
  );
}

/** Remove an open attempt so it does not appear in history. */
export async function deleteAttempt(id: string): Promise<boolean> {
  await ensureDirs();
  try {
    await unlink(path.join(ATTEMPTS_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
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
