/**
 * Admin user detail report — login history + attempt history + test summary.
 * Extends the existing user report with per-user detail data.
 */

import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { listAttempts, listTests, type StoredTest } from "@/lib/store/test-store";
import { describeDevice } from "@/lib/audit-device";
import { getAdminUserReport, type UserReportRow } from "@/lib/admin/reports";
import { practicePath } from "@/lib/practice/paths";
import { toPublic } from "@/lib/admin/users";
import {
  attemptDurationSeconds,
  combineTestAttempts,
  type CombinedTestResult,
} from "@/lib/admin/test-progress";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserLoginEntry = {
  id: string;
  createdAt: string;
  ipAddress: string | null;
  device: string | null;
};

export type UserAttemptEntry = {
  id: string;
  testSlug: string;
  testTitle: string;
  skill: string | null;
  mode: "PRACTICE" | "FULL";
  scoreCorrect: number | null;
  scoreTotal: number | null;
  scorePercent: number | null;
  scoreBand: number | null;
  startedAt: string;
  finishedAt: string | null;
  /** Duration in seconds (null if not finished or invalid timestamps). */
  durationSeconds: number | null;
  status: "FINISHED" | "UNFINISHED";
  resultHref: string;
  /** Parts / passages in this attempt; empty = whole test. */
  sectionOrders: number[];
  /** Redo-wrong-answers attempt (subset of questions). */
  partial: boolean;
};

export type UserTestSummary = {
  testSlug: string;
  testTitle: string;
  skill: string | null;
  /** All part orders of the test (catalog). */
  sectionOrders: number[];
  /** Latest submission per part combined into one result for the test. */
  final: CombinedTestResult;
  latestResultHref: string;
  /** Best single-attempt score (whole-test attempts only). */
  bestCorrect: number | null;
  bestTotal: number | null;
  bestPercent: number | null;
  bestBand: number | null;
};

export type UserDetailReport = {
  user: UserReportRow["user"];
  report: UserReportRow | null;
  logins: UserLoginEntry[];
  attempts: UserAttemptEntry[];
  testSummaries: UserTestSummary[];
  stats: {
    totalTestsAttempted: number;
    totalAttempts: number;
    finishedAttempts: number;
    unfinishedAttempts: number;
    totalLogins: number;
    lastLoginAt: string | null;
    totalPracticeTimeSeconds: number;
  };
};

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------

async function loadUserLogins(userId: string): Promise<UserLoginEntry[]> {
  if (!(await canUsePrisma())) return [];
  try {
    const rows = await prisma.auditLog.findMany({
      where: { userId, action: "LOGIN" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });
    return rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      ipAddress: r.ipAddress,
      device: describeDevice(r.userAgent),
    }));
  } catch {
    return [];
  }
}

async function loadUserAttempts(
  userId: string,
  testBySlug: Map<string, StoredTest>,
): Promise<UserAttemptEntry[]> {
  const attempts = await listAttempts({ userId });

  // Sort descending by startedAt
  attempts.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return attempts.map((a) => {
    const test = testBySlug.get(a.testSlug);
    const finished = Boolean(a.finishedAt);

    return {
      id: a.id,
      testSlug: a.testSlug,
      testTitle: test?.title ?? a.testSlug,
      skill: (test?.skill as string) ?? null,
      mode: a.mode,
      scoreCorrect: a.score?.correct ?? null,
      scoreTotal: a.score?.total ?? null,
      scorePercent: a.score?.percent ?? null,
      scoreBand: a.aiScore?.overallBand ?? null,
      startedAt: a.startedAt,
      finishedAt: a.finishedAt,
      durationSeconds: attemptDurationSeconds(a.startedAt, a.finishedAt),
      status: finished ? "FINISHED" : "UNFINISHED",
      resultHref: practicePath(a.testSlug, a.id, finished),
      sectionOrders: a.sectionOrders ?? [],
      partial: Boolean(a.questionNumbers?.length),
    };
  });
}

