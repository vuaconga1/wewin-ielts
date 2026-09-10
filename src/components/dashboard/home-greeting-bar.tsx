"use client";

import { Flame, Star, Trophy } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  dateLabel: string;
  greetingKey: "morning" | "afternoon" | "evening";
  givenName: string;
  progressPercent: number;
  streakDays: number;
  rankPoints: number | null;
  rankPlace: number | null;
};

export function HomeGreetingBar({
  dateLabel,
  greetingKey,
  givenName,
  progressPercent,
  streakDays,
  rankPoints,
  rankPlace,
}: Props) {
  const { t } = useTranslations("home");
  const { t: tRoot } = useTranslations();

  return (
    <header className="wewin-card-3d flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm text-zinc-500">{dateLabel}</p>
        <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
          {tRoot(`greeting.${greetingKey}`)}, {givenName}!
        </h1>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-wewin-navy/15 bg-wewin-accent-blue-bg px-2.5 py-1 text-xs font-semibold text-wewin-navy">
          <span
            className="relative inline-flex h-5 w-5 items-center justify-center"
            aria-hidden
          >
            <svg viewBox="0 0 36 36" className="absolute inset-0 h-5 w-5 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-wewin-navy/20"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(Math.min(100, progressPercent) / 100) * 88} 88`}
                className="text-wewin-navy"
              />
            </svg>
          </span>
          {t("chipProgress", { n: progressPercent }, "{n}%")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-wewin-navy/15 bg-white px-2.5 py-1 text-xs font-semibold text-wewin-navy">
          <Flame className="h-3.5 w-3.5 text-wewin-gold" aria-hidden />
          {t("chipStreak", { n: streakDays }, "{n} ngày")}
        </span>
        {rankPoints != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-wewin-navy/15 bg-white px-2.5 py-1 text-xs font-semibold text-wewin-navy">
            <Star className="h-3.5 w-3.5 text-wewin-gold" aria-hidden />
            {t("chipPoints", { n: rankPoints }, "{n} điểm")}
          </span>
        ) : null}
        {rankPlace != null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-wewin-navy/15 bg-white px-2.5 py-1 text-xs font-semibold text-wewin-navy">
            <Trophy className="h-3.5 w-3.5 text-wewin-gold" aria-hidden />
            {t("chipRank", { n: rankPlace }, "#{n}")}
          </span>
        ) : null}
      </div>
    </header>
  );
}
