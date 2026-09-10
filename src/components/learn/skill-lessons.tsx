"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lock, Play } from "lucide-react";
import type { LearnProgressStore, LearnSkill } from "@/lib/learn/types";
import type { PublicLearnLesson } from "@/lib/learn/public-lesson";
import { isLessonUnlocked } from "@/lib/learn/progress-utils";
import { learnCourseHref, learnLessonHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type Props = {
  courseId: string;
  skill: LearnSkill;
  lessons: PublicLearnLesson[];
  progress: LearnProgressStore;
  percent: number;
  completed: number;
  total: number;
};

export function SkillLessons({
  courseId,
  skill,
  lessons,
  progress,
  percent,
  completed,
  total,
}: Props) {
  const { t } = useTranslations("learn");
  const { t: tSkills } = useTranslations("skills");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div data-tour="learn-skill-header" className="min-w-0">
          <Link
            href={learnCourseHref(courseId)}
            className="text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("backHub", "← Học 4 kỹ năng")}
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {tSkills(skill)}{" "}
            <span className="text-zinc-400">· {tSkills(`vi.${skill}`)}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{t("watchHint")}</p>
        </div>
        <div data-tour="learn-skill-progress" className="wewin-card-3d w-full shrink-0 px-3.5 py-2.5 sm:max-w-xs">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-zinc-800">{t("progress")}</span>
            <span className="shrink-0 font-bold tabular-nums text-wewin-navy">
              {completed}/{total} · {percent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-wewin-navy"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </header>

      {lessons.length === 0 ? (
        <div
          data-tour="learn-skill-lessons"
          className="wewin-card-3d border-dashed px-6 py-10 text-center"
        >
          <p className="font-semibold text-zinc-800">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-zinc-600">{t("emptyDesc")}</p>
        </div>
      ) : (
        <ol data-tour="learn-skill-lessons" className="space-y-2.5">
          {lessons.map((lesson, i) => {
            const unlocked = isLessonUnlocked(lesson, lessons, progress);
            const done = Boolean(progress.lessons[lesson.id]?.exercisePassed);
            const videoDone = Boolean(
              progress.lessons[lesson.id]?.videoCompleted,
            );

            const card = (
              <div
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
                  unlocked
                    ? "wewin-card-3d wewin-card-3d-hover border-zinc-300"
                    : "border-zinc-200 bg-zinc-50/90"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    done
                      ? "bg-emerald-100 text-emerald-700"
                      : unlocked
                        ? "bg-wewin-accent-blue-bg text-wewin-accent-blue"
                        : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words font-semibold ${unlocked ? "text-zinc-900" : "text-zinc-500"}`}
                  >
                    {lesson.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                    {lesson.summary}
                  </p>
                </div>
                <span className="shrink-0">
                  {!unlocked ? (
                    <Lock className="h-5 w-5 text-zinc-400" />
                  ) : done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : videoDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-wewin-navy">
                      <Circle className="h-4 w-4" /> {t("exercises")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-wewin-navy px-3 py-1.5 text-xs font-semibold text-white">
                      <Play className="h-3.5 w-3.5 fill-white" /> {t("study")}
                    </span>
                  )}
                </span>
              </div>
            );

            if (!unlocked) {
              return (
                <li key={lesson.id} title={t("unlockTitle")}>
                  {card}
                </li>
              );
            }

            return (
              <li key={lesson.id}>
                <Link
                  href={learnLessonHref(courseId, skill, lesson.id)}
                  className="block transition hover:opacity-95"
                >
                  {card}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
