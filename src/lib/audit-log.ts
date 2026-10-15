import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/auth/permissions";

export type AuditAction = "LOGIN" | "LOGOUT" | "TEST_START" | "USER_CREATE" | "USER_UPDATE" | "USER_PASSWORD_RESET" | "USER_ACCESS_UPDATE" | "USER_DELETE";

export type AuditActor = {
  id: string;
  username: string;
  fullName: string | null;
  role: AppRole;
};

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
        ipAddress: null,
        userAgent: null,
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
          ],
        }
      : {}),
  };

  if (!(await canUsePrisma())) {
    return { items: [], total: 0, page, pageSize, databaseAvailable: false };
  }

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, pageSize, databaseAvailable: true };
}