function buildTestSummaries(
  attempts: UserAttemptEntry[],
  testBySlug: Map<string, StoredTest>,
): UserTestSummary[] {
  const byTest = new Map<string, UserAttemptEntry[]>();
  for (const a of attempts) {
    const list = byTest.get(a.testSlug) ?? [];
    list.push(a);
    byTest.set(a.testSlug, list);
  }

  const summaries: UserTestSummary[] = [];

  for (const [testSlug, testAttempts] of byTest) {
    const head = testAttempts[0]!;
    const sectionOrders =
      testBySlug.get(testSlug)?.parts.map((p) => p.order) ?? [];
    const final = combineTestAttempts(
      testAttempts.map((a) => ({
        id: a.id,
        status: a.status,
        startedAt: a.startedAt,
        finishedAt: a.finishedAt,
        sectionOrders: a.sectionOrders,
        partial: a.partial,
        scoreCorrect: a.scoreCorrect,
        scoreTotal: a.scoreTotal,
        scoreBand: a.scoreBand,
      })),
      head.skill,
      sectionOrders,
    );
    if (!final) continue;
    const latest =
      testAttempts.find((a) => a.id === final.latestAttemptId) ?? head;

    // Best single attempt that covered the whole test
    let bestCorrect: number | null = null;
    let bestTotal: number | null = null;
    let bestPercent: number | null = null;
    let bestBand: number | null = null;

    const allSections = new Set(sectionOrders);
    const finished = testAttempts.filter(
      (a) =>
        a.finishedAt &&
        !a.partial &&
        (!a.sectionOrders.length ||
          [...allSections].every((o) => a.sectionOrders.includes(o))),
    );
    for (const f of finished) {
      if (f.scorePercent != null) {
        if (bestPercent == null || f.scorePercent > bestPercent) {
          bestPercent = f.scorePercent;
          bestCorrect = f.scoreCorrect;
          bestTotal = f.scoreTotal;
        }
      } else if (f.scoreCorrect != null) {
        if (bestCorrect == null || f.scoreCorrect > bestCorrect) {
          bestCorrect = f.scoreCorrect;
          bestTotal = f.scoreTotal;
        }
      }
      if (f.scoreBand != null) {
        if (bestBand == null || f.scoreBand > bestBand) {
          bestBand = f.scoreBand;
        }
      }
    }

    summaries.push({
      testSlug,
      testTitle: head.testTitle,
      skill: head.skill,
      sectionOrders,
      final,
      latestResultHref: latest.resultHref,
      bestCorrect,
      bestTotal,
      bestPercent,
      bestBand,
    });
  }

  summaries.sort((a, b) =>
    b.final.lastActivityAt.localeCompare(a.final.lastActivityAt),
  );

  return summaries;
}

export async function getUserDetailReport(
  userId: string,
): Promise<UserDetailReport | null> {
  // 1. Load user info & base skills report
  let report: UserReportRow | null = null;
  try {
    report = await getAdminUserReport(userId);
  } catch {
    /* fallback to direct lookup below */
  }

  let user = report?.user ?? null;
  if (!user && (await canUsePrisma())) {
    const rawUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        classCode: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        accessPlan: true,
        accessStartsAt: true,
        accessExpiresAt: true,
      },
    });
    if (rawUser) {
      user = toPublic(rawUser);
    }
  }

  if (!user) return null;

  // 2. Load tests catalog for titles & skills
  const tests = await listTests();
  const testBySlug = new Map(tests.map((t) => [t.slug, t]));

  // 3. Load logins and attempts
  const [logins, attempts] = await Promise.all([
    loadUserLogins(userId),
    loadUserAttempts(userId, testBySlug),
  ]);

  // 4. Build summaries
  const testSummaries = buildTestSummaries(attempts, testBySlug);

  // 5. Compute global statistics
  const finishedAttempts = attempts.filter((a) => a.status === "FINISHED").length;
  const unfinishedAttempts = attempts.length - finishedAttempts;
  const totalPracticeTimeSeconds = attempts.reduce(
    (sum, a) => sum + (a.durationSeconds ?? 0),
    0,
  );

  return {
    user,
    report,
    logins,
    attempts,
    testSummaries,
    stats: {
      totalTestsAttempted: testSummaries.length,
      totalAttempts: attempts.length,
      finishedAttempts,
      unfinishedAttempts,
      totalLogins: logins.length,
      lastLoginAt: logins[0]?.createdAt ?? null,
      totalPracticeTimeSeconds,
    },
  };
}
