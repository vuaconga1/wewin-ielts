import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { DictationAdminForm } from "@/components/admin/dictation-admin-form";
import { getDictationForAdmin } from "@/lib/dictation/store";
import { adminListeningExerciseHref } from "@/lib/learn/hrefs";
import { getTranslations } from "@/i18n/server";
import { requireAdminPage } from "@/lib/auth/page-guards";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminFillBlank") };
}

export default async function AdminFillBlankEditPage({ params }: Props) {
  await requireAdminPage();
  const { id } = await params;
  const exercise = await getDictationForAdmin(id);
  if (!exercise) notFound();
  if (exercise.mode !== "FILL_BLANK") redirect(`${adminListeningExerciseHref(exercise.mode)}/${id}`);
  const { t } = await getTranslations("fillBlankAdmin");

  return (
    <SiteShell active="admin-fill-blank">
      <div className="mb-6">
        <Link href="/admin/fill-blank" className="text-sm font-medium text-wewin-navy hover:underline">
          {t("back", "← Danh sách bài nghe điền từ")}
        </Link>
        <h1 className="mt-2 break-words text-2xl font-bold text-zinc-900">
          {t("editTitle", "Sửa bài nghe điền từ")}
        </h1>
      </div>
      <DictationAdminForm
        initial={{
          id: exercise.id,
          title: exercise.title,
          level: exercise.level ?? "",
          instructions: exercise.instructions ?? "",
          audioUrl: exercise.audioUrl,
          transcript: exercise.transcript,
          mode: exercise.mode,
          gaps: exercise.gaps,
          questions: exercise.questions,
          settings: exercise.settings,
          status: exercise.status,
          order: exercise.order,
        }}
      />
    </SiteShell>
  );
}
