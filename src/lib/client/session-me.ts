/**
 * Client session for SiteShell — one fetch per tab TTL, survives soft nav remounts.
 */

import { initialsFromName } from "@/lib/dashboard-stats";
import type { SidebarUser } from "@/components/dashboard/sidebar-profile";

export type SessionMe = {
  user: SidebarUser | null;
  canImport: boolean;
};

const TTL_MS = 60_000;
const STORAGE_KEY = "wewin_session_me_v2";

type CacheEntry = {
  data: SessionMe;
  expiresAt: number;
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

function readSession(): SessionMe | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (typeof parsed.expiresAt !== "number" || Date.now() >= parsed.expiresAt) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeSession(data: SessionMe) {
  const entry: CacheEntry = {
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

export function peekSessionMe(): SessionMe | null {
  if (memory && Date.now() < memory.expiresAt) return memory.data;
  const fromSession = readSession();
  if (fromSession) {
    memory = {
      data: fromSession,
      expiresAt: Date.now() + TTL_MS,
    };
    return fromSession;
  }
  return null;
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
  role: "ADMIN" | "STUDENT";
  avatarUrl?: string | null;
};

function canImportFromPayload(
  user: AuthApiUser | null,
  canImport?: boolean,
): boolean {
  if (typeof canImport === "boolean") return canImport;
  return user?.role === "ADMIN";
}

/** Fetch current user + admin flag (deduped). */
export function fetchSessionMe(): Promise<SessionMe> {
  const peek = peekSessionMe();
  if (peek) return Promise.resolve(peek);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (!res.ok) {
        const empty: SessionMe = { user: null, canImport: false };
        writeSession(empty);
        return empty;
      }
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
      writeSession(data);
      return data;
    } catch {
      return { user: null, canImport: false };
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
