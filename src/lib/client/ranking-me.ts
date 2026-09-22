/**
 * Client-side rank/points fetch with in-flight dedupe + TTL cache.
 * Survives SiteShell remounts on soft navigation (learn ↔ tests).
 */

export type MyRankPayload = {
  rank: number | null;
  points: number;
};

const TTL_MS = 60_000;
const STORAGE_KEY = "wewin_rank_me_v1";

type CacheEntry = {
  username: string;
  data: MyRankPayload;
  expiresAt: number;
};

let memory: CacheEntry | null = null;
let inflight: Promise<MyRankPayload> | null = null;
let inflightUsername: string | null = null;

function readSession(username: string): MyRankPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (
      parsed.username !== username ||
      typeof parsed.expiresAt !== "number" ||
      Date.now() >= parsed.expiresAt
    ) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSession(username: string, data: MyRankPayload) {
  const entry: CacheEntry = {
    username,
    data,
    expiresAt: Date.now() + TTL_MS,
  };
  memory = entry;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

/** Drop cached rank (e.g. after logout). */
export function clearMyRankCache() {
  memory = null;
  inflight = null;
  inflightUsername = null;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Fetch current user's all-time rank/points.
 * Reuses memory → sessionStorage → single in-flight network call.
 */
export function fetchMyRank(username: string): Promise<MyRankPayload> {
  if (memory && memory.username === username && Date.now() < memory.expiresAt) {
    return Promise.resolve(memory.data);
  }

  const fromSession = readSession(username);
  if (fromSession) {
    memory = {
      username,
      data: fromSession,
      expiresAt: Date.now() + TTL_MS,
    };
    return Promise.resolve(fromSession);
  }

  if (inflight && inflightUsername === username) {
    return inflight;
  }

  inflightUsername = username;
  inflight = (async () => {
    try {
      const res = await fetch("/api/ranking?me=1&period=all");
      if (!res.ok) throw new Error("RANK_ME_FAILED");
      const json = (await res.json()) as {
        rank?: number | null;
        points?: number;
      };
      const data: MyRankPayload = {
        rank: typeof json.rank === "number" ? json.rank : null,
        points: typeof json.points === "number" ? json.points : 0,
      };
      writeSession(username, data);
      return data;
    } finally {
      inflight = null;
      inflightUsername = null;
    }
  })();

  return inflight;
}
