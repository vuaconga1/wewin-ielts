"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import {
  SKILL_LABEL,
  type HeroNext,
} from "@/lib/dashboard-stats";
import { useTranslations } from "@/i18n/provider";

type Props = {
  hero: HeroNext;
};

export function HomeContinueCard({ hero }: Props) {
  const { t } = useTranslations("home");
  const { t: tSkills } = useTranslations("skills");

  if (hero.kind === "empty") {
    return (
      <section className="wewin-card-3d flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-wewin-navy" aria-hidden />
          <h2 className="text-sm font-semibold text-zinc-800">
            {t("continueTitle", "Tiếp tục học")}
          </h2>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          {t("continueEmpty", "Chưa có bài đang làm. Bắt đầu học hoặc chọn đề luyện.")}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link
            href="/learn"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover sm:flex-none"
          >
            {t("startLearning", "Bắt đầu học")}
          </Link>
          <Link
            href="/tests"
            className="inline-flex items-center justify-center rounded-xl border border-wewin-navy/20 px-4 py-2.5 text-sm font-semibold text-wewin-navy hover:bg-wewin-accent-blue-bg"
          >
            {t("viewTests", "Xem luyện đề")}
          </Link>
        </div>
      </section>
    );
  }

  const progressHint =
    hero.kind === "resume"
      ? t("continueInProgress", "Đang làm dở")
      : t("continueSuggested", "Đề gợi ý tiếp theo");

  return (
    <section className="wewin-card-3d flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Play className="h-4 w-4 text-wewin-navy" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("continueTitle", "Tiếp tục học")}
        </h2>
      </div>
      <div className="mt-4 flex min-w-0 flex-1 gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-wewin-navy text-lg font-bold text-white">
          {SKILL_LABEL[hero.skill].slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-wewin-navy">{progressHint}</p>
          <h3 className="mt-0.5 break-words text-base font-bold text-zinc-900">
            {hero.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {tSkills(hero.skill)} · {tSkills(`vi.${hero.skill}`)}
            {hero.minutes
              ? ` · ${t("minutesLabel", { n: hero.minutes }, "{n} phút")}`
              : ""}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-wewin-navy"
              style={{ width: hero.kind === "resume" ? "35%" : "0%" }}
            />
          </div>
        </div>
      </div>
      <Link
        href={hero.href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
      >
        <Play className="h-4 w-4 fill-white" aria-hidden />
        {hero.kind === "resume"
          ? t("resume", "Tiếp tục")
          : t("practiceNow", "Luyện ngay")}
      </Link>
    </section>
  );
}
