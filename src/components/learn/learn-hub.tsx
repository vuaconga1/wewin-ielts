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

type SkillTheme = {
  headerClass: string;
  iconBoxClass: string;
  countClass: string;
  ctaClass: string;
  progressClass: string;
  borderHoverClass: string;
};

const SKILL_THEMES: Record<LearnSkill, SkillTheme> = {
  listening: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#0d2a6b] to-[#1e40af]",
    iconBoxClass: "bg-blue-400/20 text-blue-200 ring-1 ring-blue-300/30",
    countClass: "text-blue-100/90",
    ctaClass:
      "bg-blue-50 border-blue-200/70 text-blue-800 group-hover:bg-[#001233] group-hover:text-white group-hover:border-[#001233]",
    progressClass: "bg-gradient-to-r from-blue-600 to-indigo-600",
    borderHoverClass: "hover:border-blue-400/50",
  },
  reading: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#06423b] to-[#047857]",
    iconBoxClass: "bg-emerald-400/20 text-emerald-200 ring-1 ring-emerald-300/30",
    countClass: "text-emerald-100/90",
    ctaClass:
      "bg-emerald-50 border-emerald-200/70 text-emerald-800 group-hover:bg-[#06423b] group-hover:text-white group-hover:border-[#06423b]",
    progressClass: "bg-gradient-to-r from-emerald-600 to-teal-600",
    borderHoverClass: "hover:border-emerald-400/50",
  },
  writing: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#3a1528] to-[#be123c]",
    iconBoxClass: "bg-rose-400/20 text-rose-200 ring-1 ring-rose-300/30",
    countClass: "text-rose-100/90",
    ctaClass:
      "bg-rose-50 border-rose-200/70 text-rose-800 group-hover:bg-[#3a1528] group-hover:text-white group-hover:border-[#3a1528]",
    progressClass: "bg-gradient-to-r from-rose-600 to-pink-600",
    borderHoverClass: "hover:border-rose-400/50",
  },
  speaking: {
    headerClass: "bg-gradient-to-r from-[#001233] via-[#3a2010] to-[#b45309]",
    iconBoxClass: "bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30",
    countClass: "text-amber-100/90",
    ctaClass:
      "bg-amber-50 border-amber-200/70 text-amber-900 group-hover:bg-[#3a2010] group-hover:text-white group-hover:border-[#3a2010]",
    progressClass: "bg-gradient-to-r from-amber-500 to-orange-500",
    borderHoverClass: "hover:border-amber-400/50",
  },
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
        {skills.map((row) => {
          const skill = row.skill;
          const Icon = ICONS[skill];
          if (!Icon) return null;
          const theme = SKILL_THEMES[skill] ?? SKILL_THEMES.listening;
          const done = row.completed === row.total && row.total > 0;
          return (
            <Link
              key={skill}
              href={
                row.nextLessonId
                  ? learnLessonHref(courseId, skill, row.nextLessonId)
                  : learnSkillHref(courseId, skill)
              }
              className={`card-outline-hover group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${theme.borderHoverClass}`}
            >
              <div
                className={`flex items-center gap-3 px-4 py-3.5 text-white ${theme.headerClass}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.iconBoxClass}`}
                >
                  <Icon className="h-5 w-5 opacity-95" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold leading-tight">
                    {tSkills(skill)}
                  </h2>
                  <p className={`text-xs mt-0.5 ${theme.countClass}`}>
                    {tSkills(`vi.${skill}`)} · {t("lessonCount", { n: row.total }, "{n} bài")}
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 bg-white p-4">
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
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${theme.ctaClass}`}
                    >
                      {done ? t("review", "Ôn lại →") : t("continueLearn", "Học tiếp →")}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className={`h-full rounded-full ${theme.progressClass}`}
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
