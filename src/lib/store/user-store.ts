/**
 * Local JSON user store — used when MySQL is unavailable (same pattern as test-store).
 * File: data/users.json (gitignored under /data). On Vercel → /tmp/wewin-data (ephemeral).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/paths";

const USERS_FILE = path.join(DATA_DIR, "users.json");

export type StoredUser = {
  id: string;
  email: string | null;
  username: string;
  passwordHash: string;
  role: "ADMIN" | "STUDENT";
  /** Profile image path or data URL */
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readAll(): Promise<StoredUser[]> {
  await ensureDir();
  try {
    const raw = await readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(users: StoredUser[]): Promise<void> {
  await ensureDir();
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export async function listLocalUsers(): Promise<StoredUser[]> {
  return readAll();
}

export async function findLocalUserByEmail(
  email: string,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const users = await readAll();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function findLocalUserById(
  id: string,
): Promise<StoredUser | null> {
  const users = await readAll();
  return users.find((u) => u.id === id) ?? null;
}

export async function updateLocalUserAvatar(
  id: string,
  avatarUrl: string | null,
): Promise<StoredUser | null> {
  const users = await readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  const updated: StoredUser = {
    ...users[idx],
    avatarUrl,
    updatedAt: new Date().toISOString(),
  };
  users[idx] = updated;
  await writeAll(users);
  return updated;
}

export async function upsertLocalUser(input: {
  email: string | null;
  username: string;
  passwordHash: string;
  role: "ADMIN" | "STUDENT";
}): Promise<StoredUser> {
  const email = input.email?.trim().toLowerCase() || null;
  const users = await readAll();
  const now = new Date().toISOString();
  const idx = email
    ? users.findIndex((u) => u.email === email)
    : -1;

  if (idx >= 0) {
    const updated: StoredUser = {
      ...users[idx],
      username: input.username,
      passwordHash: input.passwordHash,
      role: input.role,
      updatedAt: now,
    };
    users[idx] = updated;
    await writeAll(users);
    return updated;
  }

  const created: StoredUser = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    username: input.username,
    passwordHash: input.passwordHash,
    role: input.role,
    createdAt: now,
    updatedAt: now,
  };
  users.push(created);
  await writeAll(users);
  return created;
}

export async function findLocalUserByUsername(
  username: string,
): Promise<StoredUser | null> {
  const normalized = username.trim().toLowerCase();
  const users = await readAll();
  return (
    users.find((u) => u.username.trim().toLowerCase() === normalized) ?? null
  );
}

export async function updateLocalUser(
  id: string,
  patch: {
    username?: string;
    passwordHash?: string;
    role?: "ADMIN" | "STUDENT";
  },
): Promise<StoredUser | null> {
  const users = await readAll();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  const updated: StoredUser = {
    ...users[idx],
    ...(patch.username != null ? { username: patch.username } : {}),
    ...(patch.passwordHash != null
      ? { passwordHash: patch.passwordHash }
      : {}),
    ...(patch.role != null ? { role: patch.role } : {}),
    updatedAt: new Date().toISOString(),
  };
  users[idx] = updated;
  await writeAll(users);
  return updated;
}

export async function deleteLocalUser(id: string): Promise<boolean> {
  const users = await readAll();
  const next = users.filter((u) => u.id !== id);
  if (next.length === users.length) return false;
  await writeAll(next);
  return true;
}
