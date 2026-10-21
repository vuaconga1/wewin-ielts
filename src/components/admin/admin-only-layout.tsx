import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth/permissions";

/** Segment layout for /admin sections that TEACHER must not open. */
export async function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!canAccessAdmin(user)) {
    if (!user) {
      redirect("/login?next=/admin/learn&reason=admin");
    }
    redirect("/forbidden?from=admin");
  }

  return children;
}
