import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { ShadowingAdminForm } from "@/components/admin/shadowing-admin-form";
import { listShadowingForAdmin } from "@/lib/shadowing/store";
import { DEFAULT_MAX_RECORD_SECONDS } from "@/lib/shadowing/types";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminShadowing") };
}

export default async function AdminShadowingNewPage() {
  const rows = await listShadowingForAdmin();
  const nextOrder = rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 1;
  const { t } = await getTranslations("shadowingAdmin");

  return (
    <SiteShell active="admin-shadowing">
      <div className="mb-6">
        <Link href="/admin/shadowing" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài Shadowing")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t("newTitle", "Thêm bài Shadowing")}</h1>
      </div>
      <ShadowingAdminForm
        initial={{
          title: "",
          level: "",
          instructions: "",
          audioUrl: "",
          transcript: "",
          maxRecordSeconds: DEFAULT_MAX_RECORD_SECONDS,
          status: "PUBLISHED",
          order: nextOrder,
        }}
      />
    </SiteShell>
  );
}
