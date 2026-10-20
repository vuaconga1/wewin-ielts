import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminForm } from "@/components/admin/dictation-admin-form";
import { listDictationsForAdmin } from "@/lib/dictation/store";
import { DEFAULT_DICTATION_SETTINGS } from "@/lib/dictation/types";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminDictation") };
}

export default async function AdminDictationNewPage() {
  const rows = await listDictationsForAdmin("FULL_TEXT");
  const nextOrder = rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 1;
  const { t } = await getTranslations("dictationAdmin");

  return (
    <SiteShell active="admin-dictation">
      <div className="mb-6">
        <Link href="/admin/dictation" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài chép chính tả")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {t("newTitle", "Thêm bài chép chính tả")}
        </h1>
      </div>
      <DictationAdminForm
        initial={{
          title: "",
          level: "",
          instructions: "",
          audioUrl: "",
          transcript: "",
          mode: "FULL_TEXT",
          gaps: [],
          settings: DEFAULT_DICTATION_SETTINGS,
          status: "PUBLISHED",
          order: nextOrder,
        }}
      />
    </SiteShell>
  );
}
