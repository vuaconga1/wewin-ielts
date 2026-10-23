import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { ClassDetailManager } from "@/components/admin/class-detail-manager";
import { getTranslations } from "@/i18n/server";
import { requireStaffPage } from "@/lib/auth/page-guards";
import {
  ClassroomManageError,
  getManagedClassroom,
  listClassMemberCandidates,
} from "@/lib/classroom/manage";
import { listZoomAccountOptions } from "@/lib/zoom/accounts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations("classAdmin");
  return { title: t("metaTitle", "Lớp & lịch học | Wewin IELTS") };
}

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStaffPage();
  if (!session) notFound();
  const { id } = await params;
  const isAdmin = session.role === "ADMIN";
  const [{ t }, classroom, zoomAccounts, candidates] = await Promise.all([
    getTranslations("classAdmin"),
    getManagedClassroom(session, id).catch((error) => {
      if (error instanceof ClassroomManageError && error.status === 404) return null;
      throw error;
    }),
    isAdmin ? listZoomAccountOptions() : Promise.resolve([]),
    isAdmin ? listClassMemberCandidates() : Promise.resolve(null),
  ]);
  if (!classroom) notFound();

  return (
    <SiteShell active="admin-classes">
      <Link
        href="/admin/classes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-wewin-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList", "Danh sách lớp")}
      </Link>
      <div className="mb-6 min-w-0">
        <p className="break-words text-xs font-semibold uppercase tracking-wide text-wewin-blue">
          {classroom.code}
          {classroom.status === "ARCHIVED" ? ` · ${t("archived", "Đã lưu trữ")}` : ""}
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-zinc-900">{classroom.name}</h1>
        <p className="mt-1 break-words text-sm text-zinc-600">
          {t("zoomAccountLabel", "Tài khoản Zoom")}:{" "}
          {classroom.zoomAccountName ?? t("zoomDefault", "Dùng tài khoản mặc định")} · {classroom.timezone}
        </p>
      </div>
      <ClassDetailManager
        key={classroom.id}
        classroom={classroom}
        canManage={isAdmin}
        actorId={session.id}
        zoomAccounts={zoomAccounts}
        candidates={candidates}
      />
    </SiteShell>
  );
}
