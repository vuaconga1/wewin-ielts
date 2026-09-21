/**
 * Admin attempt history — Prisma when available, local JSON fallback.
 * Practice flow currently writes local attempts; Prisma path covers DB-backed rows.
 */

import { canUsePrisma } from "@/lib/db";
import { practicePath } from "@/lib/practice/paths";
import { prisma } from "@/lib/prisma";
import {
  listAttempts,
  listTests,
  type StoredAttempt,
} from "@/lib/store/test-store";
import { listLocalUsers } from "@/lib/store/user-store";

export type AdminAttemptSkill =
  | "LISTENING"
  | "READING"
  | "WRITING"
  | "SPEAKING";

export type AdminAttemptFilters = {
  userId?: string;
  /** Reserved for class filter (data wired later). */
  classId?: string;
  skill?: AdminAttemptSkill | "ALL";
  /** Exact test slug when selected from dropdown. */
  testSlug?: string;
  status?: "ALL" | "FINISHED" | "UNFINISHED";
  from?: string;
  to?: string;
  limit?: number;
};

export type AdminAttemptRow = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  username: string | null;
  userRole: "ADMIN" | "STUDENT" | null;
  testSlug: string;
  testTitle: string;
  skill: AdminAttemptSkill | null;
  mode: "PRACTICE" | "FULL";
  scoreLabel: string | null;
  scoreBand: number | null;
  startedAt: string;
  finishedAt: string | null;
  status: "FINISHED" | "UNFINISHED";
  resultHref: string;
  source: "prisma" | "local";
};

export type AdminUserOption = {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "STUDENT";
  attemptCount: number;
};

export type AdminTestOption = {
  slug: string;
  title: string;
  skill: AdminAttemptSkill | null;
};

/** Placeholder until class / cohort data exists on users. */
export type AdminClassOption = {
  id: string;
  name: string;
};

export type AdminAttemptsResult = {
  attempts: AdminAttemptRow[];
  users: AdminUserOption[];
  tests: AdminTestOption[];
  classes: AdminClassOption[];
  total: number;
  source: "prisma" | "local" | "mixed";
};

const SKILLS = new Set<string>([
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
]);

function parseSkill(raw?: string): AdminAttemptSkill | "ALL" | undefined {
  if (!raw || raw === "ALL") return "ALL";
  const upper = raw.toUpperCase();
  if (SKILLS.has(upper)) return upper as AdminAttemptSkill;
  return undefined;
}

function parseStatus(
  raw?: string,
): "ALL" | "FINISHED" | "UNFINISHED" | undefined {
  if (!raw || raw === "ALL") return "ALL";
  const upper = raw.toUpperCase();
  if (upper === "FINISHED" || upper === "UNFINISHED") return upper;
  return undefined;
}

export function normalizeAdminAttemptFilters(
  input: Record<string, string | undefined>,
): AdminAttemptFilters {
  const skill = parseSkill(input.skill);
  const status = parseStatus(input.status);
  const limitRaw = input.limit ? Number(input.limit) : 200;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), 500)
    : 200;

  return {
    userId: input.userId?.trim() || undefined,
    classId: input.classId?.trim() || undefined,
    skill: skill ?? "ALL",
    testSlug:
      input.testSlug?.trim() ||
      input.testQ?.trim() ||
      undefined,
    status: status ?? "ALL",
    from: input.from?.trim() || undefined,
    to: input.to?.trim() || undefined,
    limit,
  };
}

function matchesDateRange(
  startedAt: string,
  from?: string,
  to?: string,
): boolean {
  const t = Date.parse(startedAt);
  if (Number.isNaN(t)) return true;
  if (from) {
    const fromMs = Date.parse(from);
    if (!Number.isNaN(fromMs) && t < fromMs) return false;
  }
  if (to) {
    const toMs = Date.parse(to);
    // Treat bare YYYY-MM-DD as inclusive end-of-day
    if (!Number.isNaN(toMs)) {
      const end = /^\d{4}-\d{2}-\d{2}$/.test(to)
        ? toMs + 24 * 60 * 60 * 1000 - 1
        : toMs;
      if (t > end) return false;
    }
  }
  return true;
}

