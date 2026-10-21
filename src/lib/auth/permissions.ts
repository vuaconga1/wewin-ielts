/**
 * Role-based access helpers for guest / STUDENT / ADMIN.
 *
 * ALLOW_OPEN_ADMIN=true (dev only): opens /admin for guests (no session).
 * Logged-in STUDENT never gets admin access, even when ALLOW_OPEN_ADMIN=true.
 * Keep false in production so ADMIN role is enforced.
 */

import { NextResponse } from "next/server";

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

export type RoleBearer = { role: AppRole } | null | undefined;

/** Minimal session shape for admin API checks (avoids circular import with auth.ts). */
export type SessionLike = {
  id: string;
  email: string | null;
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

export function isTeacher(user: RoleBearer): boolean {
  return user?.role === "TEACHER";
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
/** Teachers and administrators may edit imported tests. */
export function canEditTests(user: RoleBearer): boolean {
  return isAdmin(user) || isTeacher(user);
}

export function canAccessAdmin(user: RoleBearer): boolean {
  if (isAdmin(user)) return true;
  if (user) return false;
  return isOpenAdminEnabled();
}

/** ADMIN or TEACHER. */
export function isStaff(user: RoleBearer): boolean {
  return isAdmin(user) || isTeacher(user);
}

/**
 * Read-only staff sections (accounts, student reports, attempt history):
 * ADMIN, TEACHER, or guest + ALLOW_OPEN_ADMIN. Never STUDENT.
 */
export function canAccessStaffArea(user: RoleBearer): boolean {
  if (isStaff(user)) return true;
  if (user) return false;
  return isOpenAdminEnabled();
}

/**
 * Status for a denied admin request.
 * - 401: not logged in (and open-admin off)
 * - 403: logged in but role not allowed
 * - null: allowed
 */
export function adminAccessDeniedStatus(
  user: RoleBearer,
  allow: (user: RoleBearer) => boolean = canAccessAdmin,
): 401 | 403 | null {
  if (allow(user)) return null;
  if (!user) return 401;
  return 403;
}

export function adminDeniedMessage(
  status: 401 | 403,
  user?: RoleBearer,
): string {
  if (status === 401) {
    return "Unauthorized — cần đăng nhập tài khoản ADMIN";
  }
  if (isTeacher(user)) {
    return "Forbidden — chức năng này chỉ dành cho quản trị viên";
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
    { error: adminDeniedMessage(status, user) },
    { status },
  );
}

/** Like requireAdminResponse, but also lets TEACHER through (read-only staff APIs). */
export async function requireStaffResponse(
  getUser: () => Promise<SessionLike | null>,
): Promise<NextResponse | null> {
  const user = await getUser();
  const status = adminAccessDeniedStatus(user, canAccessStaffArea);
  if (status === null) return null;
  return NextResponse.json(
    { error: adminDeniedMessage(status, user) },
    { status },
  );
}
