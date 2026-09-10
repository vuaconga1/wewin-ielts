/**
 * Role-based access helpers for guest / STUDENT / ADMIN.
 *
 * ALLOW_OPEN_ADMIN=true (dev only): opens /admin for guests (no session).
 * Logged-in STUDENT never gets admin access, even when ALLOW_OPEN_ADMIN=true.
 * Keep false in production so ADMIN role is enforced.
 */

import { NextResponse } from "next/server";

export type AppRole = "ADMIN" | "STUDENT";

export type RoleBearer = { role: AppRole } | null | undefined;

/** Minimal session shape for admin API checks (avoids circular import with auth.ts). */
export type SessionLike = {
  id: string;
  email: string;
  username: string;
  role: AppRole;
};

/** Dev override: open /admin without login. Never enable in production. */
export function isOpenAdminEnabled(): boolean {
  return process.env.ALLOW_OPEN_ADMIN === "true";
}

export function isAdmin(user: RoleBearer): boolean {
  return user?.role === "ADMIN";
}

export function isStudent(user: RoleBearer): boolean {
  return user?.role === "STUDENT";
}

/**
 * True when the caller may use admin UI/APIs.
 * - ADMIN role → always allowed
 * - Logged-in STUDENT → never (even if ALLOW_OPEN_ADMIN)
 * - Guest (no session) → only when ALLOW_OPEN_ADMIN (local dev without login)
 */
export function canAccessAdmin(user: RoleBearer): boolean {
  if (isAdmin(user)) return true;
  if (user) return false;
  return isOpenAdminEnabled();
}

/**
 * Status for a denied admin request.
 * - 401: not logged in (and open-admin off)
 * - 403: logged in but not ADMIN
 * - null: allowed
 */
export function adminAccessDeniedStatus(
  user: RoleBearer,
): 401 | 403 | null {
  if (canAccessAdmin(user)) return null;
  if (!user) return 401;
  return 403;
}

export function adminDeniedMessage(status: 401 | 403): string {
  if (status === 401) {
    return "Unauthorized — cần đăng nhập tài khoản ADMIN";
  }
  return "Forbidden — tài khoản học viên không được truy cập khu vực quản trị";
}

/**
 * For Route Handlers under /api/admin/**.
 * Returns a JSON error response, or null when access is allowed.
 * When open-admin is on and there is no session, access is allowed.
 * Logged-in STUDENT is always rejected (403).
 */
export async function requireAdminResponse(
  getUser: () => Promise<SessionLike | null>,
): Promise<NextResponse | null> {
  const user = await getUser();
  const status = adminAccessDeniedStatus(user);
  if (status === null) return null;
  return NextResponse.json(
    { error: adminDeniedMessage(status) },
    { status },
  );
}
