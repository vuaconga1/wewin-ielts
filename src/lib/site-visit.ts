import { Prisma } from "@/generated/prisma/client";
import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth/permissions";

const VISIT_DEDUPE_MS = 30 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Analytics must never break page loads, so failures are swallowed. */
export async function recordSiteVisit(visitorId: string, userId: string | null): Promise<void> {
  try {
    if (!(await canUsePrisma())) return;
    const recent = await prisma.siteVisit.findFirst({
      where: { visitorId, createdAt: { gte: new Date(Date.now() - VISIT_DEDUPE_MS) } },
      select: { id: true },
    });
    if (recent) return;
    await prisma.siteVisit.create({ data: { visitorId, userId } });
  } catch (error) {
    console.error("[site-visit] Could not persist visit", error);
  }
}

/** Start of the current day, ISO week (Monday) and month in Asia/Bangkok, as UTC instants. */
export function bangkokPeriodStarts(now = new Date()) {
  const local = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const mondayOffset = (local.getUTCDay() + 6) % 7;
  return {
    day: new Date(Date.UTC(y, m, d) - BANGKOK_OFFSET_MS),
    week: new Date(Date.UTC(y, m, d - mondayOffset) - BANGKOK_OFFSET_MS),
    month: new Date(Date.UTC(y, m, 1) - BANGKOK_OFFSET_MS),
  };
}

export type PeriodCount = { day: number; week: number; month: number };

export type ActivitySummary = {
  loginUsers: PeriodCount;
  loginEvents: PeriodCount;
  testUsers: PeriodCount;
  testEvents: PeriodCount;
  visits: PeriodCount;
  visitors: PeriodCount;
};

type AuditRow = {
  login_users_day: bigint; login_users_week: bigint; login_users_month: bigint;
  login_events_day: bigint; login_events_week: bigint; login_events_month: bigint;
  test_users_day: bigint; test_users_week: bigint; test_users_month: bigint;
  test_events_day: bigint; test_events_week: bigint; test_events_month: bigint;
};

type VisitRow = {
  visits_day: bigint; visits_week: bigint; visits_month: bigint;
  visitors_day: bigint; visitors_week: bigint; visitors_month: bigint;
};

const n = (value: bigint | null | undefined) => Number(value ?? 0);

export async function getActivitySummary(role?: AppRole | ""): Promise<ActivitySummary | null> {
  if (!(await canUsePrisma())) return null;
  const { day, week, month } = bangkokPeriodStarts();
  const since = week < month ? week : month;
  const roleFilter = role ? Prisma.sql`AND "role" = ${role}::"Role"` : Prisma.empty;

  const [auditRows, visitRows] = await Promise.all([
    prisma.$queryRaw<AuditRow[]>`
      SELECT
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${day}) AS login_users_day,
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${week}) AS login_users_week,
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${month}) AS login_users_month,
        COUNT(*) FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${day}) AS login_events_day,
        COUNT(*) FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${week}) AS login_events_week,
        COUNT(*) FILTER (WHERE "action" = 'LOGIN' AND "createdAt" >= ${month}) AS login_events_month,
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${day}) AS test_users_day,
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${week}) AS test_users_week,
        COUNT(DISTINCT "userId") FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${month}) AS test_users_month,
        COUNT(*) FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${day}) AS test_events_day,
        COUNT(*) FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${week}) AS test_events_week,
        COUNT(*) FILTER (WHERE "action" = 'TEST_START' AND "createdAt" >= ${month}) AS test_events_month
      FROM "AuditLog"
      WHERE "createdAt" >= ${since} AND "action" IN ('LOGIN', 'TEST_START') ${roleFilter}
    `,
    prisma.$queryRaw<VisitRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${day}) AS visits_day,
        COUNT(*) FILTER (WHERE "createdAt" >= ${week}) AS visits_week,
        COUNT(*) FILTER (WHERE "createdAt" >= ${month}) AS visits_month,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "createdAt" >= ${day}) AS visitors_day,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "createdAt" >= ${week}) AS visitors_week,
        COUNT(DISTINCT "visitorId") FILTER (WHERE "createdAt" >= ${month}) AS visitors_month
      FROM "SiteVisit"
      WHERE "createdAt" >= ${since}
    `.catch((error) => {
      console.error("[site-visit] Could not read visit stats", error);
      return [] as VisitRow[];
    }),
  ]);

  const a = auditRows[0];
  const v = visitRows[0];
  return {
    loginUsers: { day: n(a?.login_users_day), week: n(a?.login_users_week), month: n(a?.login_users_month) },
    loginEvents: { day: n(a?.login_events_day), week: n(a?.login_events_week), month: n(a?.login_events_month) },
    testUsers: { day: n(a?.test_users_day), week: n(a?.test_users_week), month: n(a?.test_users_month) },
    testEvents: { day: n(a?.test_events_day), week: n(a?.test_events_week), month: n(a?.test_events_month) },
    visits: { day: n(v?.visits_day), week: n(v?.visits_week), month: n(v?.visits_month) },
    visitors: { day: n(v?.visitors_day), week: n(v?.visitors_week), month: n(v?.visitors_month) },
  };
}
