import { notFound } from "next/navigation";
import { getLearnOwnerKey } from "@/lib/learn/owner";
import {
  toPublicLesson,
  toPublicLessonMeta,
} from "@/lib/learn/public-lesson";
import {
  getCourse,
  getLessonContext,
  getLessonsBySkill,
  getProgress,
} from "@/lib/learn/store";
import { isLearnSkill } from "@/lib/learn/types";
import { SiteShell } from "@/components/layout/site-shell";
import { LessonPlayer } from "@/components/learn/lesson-player";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ courseSlug: string; skill: string; lessonId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params;
  const { t } = await getTranslations();
  const ctx = await getLessonContext(lessonId);
  if (!ctx) return { title: t("meta.lesson") };
  return { title: `${ctx.lesson.title} | Wewin IELTS` };
}

export default async function LearnLessonPage({ params }: Props) {
  const { courseSlug, skill: raw, lessonId } = await params;
  if (!isLearnSkill(raw)) notFound();

  const course = await getCourse(courseSlug);
  if (!course) notFound();

  const ctx = await getLessonContext(lessonId);
  if (
    !ctx ||
    ctx.course.id !== course.id ||
    ctx.lesson.skill !== raw
  ) {
    notFound();
  }

  const ownerKey = await getLearnOwnerKey();
  const skillLessons = await getLessonsBySkill(raw, course.id);
  const progress = await getProgress(ownerKey);

  return (
    <SiteShell active="learn" wide>
      <LessonPlayer
        courseId={course.id}
        skill={raw}
        lesson={toPublicLesson(ctx.lesson)}
        skillLessons={skillLessons.map(toPublicLessonMeta)}
        progress={progress}
      />
    </SiteShell>
  );
}
