import Link from "next/link";
import nextDynamic from "next/dynamic";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

const DriveSyncForm = nextDynamic(
  () =>
    import("@/components/admin/drive-sync-form").then((m) => m.DriveSyncForm),
  {
    loading: () => (
      <div className="h-32 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
    ),
  },
);
const ImportForm = nextDynamic(
  () => import("@/components/admin/import-form").then((m) => m.ImportForm),
  {
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
    ),
  },
);

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
