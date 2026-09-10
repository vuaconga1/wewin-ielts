/**
 * Leaderboard aggregation for scored Listening/Reading practice attempts.
 *
 * Scoring: points = number_of_correct_answers × POINTS_PER_CORRECT (wrong answers do not subtract).
 * Aggregation choice: SUM all completed attempts in the period (each finish counts),
 * not "best attempt per test" — simpler and rewards engagement.
 * Writing/Speaking (no scoreRaw / no local score) are skipped.
 */

import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { initialsFromName } from "@/lib/dashboard-stats";
import {
  listAttempts,
  listTests,
  type StoredAttempt,
} from "@/lib/store/test-store";
import { listLocalUsers } from "@/lib/store/user-store";
import type {
  RankingEntry,
  RankingPeriod,
  RankingResult,
} from "@/lib/ranking-shared";

export type {
  RankingEntry,
  RankingPeriod,
  RankingResult,
} from "@/lib/ranking-shared";
export {
  formatPoints,
  shiftDay,
  shiftMonth,
} from "@/lib/ranking-shared";

export const POINTS_PER_CORRECT = 5;

const VN_TZ = "Asia/Ho_Chi_Minh";

type ScoredAttemptRow = {
  id: string;
  userId: string;
  finishedAt: string;
  correct: number;
  skill: string | null;
};

type UserLite = {
  id: string;
  username: string;
};

function vnParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Calendar YYYY-MM-DD in VN timezone. */
function vnDateKey(date: Date): string {
  const { year, month, day } = vnParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseYmd(ymd: string): { year: number; month: number; day: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function addDaysYmd(ymd: string, delta: number): string {
  const { year, month, day } = parseYmd(ymd);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/** Monday-based week start (YYYY-MM-DD) for a VN calendar day. */
function weekStartYmd(ymd: string): string {
  const { year, month, day } = parseYmd(ymd);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekdaySun0 = utc.getUTCDay();
  const mondayOffset = weekdaySun0 === 0 ? 6 : weekdaySun0 - 1;
  return addDaysYmd(ymd, -mondayOffset);
}

/**
 * Instant range in UTC for a VN calendar day [start, end).
 * Uses noon-UTC anchors so DST-free VN offsets stay stable.
 */
function vnDayBounds(ymd: string): { start: Date; end: Date } {
  const start = new Date(`${ymd}T00:00:00+07:00`);
  const end = new Date(`${addDaysYmd(ymd, 1)}T00:00:00+07:00`);
  return { start, end };
}

function isScoredSkill(skill: string | null | undefined): boolean {
  return skill === "LISTENING" || skill === "READING";
}

function pointsFromCorrect(correct: number): number {
  return Math.max(0, Math.trunc(correct)) * POINTS_PER_CORRECT;
}

async function loadUserMap(): Promise<Map<string, UserLite>> {
  const map = new Map<string, UserLite>();

  if (await canUsePrisma()) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true },
      });
      for (const u of users) {
        map.set(u.id, { id: u.id, username: u.username });
      }
    } catch {
      /* ignore — fall through to local */
    }
  }

  const local = await listLocalUsers();
  for (const u of local) {
    if (!map.has(u.id)) {
      map.set(u.id, { id: u.id, username: u.username });
    }
  }

  return map;
}

async function loadLocalScoredAttempts(): Promise<ScoredAttemptRow[]> {
  const [attempts, tests] = await Promise.all([listAttempts(), listTests()]);
  const testBySlug = new Map(tests.map((t) => [t.slug, t]));
  const rows: ScoredAttemptRow[] = [];

  for (const a of attempts) {
    const row = localAttemptToScored(a, testBySlug.get(a.testSlug)?.skill ?? null);
    if (row) rows.push(row);
  }
  return rows;
}

function localAttemptToScored(
  a: StoredAttempt,
  skill: string | null,
): ScoredAttemptRow | null {
  if (!a.userId || !a.finishedAt) return null;
  if (a.score == null || typeof a.score.correct !== "number") return null;
  if (!isScoredSkill(skill)) return null;
  return {
    id: a.id,
    userId: a.userId,
    finishedAt: a.finishedAt,
    correct: a.score.correct,
    skill,
  };
}

async function loadPrismaScoredAttempts(): Promise<ScoredAttemptRow[]> {
  const attempts = await prisma.attempt.findMany({
    where: {
      finishedAt: { not: null },
      userId: { not: null },
      scoreRaw: { not: null },
      test: { skill: { in: ["LISTENING", "READING"] } },
    },
    select: {
      id: true,
      userId: true,
      finishedAt: true,
      scoreRaw: true,
      test: { select: { skill: true } },
    },
  });

  const rows: ScoredAttemptRow[] = [];
  for (const a of attempts) {
    if (!a.userId || !a.finishedAt || a.scoreRaw == null) continue;
    rows.push({
      id: a.id,
      userId: a.userId,
      finishedAt: a.finishedAt.toISOString(),
      correct: a.scoreRaw,
      skill: a.test.skill,
    });
  }
  return rows;
}

