/**
 * Daily AI scoring quota: 1 Speaking + 1 Writing per user per day.
 * Admin (role ADMIN) is unlimited.
 * Calendar day uses Asia/Ho_Chi_Minh (UTC+7).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin, type RoleBearer } from "@/lib/auth/permissions";
import { DATA_DIR } from "@/lib/paths";
import type { AiQuotaDay, AiScoreSkill } from "@/lib/ai/types";

const QUOTA_DIR = path.join(DATA_DIR, "ai-quota");

export function vietnamCalendarDate(now = new Date()): string {
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function emptyQuota(date: string): AiQuotaDay {
  return { date, speaking: false, writing: false };
}

async function ensureQuotaDir() {
  await mkdir(QUOTA_DIR, { recursive: true });
}

function quotaPath(userId: string, date: string): string {
  return path.join(QUOTA_DIR, `${userId}-${date}.json`);
}

export async function getAiQuota(
  userId: string,
  now = new Date(),
): Promise<AiQuotaDay> {
  const date = vietnamCalendarDate(now);
  await ensureQuotaDir();
  try {
    const raw = await readFile(quotaPath(userId, date), "utf8");
    const parsed = JSON.parse(raw) as Partial<AiQuotaDay>;
    return {
      date,
      speaking: Boolean(parsed.speaking),
      writing: Boolean(parsed.writing),
    };
  } catch {
    return emptyQuota(date);
  }
}

export function quotaField(skill: AiScoreSkill): "speaking" | "writing" {
  return skill === "SPEAKING" ? "speaking" : "writing";
}

export function canUseAiScore(
  user: RoleBearer & { id?: string },
  quota: AiQuotaDay,
  skill: AiScoreSkill,
): { ok: true } | { ok: false; reason: "guest" | "quota" } {
  if (!user?.id) return { ok: false, reason: "guest" };
  if (isAdmin(user)) return { ok: true };
  const field = quotaField(skill);
  if (quota[field]) return { ok: false, reason: "quota" };
  return { ok: true };
}

/**
 * Mark today's quota as used for the skill.
 * Returns false if already used (non-admin race).
 */
export async function consumeAiQuota(
  userId: string,
  skill: AiScoreSkill,
  opts?: { unlimited?: boolean; now?: Date },
): Promise<{ consumed: boolean; quota: AiQuotaDay }> {
  const date = vietnamCalendarDate(opts?.now);
  await ensureQuotaDir();
  const current = await getAiQuota(userId, opts?.now);
  const field = quotaField(skill);

  if (opts?.unlimited) {
    return { consumed: false, quota: current };
  }

  if (current[field]) {
    return { consumed: false, quota: current };
  }

  const next: AiQuotaDay = { ...current, [field]: true };
  await writeFile(quotaPath(userId, date), JSON.stringify(next, null, 2), "utf8");
  return { consumed: true, quota: next };
}
