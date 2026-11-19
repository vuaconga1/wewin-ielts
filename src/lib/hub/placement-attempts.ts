import "server-only";

import { unstable_cache } from "next/cache";
import { canUsePrisma } from "@/lib/db";
import {
  externalIdFromAttemptId,
  normalizeHubQuery,
  resolveHubBranch,
  scoreFromPayload,
  scorePercent,
  siteOrigin,
} from "@/lib/hub/placement-attempts-pure";
import type {
  HubBranch,
  HubPlacementFilters,
  HubPlacementItem,
  HubPlacementListResult,
} from "@/lib/hub/placement-attempts-types";
import { prisma } from "@/lib/prisma";
import { practiceResultPath } from "@/lib/practice/paths";

export {
  resolveHubBranch,
  scorePercent,
  siteOrigin,
} from "@/lib/hub/placement-attempts-pure";

const MAX_TAKE = 100;
const DEFAULT_TAKE = 50;

function matchesDateRange(
  finishedAt: Date,
  from?: string,
  to?: string,
): boolean {
  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime()) && finishedAt < start) return false;
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime()) && finishedAt > end) return false;
  }
  return true;
}

async function listHubPlacementAttemptsUncached(
  filters: HubPlacementFilters,
): Promise<HubPlacementListResult> {
  const take = Math.min(
    Math.max(filters.take ?? DEFAULT_TAKE, 1),
    MAX_TAKE,
  );
  const branchDefault = resolveHubBranch();
  const empty: HubPlacementListResult = {
    source: "ielts",
    generatedAt: new Date().toISOString(),
    items: [],
    stats: { total: 0, byBranch: { NTL: 0, XVNT: 0 } },
  };

  if (!(await canUsePrisma())) return empty;

  const rows = await prisma.attempt.findMany({
    where: {
      finishedAt: { not: null },
      test: { examType: "PLACEMENT" },
    },
    orderBy: { finishedAt: "desc" },
    take: Math.min(take * 4, 400),
    select: {
      id: true,
      finishedAt: true,
      scoreRaw: true,
      payload: true,
      user: {
        select: { fullName: true, username: true },
      },
      test: {
        select: { slug: true, title: true },
      },
    },
  });

  const q = normalizeHubQuery(filters.q);
  const matched: HubPlacementItem[] = [];
  const byBranch: Record<HubBranch, number> = { NTL: 0, XVNT: 0 };

  for (const row of rows) {
    if (!row.finishedAt) continue;
    if (!matchesDateRange(row.finishedAt, filters.from, filters.to)) continue;

    const branch = branchDefault;
    if (filters.branch && filters.branch !== branch) continue;

    const testLabel = row.test.title || row.test.slug;
    if (
      filters.test &&
      !testLabel.toLowerCase().includes(filters.test.toLowerCase()) &&
      !row.test.slug.toLowerCase().includes(filters.test.toLowerCase())
    ) {
      continue;
    }

    const studentName =
      row.user?.fullName?.trim() || row.user?.username?.trim() || "—";
    const externalId = externalIdFromAttemptId(row.id);
    if (
      q &&
      !normalizeHubQuery(`${studentName} ${externalId} ${row.id}`).includes(q)
    ) {
      continue;
    }

    const { correct, total } = scoreFromPayload(row.payload, row.scoreRaw);
    const item: HubPlacementItem = {
      id: row.id,
      externalId,
      studentName,
      branch,
      testLabel,
      testSlug: row.test.slug,
      finishedAt: row.finishedAt.toISOString(),
      scoreCorrect: correct,
      scoreTotal: total,
      scorePercent: scorePercent(correct, total),
      detailUrl: `${siteOrigin()}${practiceResultPath(row.test.slug, row.id)}`,
    };

    byBranch[branch] += 1;
    matched.push(item);
  }

  return {
    source: "ielts",
    generatedAt: new Date().toISOString(),
    items: matched.slice(0, take),
    stats: {
      total: matched.length,
      byBranch,
    },
  };
}

function cacheKey(filters: HubPlacementFilters): string {
  return JSON.stringify({
    q: filters.q ?? "",
    branch: filters.branch ?? "",
    test: filters.test ?? "",
    from: filters.from ?? "",
    to: filters.to ?? "",
    take: filters.take ?? DEFAULT_TAKE,
    siteBranch: resolveHubBranch(),
  });
}

/** Lean finished PLACEMENT attempts for the unified Admin Panel (45s cache). */
export async function listHubPlacementAttempts(
  filters: HubPlacementFilters = {},
): Promise<HubPlacementListResult> {
  const key = cacheKey(filters);
  const cached = unstable_cache(
    async () => listHubPlacementAttemptsUncached(filters),
    ["hub-placement-attempts", key],
    { revalidate: 45 },
  );
  return cached();
}
