"use client";

import { useState } from "react";
import Link from "next/link";
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar";
import { LessonVideo } from "@/components/learn/lesson-video";
import { LessonExercises } from "@/components/learn/lesson-exercises";
import type {
  LearnProgressStore,
  LearnSkill,
} from "@/lib/learn/types";
import type { PublicLearnLesson } from "@/lib/learn/public-lesson";
import { isLessonUnlocked } from "@/lib/learn/progress-utils";
import { learnSkillHref } from "@/lib/learn/hrefs";
import { Lock } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  courseId: string;
  skill: LearnSkill;
  lesson: PublicLearnLesson;
  skillLessons: PublicLearnLesson[];
  progress: LearnProgressStore;
};

export function LessonPlayer({
  courseId,
  skill,
  lesson,
  skillLessons,
  progress,
}: Props) {
  const { t } = useTranslations("learn");
  const { t: tSkills } = useTranslations("skills");
  const unlocked = isLessonUnlocked(lesson, skillLessons, progress);
  const entry = progress.lessons[lesson.id];
  const [videoCompleted, setVideoCompleted] = useState(
    Boolean(entry?.videoCompleted),
  );

  const ordered = [...skillLessons].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  const next = idx >= 0 ? ordered[idx + 1] : undefined;
  const nextUnlocked =
    Boolean(entry?.exercisePassed) && next
      ? next.id
      : null;

  if (!unlocked) {
    return (
      <div className="card-outline px-6 py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-zinc-400" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900">{t("lessonLocked")}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
          {t("lessonLockedDesc")}
        </p>
        <Link
          href={learnSkillHref(courseId, skill)}
          className="mt-6 inline-flex rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("backCurriculum", "Quay lại lộ trình")}
        </Link>
      </div>
    );
  }

  return (
    <div className="region-split grid min-w-0 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-5 border-b border-zinc-200 p-4 sm:p-6 lg:border-b-0 lg:border-r">
        <div className="min-w-0">
          <Link
            href={learnSkillHref(courseId, skill)}
            className="text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("backSkill", {
              skill: tSkills(skill),
              vi: tSkills(`vi.${skill}`),
            })}
          </Link>
          <h1 className="mt-2 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {lesson.title}
          </h1>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {lesson.summary}
          </p>
        </div>

        <LessonVideo
          src={lesson.videoUrl}
          lessonId={lesson.id}
          initialMaxWatchedSec={entry?.maxWatchedSec ?? 0}
          alreadyCompleted={Boolean(entry?.videoCompleted)}
          onCompleted={() => setVideoCompleted(true)}
        />

        <LessonExercises
          courseId={courseId}
          lessonId={lesson.id}
          skill={skill}
          exercises={lesson.exercises}
          videoCompleted={videoCompleted}
          alreadyPassed={Boolean(entry?.exercisePassed)}
          unlockedNextId={nextUnlocked}
        />
      </div>

      <div className="min-w-0 bg-zinc-50/80 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto">
        <CurriculumSidebar
          courseId={courseId}
          skill={skill}
          lessons={ordered}
          progress={progress}
          currentLessonId={lesson.id}
        />
      </div>
    </div>
  );
}
