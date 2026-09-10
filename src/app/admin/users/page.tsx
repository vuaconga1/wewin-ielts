import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { UsersManager } from "@/components/admin/users-manager";
import { getSessionUser } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminUsers") };
}

export default async function AdminUsersPage() {
  const { t } = await getTranslations("admin");
  const session = await getSessionUser();

  return (
    <SiteShell active="admin-users">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">
            {t("usersTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{t("usersDesc")}</p>
        </div>
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
      </div>

      <UsersManager currentUserId={session?.id ?? null} />
    </SiteShell>
  );
}
