import { notFound, redirect } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import {
  getCourse,
  getDefaultCourseId,
  getProgress,
  isLessonUnlocked,
  skillProgressStats,
} from "@/lib/learn/store";
import { LEARN_SKILLS, isLearnSkill, type LearnSkill } from "@/lib/learn/types";
import { learnSkillHref } from "@/lib/learn/hrefs";
import { SiteShell } from "@/components/layout/site-shell";
import { LearnHub } from "@/components/learn/learn-hub";
import { getTranslations } from "@/i18n/server";
import type { LearnCourse, LearnProgressStore } from "@/lib/learn/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ courseSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { courseSlug } = await params;
  const { t } = await getTranslations();
  if (isLearnSkill(courseSlug)) return { title: t("meta.learn") };
  const course = await getCourse(courseSlug);
  if (!course) return { title: t("meta.learn") };
  return { title: `${course.title} | ${t("meta.learn")}` };
}

function pickNextLessonId(
  skill: LearnSkill,
  lessons: LearnCourse["lessons"],
  progress: LearnProgressStore,
): string | null {
  const skillLessons = lessons
    .filter((l) => l.skill === skill)
    .sort((a, b) => a.order - b.order);
  for (const lesson of skillLessons) {
    if (!isLessonUnlocked(lesson, skillLessons, progress)) continue;
    if (!progress.lessons[lesson.id]?.exercisePassed) return lesson.id;
  }
  return skillLessons[0]?.id ?? null;
}

export default async function LearnCourseHubPage({ params }: Props) {
  const { courseSlug } = await params;

  // Old URL `/learn/listening` → default course skill page
  if (isLearnSkill(courseSlug)) {
    const defaultId = await getDefaultCourseId();
    redirect(learnSkillHref(defaultId, courseSlug));
  }

  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const ownerKey = await getLearnOwnerKey();
  const progress = await getProgress(ownerKey);

  const skills = [];
  let completedAll = 0;
  let totalAll = 0;

  for (const skill of LEARN_SKILLS) {
    const lessons = course.lessons
      .filter((l) => l.skill === skill)
      .sort((a, b) => a.order - b.order);
    const stats = skillProgressStats(lessons, progress);
    completedAll += stats.completed;
    totalAll += stats.total;
    skills.push({
      skill,
      total: stats.total,
      completed: stats.completed,
      percent: stats.percent,
      nextLessonId: pickNextLessonId(skill, course.lessons, progress),
    });
  }

  const overallPercent =
    totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100);

  return (
    <SiteShell active="learn" wide>
      <LearnHub
        courseId={course.id}
        courseTitle={course.title}
        courseLevel={course.level}
        skills={skills}
        completedAll={completedAll}
        totalAll={totalAll}
        overallPercent={overallPercent}
      />
    </SiteShell>
  );
}
