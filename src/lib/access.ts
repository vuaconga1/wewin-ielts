import { canUsePrisma } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { findLocalUserById } from "@/lib/store/user-store";

export type AccessPlan = "FREE" | "PAID" | "UNLIMITED";
export type AccessStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "UNLIMITED";
export const FREE_ACCESS_DAYS = 7;

export function freeAccessExpiry(from = new Date()): Date {
  return new Date(from.getTime() + FREE_ACCESS_DAYS * 86_400_000);
}

export function accessStatus(plan: AccessPlan, expiresAt: Date | string | null, now = new Date()): AccessStatus {
  if (plan === "UNLIMITED") return "UNLIMITED";
  if (!expiresAt || new Date(expiresAt).getTime() <= now.getTime()) return "EXPIRED";
  return new Date(expiresAt).getTime() - now.getTime() <= 7 * 86_400_000 ? "EXPIRING" : "ACTIVE";
}

export function addCalendarMonths(base: Date, months: number): Date {
  const result = new Date(base);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export async function getUserAccess(userId: string) {
  if (await canUsePrisma()) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accessPlan: true, accessStartsAt: true, accessExpiresAt: true },
    });
    if (!user) return null;
    return { ...user, status: user.role === "STUDENT" ? accessStatus(user.accessPlan, user.accessExpiresAt) : "UNLIMITED" as const };
  }
  const user = await findLocalUserById(userId);
  if (!user) return null;
  const plan = user.accessPlan ?? (user.role === "STUDENT" ? "FREE" : "UNLIMITED");
  const expiresAt = user.accessExpiresAt ?? null;
  return {
    role: user.role,
    accessPlan: plan,
    accessStartsAt: user.accessStartsAt ? new Date(user.accessStartsAt) : new Date(user.createdAt),
    accessExpiresAt: expiresAt ? new Date(expiresAt) : null,
    status: user.role === "STUDENT" ? accessStatus(plan, expiresAt) : "UNLIMITED" as const,
  };
}

export async function canUseLearningFeatures(userId: string): Promise<boolean> {
  const access = await getUserAccess(userId);
  return Boolean(access && access.status !== "EXPIRED");
}
