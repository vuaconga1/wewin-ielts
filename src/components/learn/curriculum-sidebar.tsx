"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import type { LearnProgressStore, LearnSkill } from "@/lib/learn/types";
import type { PublicLearnLesson } from "@/lib/learn/public-lesson";
import { isLessonUnlocked } from "@/lib/learn/progress-utils";
import { learnLessonHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type Props = {
  courseId: string;
  skill: LearnSkill;
  lessons: PublicLearnLesson[];
  progress: LearnProgressStore;
  currentLessonId: string;
};

export function CurriculumSidebar({
  courseId,
  skill,
  lessons,
  progress,
  currentLessonId,
}: Props) {
  const { t } = useTranslations("learn");

  return (
    <aside className="h-full">
      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {t("curriculum")}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-zinc-900">
          {t("lessonsCount", { n: lessons.length })}
        </p>
      </div>
      <ol className="max-h-[min(70vh,520px)] space-y-0.5 overflow-y-auto p-2 lg:max-h-none">
        {lessons.map((lesson, i) => {
          const unlocked = isLessonUnlocked(lesson, lessons, progress);
          const done = Boolean(progress.lessons[lesson.id]?.exercisePassed);
          const active = lesson.id === currentLessonId;
          const videoDone = Boolean(
            progress.lessons[lesson.id]?.videoCompleted,
          );

          const inner = (
            <>
              <span className="mt-0.5 shrink-0">
                {!unlocked ? (
                  <Lock className="h-4 w-4 text-zinc-400" />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : active ? (
                  <PlayCircle className="h-4 w-4 text-wewin-navy" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-300" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-medium leading-snug">
                  {i + 1}. {lesson.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">
                  {!unlocked
                    ? t("locked")
                    : done
                      ? t("done")
                      : videoDone
                        ? t("doExercises")
                        : t("watchVideo")}
                </span>
              </span>
            </>
          );

          if (!unlocked) {
            return (
              <li key={lesson.id}>
                <div className="flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-zinc-400">
                  {inner}
                </div>
              </li>
            );
          }

          return (
            <li key={lesson.id}>
              <Link
                href={learnLessonHref(courseId, skill, lesson.id)}
                className={`flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition ${
                  active
                    ? "bg-wewin-accent-blue-bg text-wewin-navy"
                    : "text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
