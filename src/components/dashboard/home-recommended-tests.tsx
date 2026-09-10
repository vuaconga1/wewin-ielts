"use client";

import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { RecommendedTest } from "@/lib/dashboard-stats";
import { useTranslations } from "@/i18n/provider";

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
          {tests.map((test) => (
            <Link
              key={test.slug}
              href={`/tests/${test.slug}`}
              className="wewin-card-3d wewin-card-3d-hover group relative w-[min(200px,68vw)] shrink-0 overflow-hidden sm:w-auto"
            >
              <div className="relative flex h-32 flex-col justify-between bg-gradient-to-br from-wewin-accent-blue-bg to-white p-3">
                <span className="w-fit rounded-md bg-wewin-navy px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {tSkills(test.skill)}
                </span>
                <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-wewin-navy text-white shadow-md transition group-hover:bg-wewin-navy-hover">
                  <Play className="h-3.5 w-3.5 fill-white" aria-hidden />
                </span>
              </div>
              <div className="space-y-1 border-t border-zinc-100 p-3">
                <p className="line-clamp-2 text-sm font-bold text-zinc-900">
                  {test.title}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-zinc-500">
                    {tSkills(`vi.${test.skill}`)}
                    {test.minutes
                      ? ` · ${t("minutesLabel", { n: test.minutes }, "{n} phút")}`
                      : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
