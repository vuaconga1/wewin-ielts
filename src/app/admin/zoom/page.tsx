import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { ZoomAccountsManager } from "@/components/admin/zoom-accounts-manager";
import { getTranslations } from "@/i18n/server";
import { requireAdminPage } from "@/lib/auth/page-guards";
import { listZoomAccounts } from "@/lib/zoom/accounts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations("zoomAdmin");
  return { title: t("metaTitle", "Tài khoản Zoom | Wewin IELTS") };
}

export default async function AdminZoomPage() {
  await requireAdminPage();
  const [{ t }, accounts] = await Promise.all([
    getTranslations("zoomAdmin"),
    listZoomAccounts(),
  ]);

  return (
    <SiteShell active="admin-zoom">
      <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-zinc-900">
            {t("title", "Tài khoản Zoom")}
          </h1>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {t("subtitle", "Kết nối tài khoản Zoom để WEWIN tự tạo, sửa và xóa phòng học.")}
          </p>
        </div>
        <Link
          href="/admin/classes"
          className="text-sm font-medium text-zinc-600 hover:text-wewin-navy"
        >
          {t("classesLink", "Quản lý lớp & lịch học →")}
        </Link>
      </div>
      <ZoomAccountsManager accounts={accounts} />
    </SiteShell>
  );
}
