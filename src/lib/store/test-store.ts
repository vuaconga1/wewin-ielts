import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedTestDraft } from "@/lib/import/schemas";
import { DATA_DIR } from "@/lib/paths";

const TESTS_DIR = path.join(DATA_DIR, "tests");
const ATTEMPTS_DIR = path.join(DATA_DIR, "attempts");

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

  await ensureDirs();
  const files = (await readdir(TESTS_DIR)).filter((f) => f.endsWith(".json"));
  const tests = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(path.join(TESTS_DIR, f), "utf8");
      return JSON.parse(raw) as StoredTest;
    }),
  );
  tests.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  testsCache = {
    data: structuredClone(tests),
    expiresAt: now + TESTS_CACHE_TTL_MS,
  };
  return tests;
}

export async function getTestBySlug(slug: string): Promise<StoredTest | null> {
  await ensureDirs();
  try {
    const raw = await readFile(path.join(TESTS_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw) as StoredTest;
  } catch {
    return null;
  }
}

export async function createAttempt(input: {
  testSlug: string;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  questionNumbers?: number[];
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
        sameNumberSet(a.questionNumbers, input.questionNumbers),
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
