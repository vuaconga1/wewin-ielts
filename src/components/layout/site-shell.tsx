import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import {
  DashboardShell,
  type DashboardNavKey,
} from "@/components/dashboard/dashboard-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { initialsFromName } from "@/lib/dashboard-stats";
import { getUserAvatarUrl } from "@/lib/user-profile";

type Props = {
  children: React.ReactNode;
  active?: DashboardNavKey;
  /** Uncapped content width (lesson player); default is max-w-[1400px] */
  wide?: boolean;
};

/**
 * Shared app chrome: left sidebar (same as dashboard).
 * Practice exam routes should skip this shell for a focused UI.
 */
export async function SiteShell({ children, active, wide }: Props) {
  const user = await getSessionUser();
  // Admin nav (users / learn / import / attempts) — ADMIN only; never STUDENT
  const canImport = canAccessAdmin(user);
  const avatarUrl = user ? await getUserAvatarUrl(user.id) : null;

  return (
    <DashboardShell
      active={active}
      canImport={canImport}
      wide={wide}
      footer={<SiteFooter />}
      user={
        user
          ? {
              username: user.username,
              initials: initialsFromName(user.username),
              role: user.role,
              avatarUrl,
            }
          : null
      }
    >
      {children}
    </DashboardShell>
  );
}
