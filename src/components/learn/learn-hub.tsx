"use client";

import Link from "next/link";
import {
  BookOpen,
  Ear,
  Mic,
  PenLine,
} from "lucide-react";
import type { LearnSkill } from "@/lib/learn/types";
import { LEARN_SKILLS } from "@/lib/learn/types";
import {
  learnCatalogHref,
  learnLessonHref,
  learnSkillHref,
} from "@/lib/learn/hrefs";
import { useTranslations } from "@/i18n/provider";

type SkillRow = {
  skill: LearnSkill;
  total: number;
  completed: number;
  percent: number;
  nextLessonId: string | null;
};

type Props = {
  courseId: string;
  courseTitle: string;
  courseLevel?: string;
  skills: SkillRow[];
  completedAll: number;
  totalAll: number;
  overallPercent: number;
};

const ICONS: Record<LearnSkill, typeof Ear> = {
  listening: Ear,
  reading: BookOpen,
  writing: PenLine,
  speaking: Mic,
};

export function LearnHub({
  courseId,
  courseTitle,
  courseLevel,
  skills,
  completedAll,
  totalAll,
  overallPercent,
}: Props) {
  const { t } = useTranslations("learn");
  const { t: tSkills } = useTranslations("skills");

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div data-tour="learn-course-header" className="min-w-0">
          <Link
            href={learnCatalogHref()}
            className="text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("backCatalog", "← Tất cả khóa học")}
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-wewin-navy">
            {courseLevel
              ? t("levelKicker", { level: courseLevel }, "Cấp độ {level} · Học kiến thức")
              : t("hubKicker", "Học kiến thức")}
          </p>
          <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {courseTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">{t("hubDesc", "Video + bài tập nhỏ · mở khóa từng bài")}</p>
        </div>

        <div data-tour="learn-course-progress" className="wewin-card-3d w-full shrink-0 px-3.5 py-2.5 lg:max-w-sm">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-zinc-800">
              {t("courseProgress", "Tiến độ khóa học")}
            </span>
            <span className="shrink-0 font-bold tabular-nums text-wewin-navy">
              {completedAll}/{totalAll} · {overallPercent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-wewin-navy"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      </header>

      <div data-tour="learn-course-skills" className="grid gap-3 sm:grid-cols-2">
        {LEARN_SKILLS.map((skill) => {
          const row = skills.find((s) => s.skill === skill)!;
          const Icon = ICONS[skill];
          const done = row.completed === row.total && row.total > 0;
          return (
            <Link
              key={skill}
              href={
                row.nextLessonId
                  ? learnLessonHref(courseId, skill, row.nextLessonId)
                  : learnSkillHref(courseId, skill)
              }
              className="card-outline-hover group flex flex-col overflow-hidden border-zinc-300"
            >
              <div className="flex items-center gap-3 bg-wewin-navy px-4 py-3 text-white">
                <Icon className="h-5 w-5 shrink-0 opacity-90" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">
                    {tSkills(skill)}
                  </h2>
                  <p className="text-xs text-white/85">
                    {tSkills(`vi.${skill}`)} · {t("lessonCount", { n: row.total }, "{n} bài")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 border-t border-zinc-200 px-4 py-3">
                <p className="text-sm leading-snug text-zinc-600">
                  {tSkills(`desc.${skill}`)}
                </p>
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-zinc-800">
                      {row.completed}/{row.total}{" "}
                      <span className="font-medium text-zinc-600">
                        {t("completed", "hoàn thành")}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md bg-wewin-accent-blue-bg px-2 py-1 text-xs font-bold text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                      {done ? t("review", "Ôn lại →") : t("continueLearn", "Học tiếp →")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-wewin-navy"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-sm text-zinc-500">
        {t("footerBefore", "Đã nắm kiến thức? Sang")}{" "}
        <Link href="/tests" className="font-medium text-wewin-navy hover:underline">
          {t("footerLink", "Luyện đề")}
        </Link>{" "}
        {t("footerAfter", "để áp dụng vào đề thật.")}
      </p>
    </div>
  );
}
