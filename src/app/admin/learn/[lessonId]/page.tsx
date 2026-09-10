import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, getLessonContext } from "@/lib/learn/store";
import { LearnLessonForm } from "@/components/admin/learn-lesson-form";
import { SiteShell } from "@/components/layout/site-shell";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const ctx = await getLessonContext(lessonId);
  const { t } = await getTranslations();
  return {
    title: ctx
      ? `${t("admin.editLesson")}: ${ctx.lesson.title}`
      : t("meta.adminEditLesson"),
  };
}

export default async function AdminLearnEditPage({ params }: Props) {
  const { lessonId } = await params;
  const ctx = await getLessonContext(lessonId);
  if (!ctx) notFound();
  const catalog = await getCatalog();
  const { t } = await getTranslations("admin");

  return (
    <SiteShell active="admin-learn">
      <div className="mb-6">
        <Link
          href="/admin/learn"
          className="text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("backLessons")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {t("editLesson")}
        </h1>
        <p className="mt-1 font-mono text-xs text-zinc-500">{ctx.lesson.id}</p>
      </div>
      <LearnLessonForm
        mode="edit"
        lesson={ctx.lesson}
        defaultCourseId={ctx.course.id}
        courses={catalog.courses.map((c) => ({ id: c.id, title: c.title }))}
      />
    </SiteShell>
  );
}
