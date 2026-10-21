import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import {
  canAccessAdmin,
  canAccessStaffArea,
  type RoleBearer,
} from "@/lib/auth/permissions";

/**
 * Call at the top of every /admin page. Layout redirects are not enough:
 * Next renders the page in parallel and its RSC payload still reaches the client.
 */
async function guard(
  allow: (user: RoleBearer) => boolean,
): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!allow(user)) {
    if (!user) redirect("/login?next=/admin/learn&reason=admin");
    redirect("/forbidden?from=admin");
  }
  return user;
}

/** ADMIN only (or guest + ALLOW_OPEN_ADMIN). */
export function requireAdminPage(): Promise<SessionUser | null> {
  return guard(canAccessAdmin);
}

/** ADMIN or TEACHER (or guest + ALLOW_OPEN_ADMIN). */
export function requireStaffPage(): Promise<SessionUser | null> {
  return guard(canAccessStaffArea);
}
