"use client";

import Link from "next/link";
import { BookOpen, Clock, Headphones, Mic, PenLine, Star, type LucideIcon } from "lucide-react";
import type { IeltsSkill, RecommendedTest } from "@/lib/dashboard-stats";
import { useTranslations } from "@/i18n/provider";

const SKILL_ICON: Record<IeltsSkill, LucideIcon> = {
  LISTENING: Headphones,
  READING: BookOpen,
  WRITING: PenLine,
  SPEAKING: Mic,
};

type Props = {
  tests: RecommendedTest[];
};

export function HomeRecommendedTests({ tests }: Props) {
  const { t } = useTranslations("home");
  const { t: tSkills } = useTranslations("skills");

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <Star className="h-4 w-4 shrink-0 text-wewin-gold" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("recommendedTitle", "Đề đề xuất")}
        </h2>
        <Link
          href="/tests"
          className="ml-auto text-xs font-medium text-wewin-navy hover:underline"
        >
          {t("viewAllTests", "Xem tất cả >")}
        </Link>
      </div>
      {tests.length === 0 ? (
        <div className="wewin-card-3d border-dashed px-5 py-8 text-center">
          <p className="text-sm text-zinc-600">
            {t("recommendedEmpty", "Chưa có đề trong catalog.")}
          </p>
          <Link
            href="/learn"
            className="mt-3 inline-block text-sm font-semibold text-wewin-navy hover:underline"
          >
            {t("startLearning", "Bắt đầu học")}
          </Link>
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {tests.map((test) => {
              const Icon = SKILL_ICON[test.skill];
              return (
                <Link
                  key={test.slug}
                  href={`/tests/${test.slug}`}
                  className="wewin-card-3d wewin-card-3d-hover group flex w-[min(220px,72vw)] shrink-0 flex-col gap-3 p-3 sm:w-auto"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wewin-accent-blue-bg text-wewin-navy group-hover:bg-wewin-navy group-hover:text-white">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-wewin-navy">
                      {tSkills(test.skill)}
                    </span>
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-zinc-900">
                    {test.title}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                    <span className="inline-flex min-w-0 items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {test.minutes
                          ? t("minutesLabel", { n: test.minutes }, "{n} phút")
                          : tSkills(`vi.${test.skill}`)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-wewin-navy">
                      {t("startTest", "Làm đề →")}
                    </span>
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </section>
  );
}
