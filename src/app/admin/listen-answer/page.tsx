import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminList } from "@/components/admin/dictation-admin-list";
import { listDictationsForAdmin } from "@/lib/dictation/store";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminListenAnswer") };
}

export default async function AdminListenAnswerPage() {
  const rows = await listDictationsForAdmin("QUESTION_ANSWER");
  const { t } = await getTranslations("listenAnswerAdmin");

  return (
    <SiteShell active="admin-listen-answer">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900">{t("title", "Bài nghe & trả lời câu hỏi")}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t(
              "desc",
              "Tạo bài nghe kèm câu hỏi ngắn; hệ thống chấm tự động theo đáp án và từ khóa đã khai báo, không dùng AI. Học viên làm tại",
            )}{" "}
            <Link href="/learn/listen-answer" className="font-medium text-wewin-navy hover:underline">
              /learn/listen-answer
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/listen-answer/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("add", "+ Thêm bài")}
        </Link>
      </div>
      <DictationAdminList rows={rows} />
    </SiteShell>
  );
}
