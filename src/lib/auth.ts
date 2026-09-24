/**
 * Session auth via signed httpOnly cookie + bcrypt passwords.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { canUsePrisma, isDbConfigured } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import {
  findLocalUserByEmail,
  findLocalUserByUsername,
  upsertLocalUser,
} from "@/lib/store/user-store";
import {
  canAccessAdmin,
  isOpenAdminEnabled,
} from "@/lib/auth/permissions";

export type SessionUser = {
  id: string;
  email: string | null;
  username: string;
  fullName: string | null;
  role: "ADMIN" | "STUDENT";
};

export {
  canAccessAdmin,
  isAdmin,
  isOpenAdminEnabled,
  isStudent,
  requireAdminResponse,
} from "@/lib/auth/permissions";

const COOKIE_NAME = "wewin_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 days

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a string of at least 16 characters in production",
    );
  }
  // Dev fallback only — never used when NODE_ENV=production
  return "wewin-dev-session-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function encodeSession(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Date.now() + MAX_AGE_SEC * 1000,
    }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionUser & { exp?: number };
    if (data.exp && Date.now() > data.exp) return null;
    if (!data.id || !data.username || !data.role) return null;
    return {
      id: data.id,
      email: data.email ?? null,
      username: data.username,
      fullName: data.fullName ?? null,
      role: data.role,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Deduped within a single RSC/request (SiteShell + page both call this). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
});

/** Require any logged-in user (STUDENT or ADMIN). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("LOGIN_REQUIRED", "Cần đăng nhập");
  }
  return user;
}

/**
 * Require ADMIN (or guest + ALLOW_OPEN_ADMIN).
 * Logged-in STUDENT is always rejected, even when ALLOW_OPEN_ADMIN=true.
 * When open-admin is enabled and there is no session, returns a synthetic
 * admin session for server code that needs a SessionUser shape.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) {
    if (!canAccessAdmin(user)) {
      throw new AuthError("ADMIN_REQUIRED", "Cần đăng nhập admin");
    }
    return user;
  }
  if (isOpenAdminEnabled()) {
    return {
      id: "open-admin",
      email: "open-admin@local",
      username: "open-admin",
      fullName: null,
      role: "ADMIN",
    };
  }
  throw new AuthError("ADMIN_REQUIRED", "Cần đăng nhập admin");
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function usernameFromEmail(email: string): string {
  const base = email.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") || "user";
  return base.slice(0, 32) || "user";
}

/**
 * Register a STUDENT account only (never ADMIN).
 * Uses MySQL when available, otherwise data/users.json.
 */
export async function registerStudent(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<SessionUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const username = (input.username?.trim() || usernameFromEmail(email)).slice(
    0,
    48,
  );

  if (!email || !email.includes("@")) {
    throw new AuthError("INVALID_EMAIL", "Email không hợp lệ");
  }
  if (password.length < 6) {
    throw new AuthError(
      "WEAK_PASSWORD",
      "Mật khẩu cần ít nhất 6 ký tự",
    );
  }

  const passwordHash = await hashPassword(password);

  if (await canUsePrisma()) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError(
        "EMAIL_TAKEN",
        "Email đã được đăng ký. Hãy đăng nhập.",
      );
    }
    const takenUsername = await prisma.user.findUnique({
      where: { username },
    });
    const finalUsername = takenUsername
      ? `${username}${Date.now().toString(36).slice(-4)}`
      : username;

    const user = await prisma.user.create({
      data: {
        email,
        username: finalUsername,
        passwordHash,
        role: "STUDENT",
      },
    });
    const session: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName ?? null,
      role: user.role,
    };
    await createSession(session);
    return session;
  }

  const localExisting = await findLocalUserByEmail(email);
  if (localExisting) {
    throw new AuthError(
      "EMAIL_TAKEN",
      "Email đã được đăng ký. Hãy đăng nhập.",
    );
  }
  const created = await upsertLocalUser({
    email,
    username,
    passwordHash,
    role: "STUDENT",
  });
  const session: SessionUser = {
    id: created.id,
    email: created.email,
    username: created.username,
    fullName: created.fullName ?? null,
    role: created.role,
  };
  await createSession(session);
  return session;
}

export async function loginWithEmailPassword(
  identifier: string,
  password: string,
): Promise<SessionUser> {
  const raw = identifier.trim();
  if (!raw) {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Email/username hoặc mật khẩu không đúng",
    );
  }

  const looksLikeEmail = raw.includes("@");
  const emailKey = looksLikeEmail ? raw.toLowerCase() : null;

  async function verifyAndSession(user: {
    id: string;
    email: string | null;
    username: string;
    fullName?: string | null;
    role: "ADMIN" | "STUDENT";
    passwordHash: string;
  }): Promise<SessionUser> {
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "Email/username hoặc mật khẩu không đúng",
      );
    }
    const session: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName ?? null,
      role: user.role,
    };
    await createSession(session);
    return session;
  }

  if (await canUsePrisma()) {
    let user =
      emailKey != null
        ? await prisma.user.findUnique({ where: { email: emailKey } })
        : null;
    if (!user) {
      user = await prisma.user.findUnique({ where: { username: raw } });
    }
    if (!user && !looksLikeEmail) {
      // Case-insensitive username fallback for local typing differences
      const byLower = await prisma.user.findFirst({
        where: { username: { equals: raw, mode: "insensitive" } },
      });
      user = byLower;
    }
    if (!user) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        "Email/username hoặc mật khẩu không đúng",
      );
    }
    return verifyAndSession(user);
  }

  // DATABASE_URL set but unreachable
  if (await isDbConfigured()) {
    throw new AuthError(
      "DB_UNAVAILABLE",
      "Không kết nối được database. Kiểm tra DATABASE_URL (Neon) trên Vercel rồi redeploy.",
    );
  }

  // Local JSON fallback when DB is not configured
  let local =
    emailKey != null ? await findLocalUserByEmail(emailKey) : null;
  if (!local) {
    local = await findLocalUserByUsername(raw);
  }
  if (!local) {
    throw new AuthError(
      "INVALID_CREDENTIALS",
      "Email/username hoặc mật khẩu không đúng. Dev: chạy npm run seed:admin (hoặc cấu hình Neon DATABASE_URL).",
    );
  }
  return verifyAndSession(local);
}

/** Soft check: is Postgres reachable for auth/persist? */
export { canUsePrisma as isDatabaseAvailable } from "@/lib/db";
