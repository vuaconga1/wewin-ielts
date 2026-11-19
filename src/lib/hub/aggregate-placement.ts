import "server-only";

import { listHubPlacementAttempts } from "@/lib/hub/placement-attempts";
import type {
  AggregatedPlacementItem,
  AggregatedPlacementResult,
  AggregatedPlacementSource,
} from "@/lib/hub/aggregate-placement-types";
import type {
  HubBranch,
  HubPlacementFilters,
  HubPlacementListResult,
} from "@/lib/hub/placement-attempts-types";

export type {
  AggregatedPlacementItem,
  AggregatedPlacementResult,
  AggregatedPlacementSource,
} from "@/lib/hub/aggregate-placement-types";

const DEFAULT_CAMBRIDGE_HUB =
  "https://cambridge-placement-test.vercel.app/api/hub/placement-attempts";

const CAMBRIDGE_SSO_DETAIL = "/api/admin/hub/cambridge-sso";

function cambridgeHubUrl(): string {
  return (
    process.env.CAMBRIDGE_HUB_URL?.trim() ||
    DEFAULT_CAMBRIDGE_HUB
  );
}

function hubApiKey(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

async function fetchCambridge(
  filters: HubPlacementFilters,
): Promise<HubPlacementListResult> {
  const key = hubApiKey();
  if (!key) {
    throw new Error("CAMBRIDGE_HUB_NOT_CONFIGURED");
  }
  const url = new URL(cambridgeHubUrl());
  if (filters.q) url.searchParams.set("q", filters.q);
  if (filters.branch) url.searchParams.set("branch", filters.branch);
  if (filters.test) url.searchParams.set("test", filters.test);
  if (filters.from) url.searchParams.set("from", filters.from);
  if (filters.to) url.searchParams.set("to", filters.to);
  if (filters.take) url.searchParams.set("take", String(filters.take));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { code?: string } | null;
      throw new Error(body?.code || `CAMBRIDGE_HTTP_${res.status}`);
    }
    return (await res.json()) as HubPlacementListResult;
  } finally {
    clearTimeout(timer);
  }
}

function emptyByBranch(): Record<HubBranch, number> {
  return { NTL: 0, XVNT: 0 };
}

function cambridgeSsoDetailUrl(attemptId: string): string {
  return `${CAMBRIDGE_SSO_DETAIL}?attempt=${encodeURIComponent(attemptId)}`;
}

/** Merge lean placement lists from IELTS (local) + Cambridge (remote hub). */
export async function aggregatePlacementAttempts(
  filters: HubPlacementFilters = {},
): Promise<AggregatedPlacementResult> {
  const take = filters.take ?? 50;
  const sourceFilter = filters.source;
  const sources: AggregatedPlacementResult["sources"] = {
    ielts: { ok: false },
    cambridge: { ok: false },
  };

  const loadIelts = sourceFilter !== "cambridge";
  const loadCambridge = sourceFilter !== "ielts";

  const [ieltsSettled, cambridgeSettled] = await Promise.allSettled([
    loadIelts
      ? listHubPlacementAttempts(filters)
      : Promise.resolve(null),
    loadCambridge
      ? fetchCambridge(filters)
      : Promise.resolve(null),
  ]);

  const items: AggregatedPlacementItem[] = [];

  if (!loadIelts) {
    sources.ielts = { ok: true };
  } else if (ieltsSettled.status === "fulfilled" && ieltsSettled.value) {
    sources.ielts = { ok: true };
    for (const row of ieltsSettled.value.items) {
      items.push({ ...row, source: "ielts" });
    }
  } else if (ieltsSettled.status === "rejected") {
    sources.ielts = {
      ok: false,
      error:
        ieltsSettled.reason instanceof Error
          ? ieltsSettled.reason.message
          : "IELTS_HUB_FAILED",
    };
  } else {
    sources.ielts = { ok: true };
  }

  if (!loadCambridge) {
    sources.cambridge = { ok: true };
  } else if (cambridgeSettled.status === "fulfilled" && cambridgeSettled.value) {
    sources.cambridge = { ok: true };
    for (const row of cambridgeSettled.value.items) {
      items.push({
        ...row,
        source: "cambridge",
        detailUrl: cambridgeSsoDetailUrl(row.id),
      });
    }
  } else if (cambridgeSettled.status === "rejected") {
    sources.cambridge = {
      ok: false,
      error:
        cambridgeSettled.reason instanceof Error
          ? cambridgeSettled.reason.message
          : "CAMBRIDGE_HUB_FAILED",
    };
  } else {
    sources.cambridge = { ok: true };
  }

  items.sort(
    (a, b) =>
      new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
  );

  const sliced = items.slice(0, take);
  const byBranch = emptyByBranch();
  const bySource: Record<AggregatedPlacementSource, number> = {
    ielts: 0,
    cambridge: 0,
  };
  for (const row of sliced) {
    byBranch[row.branch] += 1;
    bySource[row.source] += 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    items: sliced,
    stats: {
      total: sliced.length,
      byBranch,
      bySource,
    },
    sources,
  };
}
