import Link from "next/link";
import nextDynamic from "next/dynamic";
import { SiteShell } from "@/components/layout/site-shell";
import { canAccessAdmin } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";
import { requireStaffPage } from "@/lib/auth/page-guards";

const UsersManager = nextDynamic(
  () =>
    import("@/components/admin/users-manager").then((m) => m.UsersManager),
  {
    loading: () => (
      <div className="h-40 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
    ),
  },
);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminUsers") };
}

export default async function AdminUsersPage() {
  const session = await requireStaffPage();
  const { t } = await getTranslations("admin");
  const canManage = canAccessAdmin(session);

  return (
    <SiteShell active="admin-users">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">
            {t("usersTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{t("usersDesc")}</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin/learn"
              className="font-medium text-zinc-600 hover:text-wewin-navy"
            >
              {t("learnManageLink")}
            </Link>
            <Link
              href="/admin/import"
              className="font-medium text-zinc-600 hover:text-wewin-navy"
            >
              {t("importLink")}
            </Link>
          </div>
        ) : null}
      </div>

      <UsersManager
        currentUserId={session?.id ?? null}
        canManage={canManage}
      />
    </SiteShell>
  );
}