function scoreLabelFromLocal(a: StoredAttempt): string | null {
  if (a.score) {
    return `${a.score.correct}/${a.score.total} (${a.score.percent}%)`;
  }
  return null;
}

function scoreLabelFromPrisma(
  scoreRaw: number | null,
  scoreBand: number | null,
): string | null {
  if (scoreRaw != null && scoreBand != null) {
    return `${scoreRaw} · band ${scoreBand}`;
  }
  if (scoreBand != null) return `Band ${scoreBand}`;
  if (scoreRaw != null) return String(scoreRaw);
  return null;
}

function applyRowFilters(
  rows: AdminAttemptRow[],
  filters: AdminAttemptFilters,
): AdminAttemptRow[] {
  return rows.filter((row) => {
    if (filters.userId && row.userId !== filters.userId) return false;
    if (filters.skill && filters.skill !== "ALL" && row.skill !== filters.skill) {
      return false;
    }
    if (filters.status === "FINISHED" && row.status !== "FINISHED") return false;
    if (filters.status === "UNFINISHED" && row.status !== "UNFINISHED") {
      return false;
    }
    // classId reserved — no class data yet; ignore until wired
    if (filters.testSlug && row.testSlug !== filters.testSlug) return false;
    if (!matchesDateRange(row.startedAt, filters.from, filters.to)) {
      return false;
    }
    return true;
  });
}

type UserLite = {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "STUDENT";
};

async function loadUserMap(): Promise<Map<string, UserLite>> {
  const map = new Map<string, UserLite>();

  if (await canUsePrisma()) {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true },
      orderBy: { email: "asc" },
    });
    for (const u of users) {
      map.set(u.id, {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
      });
    }
  }

  const local = await listLocalUsers();
  for (const u of local) {
    if (!map.has(u.id)) {
      map.set(u.id, {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
      });
    }
  }

  return map;
}

async function loadLocalAttemptsAsRows(
  userMap: Map<string, UserLite>,
): Promise<AdminAttemptRow[]> {
  const [attempts, tests] = await Promise.all([listAttempts(), listTests()]);
  const testBySlug = new Map(tests.map((t) => [t.slug, t]));

  return attempts.map((a) => {
    const test = testBySlug.get(a.testSlug);
    const user = a.userId ? userMap.get(a.userId) : undefined;
    const finished = Boolean(a.finishedAt);
    return {
      id: a.id,
      userId: a.userId ?? null,
      userEmail: user?.email ?? null,
      username: user?.username ?? null,
      userRole: user?.role ?? null,
      testSlug: a.testSlug,
      testTitle: test?.title ?? a.testSlug,
      skill: (test?.skill as AdminAttemptSkill | undefined) ?? null,
      mode: a.mode,
      scoreLabel: scoreLabelFromLocal(a),
      scoreBand: null,
      startedAt: a.startedAt,
      finishedAt: a.finishedAt,
      status: finished ? ("FINISHED" as const) : ("UNFINISHED" as const),
      resultHref: practicePath(a.testSlug, a.id, finished),
      source: "local" as const,
    };
  });
}

