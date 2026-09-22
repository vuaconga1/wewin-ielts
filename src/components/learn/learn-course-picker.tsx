"use client";

import Link from "next/link";
import { BookMarked, GraduationCap } from "lucide-react";
import { learnCourseHref, learnVocabGrammarHref } from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

export type CourseCard = {
  id: string;
  title: string;
  description: string;
  level?: string;
  total: number;
  completed: number;
  percent: number;
};

export type VocabGrammarCard = {
  total: number;
  completed: number;
  percent: number;
};

type Props = {
  courses: CourseCard[];
  vocabGrammar: VocabGrammarCard;
};

export function LearnCoursePicker({ courses, vocabGrammar }: Props) {
  const { t } = useTranslations("learn");
  const vgDone =
    vocabGrammar.completed === vocabGrammar.total && vocabGrammar.total > 0;

  return (
    <div className="space-y-4">
      <header data-tour="learn-header" className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-wewin-navy">
          {t("catalogKicker", "Học 4 kỹ năng")}
        </p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {t("catalogTitle", "Chọn khóa học")}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "catalogDesc",
            "Chọn khóa học 4 kỹ năng hoặc học từ vựng và ngữ pháp.",
          )}
        </p>
      </header>

      <div data-tour="learn-courses" className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const done = course.completed === course.total && course.total > 0;
          return (
            <Link
              key={course.id}
              href={learnCourseHref(course.id)}
              prefetch={false}
              className="card-outline-hover group flex min-w-0 flex-col overflow-hidden border-zinc-300"
            >
              <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white">
                <GraduationCap className="h-5 w-5 shrink-0 opacity-90" />
                <div className="min-w-0">
                  {course.level ? (
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                      {t("levelKicker", { level: course.level }, "Cấp độ {level}")}
                    </p>
                  ) : null}
                  <h2 className="truncate text-base font-bold leading-tight">
                    {course.title}
                  </h2>
                  <p className="text-xs text-white/85">
                    {t("lessonCount", { n: course.total }, "{n} bài")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 border-t border-zinc-200 px-4 py-3">
                <p className="line-clamp-3 text-sm leading-snug break-words text-zinc-600">
                  {course.description}
                </p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-sm font-semibold tabular-nums text-zinc-800">
                      {course.completed}/{course.total}{" "}
                      <span className="font-medium text-zinc-600">
                        {t("completed", "hoàn thành")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md bg-wewin-accent-blue-bg px-2 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                      {done
                        ? t("review", "Ôn lại →")
                        : t("openCourse", "Vào khóa học →")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-wewin-navy"
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        <Link
          href={learnVocabGrammarHref()}
          prefetch={false}
          className="card-outline-hover group flex min-w-0 flex-col overflow-hidden border-zinc-300"
        >
          <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white">
            <BookMarked className="h-5 w-5 shrink-0 opacity-90" />
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold leading-tight">
                {t("vocabGrammarCard", "Từ vựng và ngữ pháp")}
              </h2>
              <p className="text-xs text-white/85">
                {t("vocabGrammarSub", "Từ vựng · Ngữ pháp")}
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 border-t border-zinc-200 px-4 py-3">
            <p className="line-clamp-3 text-sm leading-snug break-words text-zinc-600">
              {t(
                "vocabGrammarDesc",
                "Học từ vựng và ngữ pháp IELTS qua video, lý thuyết và bài tập.",
              )}
            </p>
            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 text-sm font-semibold tabular-nums text-zinc-800">
                  {vocabGrammar.completed}/{vocabGrammar.total}{" "}
                  <span className="font-medium text-zinc-600">
                    {t("completed", "hoàn thành")}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-wewin-accent-blue-bg px-2 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                  {vgDone
                    ? t("review", "Ôn lại →")
                    : t("openVocabGrammar", "Vào học →")}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-wewin-navy"
                  style={{ width: `${vocabGrammar.percent}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        {courses.length === 0 ? (
          <div className="wewin-card-3d border-dashed px-6 py-10 text-center sm:col-span-2">
            <p className="font-semibold text-zinc-800">
              {t("emptyCoursesTitle", "Chưa có khóa học")}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {t("emptyCoursesDesc", "Nội dung sẽ được cập nhật sớm.")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
