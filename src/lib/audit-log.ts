import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth/permissions";
import { describeDevice } from "@/lib/audit-device";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "TEST_START"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_PASSWORD_RESET"
  | "USER_ACCESS_UPDATE"
  | "USER_DELETE"
  | "CLASSROOM_JOIN"
  | "CLASSROOM_HOST_START"
  | "CLASSROOM_PRESENTATION_UPDATE"
  | "CLASSROOM_CREATE"
  | "CLASSROOM_UPDATE"
  | "CLASSROOM_MEMBERS_UPDATE"
  | "CLASS_SESSION_CREATE"
  | "CLASS_SESSION_UPDATE"
  | "CLASS_SESSION_DELETE"
  | "ZOOM_ACCOUNT_CREATE"
  | "ZOOM_ACCOUNT_UPDATE"
  | "ZOOM_ACCOUNT_DELETE"
  | "ZOOM_HOST_LINK"
  | "ZOOM_HOST_UNLINK";

export type AuditActor = {
  id: string;
  username: string;
  fullName: string | null;
  role: AppRole;
};

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null
  );
}

/** Authentication must still work if audit persistence is temporarily unavailable. */
export async function recordAuditEvent(input: {
  actor: AuditActor;
  action: AuditAction;
  request: Request;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  try {
    if (!(await canUsePrisma())) return;
    await prisma.auditLog.create({
      data: {
        userId: input.actor.id,
        username: input.actor.username,
        fullName: input.actor.fullName,
        role: input.actor.role,
        action: input.action,
        ipAddress: requestIp(input.request),
        userAgent: input.request.headers.get("user-agent")?.slice(0, 2000) ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    console.error("[audit-log] Could not persist event", error);
  }
}

export type AuditLogFilters = {
  from?: string;
  to?: string;
  role?: AppRole | "";
  action?: AuditAction | "";
  query?: string;
  page?: number;
  pageSize?: number;
};

function bangkokDay(value: string, endExclusive = false): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endExclusive) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export async function listAuditLogs(filters: AuditLogFilters) {
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 30));
  const page = Math.max(1, filters.page ?? 1);
  const query = filters.query?.trim().slice(0, 100);
  const from = filters.from ? bangkokDay(filters.from) : undefined;
  const to = filters.to ? bangkokDay(filters.to, true) : undefined;

  const where = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(from || to
      ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } }
      : {}),
    ...(query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" as const } },
            { fullName: { contains: query, mode: "insensitive" as const } },
            { ipAddress: { contains: query } },
          ],
        }
      : {}),
  };

  if (!(await canUsePrisma())) {
    return { items: [], total: 0, page, pageSize, databaseAvailable: false };
  }

  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const tests = await resolveTestStarts(rows);
  const items = rows.map((row) => ({
    ...row,
    device: describeDevice(row.userAgent),
    test: tests.get(row.id) ?? null,
  }));

  return { items, total, page, pageSize, databaseAvailable: true };
}

export type AuditTestRef = {
  slug: string;
  title: string | null;
  attemptId: string | null;
  finished: boolean;
  resumed: boolean;
};

type AuditRow = { id: string; userId: string | null; action: string; metadata: unknown; createdAt: Date };

function readMeta(metadata: unknown): { testSlug?: string; attemptId?: string; resumed: boolean } {
  const m = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  return {
    testSlug: typeof m.testSlug === "string" ? m.testSlug : undefined,
    attemptId: typeof m.attemptId === "string" ? m.attemptId : undefined,
    resumed: m.resumed === true,
  };
}

/**
 * Test title + attempt for each TEST_START row. Older rows were logged without
 * `attemptId`; for those, match the user's attempt on that test started around
 * the log time (any earlier start when the row was a resume).
 */
async function resolveTestStarts(rows: AuditRow[]): Promise<Map<string, AuditTestRef>> {
  const starts = rows
    .filter((r) => r.action === "TEST_START")
    .map((r) => ({ row: r, meta: readMeta(r.metadata) }))
    .filter((s): s is { row: AuditRow; meta: { testSlug: string; attemptId?: string; resumed: boolean } } =>
      typeof s.meta.testSlug === "string",
    );
  const out = new Map<string, AuditTestRef>();
  if (!starts.length) return out;

  const slugs = [...new Set(starts.map((s) => s.meta.testSlug))];
  const testRows = await prisma.test.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, title: true },
  });
  const testBySlug = new Map(testRows.map((t) => [t.slug, t]));

  const knownIds = starts.map((s) => s.meta.attemptId).filter((id): id is string => Boolean(id));
  const legacy = starts.filter((s) => !s.meta.attemptId && s.row.userId && testBySlug.has(s.meta.testSlug));
  const latest = legacy.length
    ? new Date(Math.max(...legacy.map((s) => s.row.createdAt.getTime())) + 60_000)
    : null;

  const attempts = !knownIds.length && !latest ? [] : await prisma.attempt.findMany({
    where: {
      OR: [
        ...(knownIds.length ? [{ id: { in: knownIds } }] : []),
        ...(latest
          ? [{
              userId: { in: [...new Set(legacy.map((s) => s.row.userId!))] },
              testId: { in: [...new Set(legacy.map((s) => testBySlug.get(s.meta.testSlug)!.id))] },
              startedAt: { lte: latest },
            }]
          : []),
      ],
    },
    select: { id: true, userId: true, testId: true, startedAt: true, finishedAt: true },
    orderBy: { startedAt: "desc" },
    take: 500,
  });
  const attemptById = new Map(attempts.map((a) => [a.id, a]));

  for (const { row, meta } of starts) {
    const test = testBySlug.get(meta.testSlug);
    const attempt = meta.attemptId
      ? attemptById.get(meta.attemptId)
      : test && row.userId
        ? attempts.find(
            (a) =>
              a.userId === row.userId &&
              a.testId === test.id &&
              a.startedAt.getTime() <= row.createdAt.getTime() + 60_000 &&
              (meta.resumed || a.startedAt.getTime() >= row.createdAt.getTime() - 120_000),
          )
        : undefined;
    out.set(row.id, {
      slug: meta.testSlug,
      title: test?.title ?? null,
      attemptId: attempt?.id ?? null,
      finished: Boolean(attempt?.finishedAt),
      resumed: meta.resumed,
    });
  }
  return out;
}
