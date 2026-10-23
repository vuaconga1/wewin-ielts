import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { ClassesManager } from "@/components/admin/classes-manager";
import { MyZoomHostCard } from "@/components/admin/my-zoom-host-card";
import { getTranslations } from "@/i18n/server";
import { requireStaffPage } from "@/lib/auth/page-guards";
import { listManagedClassrooms } from "@/lib/classroom/manage";
import { listZoomAccountOptions } from "@/lib/zoom/accounts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations("classAdmin");
  return { title: t("metaTitle", "Lớp & lịch học | Wewin IELTS") };
}

export default async function AdminClassesPage() {
  const session = await requireStaffPage();
  const { t } = await getTranslations("classAdmin");
  if (!session) {
    return (
      <SiteShell active="admin-classes">
        <p className="text-sm text-zinc-600">{t("loginRequired", "Cần đăng nhập để quản lý lớp học.")}</p>
      </SiteShell>
    );
  }
  const isAdmin = session.role === "ADMIN";
  const [classes, zoomAccounts] = await Promise.all([
    listManagedClassrooms(session),
    isAdmin ? listZoomAccountOptions() : Promise.resolve([]),
  ]);

  return (
    <SiteShell active="admin-classes">
      <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-zinc-900">
            {t("title", "Lớp & lịch học")}
          </h1>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {isAdmin
              ? t("subtitleAdmin", "Tạo lớp, phân công giáo viên/học viên và lên lịch phòng Zoom.")
              : t("subtitleTeacher", "Lên lịch và quản lý buổi học Zoom cho lớp bạn phụ trách.")}
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/admin/zoom"
            className="text-sm font-medium text-zinc-600 hover:text-wewin-navy"
          >
            {t("zoomAccountsLink", "Tài khoản Zoom →")}
          </Link>
        ) : null}
      </div>
      {isAdmin && zoomAccounts.length === 0 ? (
        <div className="mb-5 min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="break-words">
            {t("noZoomAccount", "Chưa kết nối tài khoản Zoom nào — cần thêm trước khi tạo buổi học.")}
          </span>{" "}
          <Link href="/admin/zoom" className="font-semibold underline">
            {t("connectZoom", "Kết nối ngay")}
          </Link>
        </div>
      ) : null}
      <MyZoomHostCard isAdmin={isAdmin} />
      <ClassesManager classes={classes} canManage={isAdmin} zoomAccounts={zoomAccounts} />
    </SiteShell>
  );
}
