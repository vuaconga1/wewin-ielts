import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminForm } from "@/components/admin/dictation-admin-form";
import { listDictationsForAdmin } from "@/lib/dictation/store";
import { DEFAULT_DICTATION_SETTINGS } from "@/lib/dictation/types";
import { getTranslations } from "@/i18n/server";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminListenAnswer") };
}

export default async function AdminListenAnswerNewPage() {
  await requireAdminPage();
  const rows = await listDictationsForAdmin("QUESTION_ANSWER");
  const nextOrder = rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 1;
  const { t } = await getTranslations("listenAnswerAdmin");

  return (
    <SiteShell active="admin-listen-answer">
      <div className="mb-6">
        <Link href="/admin/listen-answer" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài nghe & trả lời")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {t("newTitle", "Thêm bài nghe & trả lời câu hỏi")}
        </h1>
      </div>
      <DictationAdminForm
        initial={{
          title: "",
          level: "",
          instructions: "",
          audioUrl: "",
          transcript: "",
          mode: "QUESTION_ANSWER",
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
