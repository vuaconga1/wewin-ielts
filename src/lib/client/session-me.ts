/**
 * Client session for SiteShell — survives soft nav remounts.
 * Stale-while-revalidate: the last known session stays visible after TTL and is
 * refreshed in the background, so the shell never flips to "guest" just because
 * the cache aged out. Only a successful /api/auth response can log the UI out.
 */

import { initialsFromName } from "@/lib/dashboard-stats";
import type { SidebarUser } from "@/components/dashboard/sidebar-profile";

export type SessionMe = {
  user: SidebarUser | null;
  canImport: boolean;
};

const TTL_MS = 60_000;
const STORAGE_KEY = "wewin_session_me_v3";

type CacheEntry = {
  data: SessionMe;
  fetchedAt: number;
};

let memory: CacheEntry | null = null;
let inflight: Promise<SessionMe> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeSessionMe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStorage(): CacheEntry | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (typeof parsed.fetchedAt !== "number" || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: SessionMe) {
  const entry: CacheEntry = { data, fetchedAt: Date.now() };
  memory = entry;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / private mode */
  }
}

function currentEntry(): CacheEntry | null {
  if (!memory) memory = readStorage();
  return memory;
}

/** Last known session (possibly stale); stable reference until the next write. */
export function peekSessionMe(): SessionMe | null {
  return currentEntry()?.data ?? null;
}

export function clearSessionMe() {
  memory = null;
  inflight = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  notify();
}

export function setSessionMe(data: SessionMe) {
  writeSession(data);
  notify();
}

type AuthApiUser = {
  id: string;
  email: string | null;
  username: string;
  fullName?: string | null;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "VISITOR";
  avatarUrl?: string | null;
};

function canImportFromPayload(
  user: AuthApiUser | null,
  canImport?: boolean,
): boolean {
  if (typeof canImport === "boolean") return canImport;
  return user?.role === "ADMIN";
}

const EMPTY: SessionMe = { user: null, canImport: false };

function revalidate(): Promise<SessionMe> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      // Server/network hiccup: keep showing what we had instead of logging out.
      if (!res.ok) return peekSessionMe() ?? EMPTY;
      const json = (await res.json()) as {
        user?: AuthApiUser | null;
        canImport?: boolean;
      };
      const raw = json.user ?? null;
      const data: SessionMe = {
        user: raw
          ? {
              username: raw.username,
              fullName: raw.fullName ?? null,
              initials: initialsFromName(raw.fullName || raw.username),
              role: raw.role,
              avatarUrl: raw.avatarUrl ?? null,
            }
          : null,
        canImport: canImportFromPayload(raw, json.canImport),
      };
      setSessionMe(data);
      return data;
    } catch {
      return peekSessionMe() ?? EMPTY;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Current user + admin flag (deduped). Stale cache resolves immediately and refreshes in background. */
export function fetchSessionMe(): Promise<SessionMe> {
  const entry = currentEntry();
  if (entry) {
    if (Date.now() - entry.fetchedAt >= TTL_MS) void revalidate();
    return Promise.resolve(entry.data);
  }
  return revalidate();
}
