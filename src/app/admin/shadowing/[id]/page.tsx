import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { ShadowingAdminForm } from "@/components/admin/shadowing-admin-form";
import { ShadowingAdminAttempts } from "@/components/admin/shadowing-admin-attempts";
import {
  RECORDING_RETENTION_DAYS,
  getShadowingForAdmin,
  listShadowingAttemptsForAdmin,
} from "@/lib/shadowing/store";
import { getTranslations } from "@/i18n/server";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminShadowing") };
}

export default async function AdminShadowingEditPage({ params }: Props) {
  await requireAdminPage();
  const { id } = await params;
  const [exercise, attempts] = await Promise.all([
    getShadowingForAdmin(id),
    listShadowingAttemptsForAdmin(id),
  ]);
  if (!exercise) notFound();
  const { t } = await getTranslations("shadowingAdmin");

  return (
    <SiteShell active="admin-shadowing">
      <div className="mb-6">
        <Link href="/admin/shadowing" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài Shadowing")}
        </Link>
        <h1 className="mt-2 break-words text-2xl font-bold text-zinc-900">
          {t("editTitle", "Sửa bài Shadowing")}
        </h1>
      </div>
      <div className="space-y-6">
        <ShadowingAdminForm
          initial={{
            id: exercise.id,
            title: exercise.title,
            level: exercise.level ?? "",
            instructions: exercise.instructions ?? "",
            audioUrl: exercise.audioUrl,
            transcript: exercise.transcript,
            maxRecordSeconds: exercise.maxRecordSeconds,
            status: exercise.status,
            order: exercise.order,
          }}
        />
        <ShadowingAdminAttempts attempts={attempts} retentionDays={RECORDING_RETENTION_DAYS} />
      </div>
    </SiteShell>
  );
}
