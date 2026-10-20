import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminForm } from "@/components/admin/dictation-admin-form";
import { listDictationsForAdmin } from "@/lib/dictation/store";
import { DEFAULT_DICTATION_SETTINGS } from "@/lib/dictation/types";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminFillBlank") };
}

export default async function AdminFillBlankNewPage() {
  const rows = await listDictationsForAdmin("FILL_BLANK");
  const nextOrder = rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 1;
  const { t } = await getTranslations("fillBlankAdmin");

  return (
    <SiteShell active="admin-fill-blank">
      <div className="mb-6">
        <Link href="/admin/fill-blank" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài nghe điền từ")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {t("newTitle", "Thêm bài nghe điền từ")}
        </h1>
      </div>
      <DictationAdminForm
        initial={{
          title: "",
          level: "",
          instructions: "",
          audioUrl: "",
          transcript: "",
          mode: "FILL_BLANK",
          gaps: [],
          questions: [],
          settings: DEFAULT_DICTATION_SETTINGS,
          status: "PUBLISHED",
          order: nextOrder,
        }}
      />
    </SiteShell>
  );
}
