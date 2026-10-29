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
  durationLabel: string;
  status: "FINISHED" | "UNFINISHED";
  resultHref: string;
};

export type UserTestSummary = {
  testSlug: string;
  testTitle: string;
  skill: string | null;
  /** Total number of attempts. */
  totalAttempts: number;
  /** Number of finished attempts. */
  finishedAttempts: number;
  /** Latest attempt info. */
  latestAttemptId: string;
  latestStatus: "FINISHED" | "UNFINISHED";
  latestStartedAt: string;
  latestFinishedAt: string | null;
  latestDurationLabel: string;
  latestCorrect: number | null;
  latestTotal: number | null;
  latestPercent: number | null;
  latestBand: number | null;
  latestResultHref: string;
  /** Best score across all finished attempts. */
  bestCorrect: number | null;
  bestTotal: number | null;
  bestPercent: number | null;
  bestBand: number | null;
  /** Total time spent across all attempts on this test. */
  totalTimeSeconds: number;
  totalTimeLabel: string;
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
    totalPracticeTimeLabel: string;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatDurationVi(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds} giây`);
  return parts.length > 0 ? parts.join(" ") : "0 giây";
}

function computeDurationSeconds(startedAt: string, finishedAt: string | null): number | null {
  if (!finishedAt) return null;
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

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
    const duration = computeDurationSeconds(a.startedAt, a.finishedAt);

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
      durationSeconds: duration,
      durationLabel: formatDurationVi(duration),
      status: finished ? "FINISHED" : "UNFINISHED",
      resultHref: practicePath(a.testSlug, a.id, finished),
    };
  });
}

function buildTestSummaries(attempts: UserAttemptEntry[]): UserTestSummary[] {
  // Group by testSlug
  const byTest = new Map<string, UserAttemptEntry[]>();
  for (const a of attempts) {
    const list = byTest.get(a.testSlug) ?? [];
    list.push(a);
    byTest.set(a.testSlug, list);
  }

  const summaries: UserTestSummary[] = [];

  for (const [testSlug, testAttempts] of byTest) {
    // Already sorted desc by startedAt
    const latestAttempt = testAttempts[0]!;

    const finished = testAttempts.filter((a) => a.finishedAt);
    // Find latest finished attempt (if any)
    const latestFinished = finished.length > 0 ? finished[0]! : null;

    // Use latest finished attempt for latest score if available, otherwise latest attempt
    const targetForLatest = latestFinished ?? latestAttempt;

    // Best score among finished attempts
    let bestCorrect: number | null = null;
    let bestTotal: number | null = null;
    let bestPercent: number | null = null;
    let bestBand: number | null = null;

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

    // Total practice time across attempts
    let totalTimeSeconds = 0;
    for (const a of testAttempts) {
      if (a.durationSeconds != null) {
        totalTimeSeconds += a.durationSeconds;
      }
    }

    summaries.push({
      testSlug,
      testTitle: testAttempts[0]?.testTitle ?? testSlug,
      skill: testAttempts[0]?.skill ?? null,
      totalAttempts: testAttempts.length,
      finishedAttempts: finished.length,
      latestAttemptId: targetForLatest.id,
      latestStatus: targetForLatest.status,
      latestStartedAt: targetForLatest.startedAt,
      latestFinishedAt: targetForLatest.finishedAt,
      latestDurationLabel: targetForLatest.durationLabel,
      latestCorrect: targetForLatest.scoreCorrect,
      latestTotal: targetForLatest.scoreTotal,
      latestPercent: targetForLatest.scorePercent,
      latestBand: targetForLatest.scoreBand,
      latestResultHref: targetForLatest.resultHref,
      bestCorrect,
      bestTotal,
      bestPercent,
      bestBand,
      totalTimeSeconds,
      totalTimeLabel: formatDurationVi(totalTimeSeconds),
    });
  }

  // Sort by most recently active test
  summaries.sort((a, b) => {
    const aTime = a.latestFinishedAt || a.latestStartedAt;
    const bTime = b.latestFinishedAt || b.latestStartedAt;
    return bTime.localeCompare(aTime);
  });

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
  const testSummaries = buildTestSummaries(attempts);

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
      totalPracticeTimeLabel: formatDurationVi(totalPracticeTimeSeconds),
    },
  };
}
