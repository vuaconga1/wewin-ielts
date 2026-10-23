/**
 * Admin sections a TEACHER may open. Everything else under /admin stays
 * ADMIN-only. In /admin/classes a teacher only sees assigned classes and may
 * manage their sessions. Client-safe (no server imports).
 */
export const TEACHER_ADMIN_PATHS = [
  "/admin/classes",
  "/admin/users",
  "/admin/reports",
  "/admin/attempts",
] as const;

export function isTeacherAdminPath(pathname: string): boolean {
  return TEACHER_ADMIN_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`) || pathname.startsWith(`${base}?`),
  );
}
