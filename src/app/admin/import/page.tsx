import Link from "next/link";
import { DriveSyncForm } from "@/components/admin/drive-sync-form";
import { ImportForm } from "@/components/admin/import-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.import") };
}

export default async function AdminImportPage() {
  const { t } = await getTranslations("admin");

  return (
    <SiteShell active="import">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{t("importTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t("importDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/learn"
            className="text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("learnManageLink")}
          </Link>
          <Link href="/tests" className="text-sm font-medium text-wewin-navy hover:underline">
            {t("viewCatalog")}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        <DriveSyncForm />
        <ImportForm />
      </div>
    </SiteShell>
  );
}
