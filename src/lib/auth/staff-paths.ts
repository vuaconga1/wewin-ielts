/**
 * Admin sections a TEACHER may open (read-only). Everything else under /admin
 * stays ADMIN-only. Client-safe (no server imports).
 */
export const TEACHER_ADMIN_PATHS = [
  "/admin/users",
  "/admin/reports",
  "/admin/attempts",
] as const;

export function isTeacherAdminPath(pathname: string): boolean {
  return TEACHER_ADMIN_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`) || pathname.startsWith(`${base}?`),
  );
}
