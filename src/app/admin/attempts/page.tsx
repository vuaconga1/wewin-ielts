import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { AttemptsViewer } from "@/components/admin/attempts-viewer";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminAttempts") };
}

export default async function AdminAttemptsPage() {
  const { t } = await getTranslations("admin");

  return (
    <SiteShell active="admin-attempts">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {t("attemptsTitle")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("attemptsDesc")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/admin/import"
            className="font-medium text-zinc-600 hover:text-wewin-navy"
          >
            {t("importLink")}
          </Link>
          <Link
            href="/admin/learn"
            className="font-medium text-zinc-600 hover:text-wewin-navy"
          >
            {t("learnManageLink")}
          </Link>
          <Link
            href="/account/attempts"
            className="font-medium text-wewin-navy hover:underline"
          >
            {t("myHistory")}
          </Link>
        </div>
      </div>

      <AttemptsViewer />
    </SiteShell>
  );
}
