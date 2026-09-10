import { notFound, redirect } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import { toPublicLessonMeta } from "@/lib/learn/public-lesson";
import {
  getCourse,
  getDefaultCourseId,
  getLessonsBySkill,
  getProgress,
  skillProgressStats,
} from "@/lib/learn/store";
import { isLearnSkill } from "@/lib/learn/types";
import { learnLessonHref } from "@/lib/learn/hrefs";
import { SiteShell } from "@/components/layout/site-shell";
import { SkillLessons } from "@/components/learn/skill-lessons";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ courseSlug: string; skill: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { courseSlug, skill } = await params;
  const { t } = await getTranslations();
  if (!isLearnSkill(skill) && isLearnSkill(courseSlug)) {
    return { title: t("meta.lesson") };
  }
  if (!isLearnSkill(skill)) return { title: t("meta.learnSkill") };
  const course = await getCourse(courseSlug);
  const skillLabel = t(`skills.${skill}`);
  if (!course) return { title: `${skillLabel} · ${t("meta.learn")}` };
  return {
    title: `${skillLabel} · ${course.title}`,
  };
}

export default async function LearnSkillPage({ params }: Props) {
  const { courseSlug, skill: raw } = await params;

  // Old URL `/learn/{skill}/{lessonId}`
  if (isLearnSkill(courseSlug) && !isLearnSkill(raw)) {
    const defaultId = await getDefaultCourseId();
    redirect(learnLessonHref(defaultId, courseSlug, raw));
  }

  if (!isLearnSkill(raw)) notFound();
  const skill = raw;

  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const ownerKey = await getLearnOwnerKey();
  const lessons = await getLessonsBySkill(skill, course.id);
  const progress = await getProgress(ownerKey);
  const stats = skillProgressStats(lessons, progress);

  return (
    <SiteShell active="learn" wide>
      <SkillLessons
        courseId={course.id}
        skill={skill}
        lessons={lessons.map(toPublicLessonMeta)}
        progress={progress}
        percent={stats.percent}
        completed={stats.completed}
        total={stats.total}
      />
    </SiteShell>
  );
}
