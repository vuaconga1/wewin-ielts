import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { ShadowingAdminList } from "@/components/admin/shadowing-admin-list";
import { listShadowingForAdmin } from "@/lib/shadowing/store";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminShadowing") };
}

export default async function AdminShadowingPage() {
  const rows = await listShadowingForAdmin();
  const { t } = await getTranslations("shadowingAdmin");

  return (
    <SiteShell active="admin-shadowing">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">{t("title", "Bài Shadowing")}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("desc", "Tạo câu mẫu kèm audio để học viên nghe và đọc lại. Học viên luyện tại")}{" "}
            <Link href="/learn/shadowing" className="font-medium text-wewin-navy hover:underline">
              /learn/shadowing
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/shadowing/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("add", "+ Thêm bài")}
        </Link>
      </div>
      <ShadowingAdminList rows={rows} />
    </SiteShell>
  );
}
