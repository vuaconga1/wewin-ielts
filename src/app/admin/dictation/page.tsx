import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminList } from "@/components/admin/dictation-admin-list";
import { listDictationsForAdmin } from "@/lib/dictation/store";
import { getTranslations } from "@/i18n/server";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminDictation") };
}

export default async function AdminDictationPage() {
  await requireAdminPage();
  const rows = await listDictationsForAdmin("FULL_TEXT");
  const { t } = await getTranslations("dictationAdmin");

  return (
    <SiteShell active="admin-dictation">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">{t("title", "Bài chép chính tả")}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("desc")}{" "}
            <Link href="/learn/dictation" className="font-medium text-wewin-navy hover:underline">
              /learn/dictation
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/dictation/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("add", "+ Thêm bài")}
        </Link>
      </div>
      <DictationAdminList rows={rows} />
    </SiteShell>
  );
}
