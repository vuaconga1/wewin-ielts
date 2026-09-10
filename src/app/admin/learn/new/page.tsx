import Link from "next/link";
import { getCatalog, getLessonsBySkill } from "@/lib/learn/store";
import { LearnLessonForm } from "@/components/admin/learn-lesson-form";
import { SiteShell } from "@/components/layout/site-shell";
import type { LearnSkill } from "@/lib/learn/types";
import { isLearnSkill } from "@/lib/learn/types";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("meta.adminNewLesson") };
}

type Props = {
  searchParams: Promise<{ skill?: string; course?: string }>;
};

export default async function AdminLearnNewPage({ searchParams }: Props) {
  const sp = await searchParams;
  const catalog = await getCatalog();
  const skill: LearnSkill = isLearnSkill(sp.skill ?? "")
    ? (sp.skill as LearnSkill)
    : "listening";
  const courseId =
    catalog.courses.find((c) => c.id === sp.course)?.id ??
    catalog.courses[0]?.id;
  const existing = await getLessonsBySkill(skill, courseId);
  const nextOrder =
    existing.length === 0
      ? 1
      : Math.max(...existing.map((l) => l.order)) + 1;
  const { t } = await getTranslations("admin");
  const { t: ts } = await getTranslations("skills");

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
          {t("newLessonTitle")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t("newLessonDesc")} {ts(skill, skill)}: {nextOrder}.
        </p>
      </div>
      <LearnLessonForm
        mode="create"
        defaultSkill={skill}
        defaultOrder={nextOrder}
        defaultCourseId={courseId}
        courses={catalog.courses.map((c) => ({ id: c.id, title: c.title }))}
      />
    </SiteShell>
  );
}
