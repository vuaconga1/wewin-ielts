import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canAccessStaffArea } from "@/lib/auth/permissions";

/**
 * Protect all /admin/* routes (server-side).
 * - Guest → /login (unless ALLOW_OPEN_ADMIN for local guest bypass)
 * - STUDENT → /forbidden (never allowed, even with ALLOW_OPEN_ADMIN)
 * - TEACHER → only the sections in TEACHER_ADMIN_PATHS; every other admin
 *   segment has its own layout using AdminOnlyLayout (runs on soft nav too)
 * - ADMIN → allowed
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!canAccessStaffArea(user)) {
    if (!user) {
      redirect("/login?next=/admin/learn&reason=admin");
    }
    redirect("/forbidden?from=admin");
  }

  return children;
}