async function loadPrismaAttemptsAsRows(
  userMap: Map<string, UserLite>,
): Promise<AdminAttemptRow[]> {
  const attempts = await prisma.attempt.findMany({
    include: {
      user: {
        select: { id: true, email: true, username: true, role: true },
      },
      test: {
        select: { slug: true, title: true, skill: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return attempts.map((a) => {
    const user =
      a.user ??
      (a.userId ? userMap.get(a.userId) : undefined) ??
      null;
    const finished = Boolean(a.finishedAt);
    return {
      id: a.id,
      userId: a.userId,
      userEmail: user?.email ?? null,
      username: user?.username ?? null,
      userRole: user?.role ?? null,
      testSlug: a.test.slug,
      testTitle: a.test.title,
      skill: a.test.skill as AdminAttemptSkill,
      mode: a.mode,
      scoreLabel: scoreLabelFromPrisma(a.scoreRaw, a.scoreBand),
      scoreBand: a.scoreBand,
      startedAt: a.startedAt.toISOString(),
      finishedAt: a.finishedAt?.toISOString() ?? null,
      status: finished ? ("FINISHED" as const) : ("UNFINISHED" as const),
      resultHref: practicePath(a.test.slug, a.id, finished),
      source: "prisma" as const,
    };
  });
}

function mergeAttemptRows(
  prismaRows: AdminAttemptRow[],
  localRows: AdminAttemptRow[],
): { rows: AdminAttemptRow[]; source: "prisma" | "local" | "mixed" } {
  const byId = new Map<string, AdminAttemptRow>();
  for (const row of localRows) byId.set(row.id, row);
  for (const row of prismaRows) byId.set(row.id, row); // Prisma wins

  const rows = [...byId.values()].sort((a, b) =>
    a.startedAt < b.startedAt ? 1 : -1,
  );

  const hasPrisma = prismaRows.length > 0;
  const hasLocalOnly = localRows.some(
    (r) => !prismaRows.some((p) => p.id === r.id),
  );

  let source: "prisma" | "local" | "mixed" = "local";
  if (hasPrisma && hasLocalOnly) source = "mixed";
  else if (hasPrisma) source = "prisma";

  return { rows, source };
}

function buildUserOptions(
  allRows: AdminAttemptRow[],
  userMap: Map<string, UserLite>,
): AdminUserOption[] {
  const counts = new Map<string, number>();
  for (const row of allRows) {
    if (!row.userId) continue;
    counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
  }

  const options: AdminUserOption[] = [];
  for (const user of userMap.values()) {
    options.push({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      attemptCount: counts.get(user.id) ?? 0,
    });
  }

  // Guest / unknown userIds that appear on attempts
  for (const [userId, count] of counts) {
    if (userMap.has(userId)) continue;
    options.push({
      id: userId,
      email: "(không rõ)",
      username: userId.slice(0, 12),
      role: "STUDENT",
      attemptCount: count,
    });
  }

  options.sort((a, b) => {
    if (b.attemptCount !== a.attemptCount) return b.attemptCount - a.attemptCount;
    return a.email.localeCompare(b.email);
  });
  return options;
}

function buildTestOptions(allRows: AdminAttemptRow[]): AdminTestOption[] {
  const bySlug = new Map<string, AdminTestOption>();
  for (const row of allRows) {
    if (!row.testSlug) continue;
    if (bySlug.has(row.testSlug)) continue;
    bySlug.set(row.testSlug, {
      slug: row.testSlug,
      title: row.testTitle || row.testSlug,
      skill: row.skill,
    });
  }
  return [...bySlug.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "vi"),
  );
}

/** List attempts for admin UI / API with filters. */
export async function listAdminAttempts(
  filters: AdminAttemptFilters = {},
): Promise<AdminAttemptsResult> {
  const userMap = await loadUserMap();
  const localRows = await loadLocalAttemptsAsRows(userMap);

  let prismaRows: AdminAttemptRow[] = [];
  if (await canUsePrisma()) {
    try {
      prismaRows = await loadPrismaAttemptsAsRows(userMap);
    } catch {
      prismaRows = [];
    }
  }

  const { rows: allRows, source } = mergeAttemptRows(prismaRows, localRows);
  const users = buildUserOptions(allRows, userMap);

  // Prefer catalog titles from listTests so dropdown shows all known tests,
  // then merge any attempt-only slugs.
  const catalog = await listTests();
  const testsMap = new Map<string, AdminTestOption>();
  for (const t of catalog) {
    testsMap.set(t.slug, {
      slug: t.slug,
      title: t.title,
      skill: (t.skill as AdminAttemptSkill) ?? null,
    });
  }
  for (const opt of buildTestOptions(allRows)) {
    if (!testsMap.has(opt.slug)) testsMap.set(opt.slug, opt);
  }
  const tests = [...testsMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "vi"),
  );

  // Class options stub — fill when class field exists on users / enrollment.
  const classes: AdminClassOption[] = [];

  const filtered = applyRowFilters(allRows, filters);
  const limit = filters.limit ?? 200;

  return {
    attempts: filtered.slice(0, limit),
    users,
    tests,
    classes,
    total: filtered.length,
    source,
  };
}