function mergeScoredAttempts(
  prismaRows: ScoredAttemptRow[],
  localRows: ScoredAttemptRow[],
): ScoredAttemptRow[] {
  const byId = new Map<string, ScoredAttemptRow>();
  for (const row of localRows) byId.set(row.id, row);
  for (const row of prismaRows) byId.set(row.id, row); // Prisma wins on id clash
  return [...byId.values()];
}

export type RankingQuery = {
  period?: string | null;
  year?: string | number | null;
  month?: string | number | null;
  day?: string | number | null;
  currentUserId?: string | null;
};

function clampInt(
  raw: string | number | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function normalizePeriod(raw?: string | null): RankingPeriod {
  const v = (raw ?? "month").toLowerCase();
  if (v === "day" || v === "week" || v === "month" || v === "all") return v;
  return "month";
}

function resolveAnchor(
  query: RankingQuery,
  now = new Date(),
): { period: RankingPeriod; year: number; month: number; day: number } {
  const today = vnParts(now);
  const period = normalizePeriod(query.period);
  const year = clampInt(query.year, today.year, 2000, 2100);
  const month = clampInt(query.month, today.month, 1, 12);
  const day = clampInt(query.day, today.day, 1, 31);
  // Clamp day to month length
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { period, year, month, day: Math.min(day, maxDay) };
}

function periodBounds(
  period: RankingPeriod,
  year: number,
  month: number,
  day: number,
): { start: Date | null; end: Date | null } {
  if (period === "all") return { start: null, end: null };

  const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (period === "day") {
    return vnDayBounds(ymd);
  }

  if (period === "week") {
    const startYmd = weekStartYmd(ymd);
    const endYmd = addDaysYmd(startYmd, 7);
    return {
      start: new Date(`${startYmd}T00:00:00+07:00`),
      end: new Date(`${endYmd}T00:00:00+07:00`),
    };
  }

  // month
  const startYmd = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endYmd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return {
    start: new Date(`${startYmd}T00:00:00+07:00`),
    end: new Date(`${endYmd}T00:00:00+07:00`),
  };
}

function inRange(
  finishedAt: string,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start && !end) return true;
  const t = Date.parse(finishedAt);
  if (Number.isNaN(t)) return false;
  if (start && t < start.getTime()) return false;
  if (end && t >= end.getTime()) return false;
  return true;
}

function aggregateEntries(
  rows: ScoredAttemptRow[],
  userMap: Map<string, UserLite>,
): RankingEntry[] {
  const totals = new Map<
    string,
    { points: number; attemptCount: number; username: string }
  >();

  for (const row of rows) {
    const user = userMap.get(row.userId);
    const username = user?.username ?? row.userId.slice(0, 12);
    const prev = totals.get(row.userId) ?? {
      points: 0,
      attemptCount: 0,
      username,
    };
    prev.points += pointsFromCorrect(row.correct);
    prev.attemptCount += 1;
    if (user?.username) prev.username = user.username;
    totals.set(row.userId, prev);
  }

  const sorted = [...totals.entries()].sort((a, b) => {
    if (b[1].points !== a[1].points) return b[1].points - a[1].points;
    if (b[1].attemptCount !== a[1].attemptCount) {
      return b[1].attemptCount - a[1].attemptCount;
    }
    return a[1].username.localeCompare(b[1].username);
  });

  return sorted.map(([userId, data], index) => ({
    rank: index + 1,
    userId,
    username: data.username,
    initials: initialsFromName(data.username),
    points: data.points,
    attemptCount: data.attemptCount,
  }));
}

/** Server-side ranking for API + page. */
export async function getRanking(query: RankingQuery = {}): Promise<RankingResult> {
  const now = new Date();
  const { period, year, month, day } = resolveAnchor(query, now);
  const { start, end } = periodBounds(period, year, month, day);

  const userMap = await loadUserMap();
  const localRows = await loadLocalScoredAttempts();

  let prismaRows: ScoredAttemptRow[] = [];
  if (await canUsePrisma()) {
    try {
      prismaRows = await loadPrismaScoredAttempts();
    } catch {
      prismaRows = [];
    }
  }

  const merged = mergeScoredAttempts(prismaRows, localRows);
  const inPeriod = merged.filter((r) => inRange(r.finishedAt, start, end));
  const entries = aggregateEntries(inPeriod, userMap);

  const currentUser =
    query.currentUserId != null
      ? (entries.find((e) => e.userId === query.currentUserId) ?? null)
      : null;

  return {
    period,
    year,
    month,
    day,
    rangeStart: start?.toISOString() ?? null,
    rangeEnd: end?.toISOString() ?? null,
    updatedAt: now.toISOString(),
    entries,
    currentUser,
  };
}

export { vnDateKey, weekStartYmd };
