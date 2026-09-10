"use client";

import Link from "next/link";
import { Check, Gift, RotateCcw, Zap } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  rankPoints: number;
  streakDays: number;
  practicedToday: boolean;
};

export function HomeChallengesCard({
  rankPoints,
  streakDays,
  practicedToday,
}: Props) {
  const { t } = useTranslations("home");

  const goals = [
    {
      key: "practice",
      icon: Check,
      label: t("challengePractice", "Hoàn thành 1 bài luyện"),
      current: practicedToday ? 1 : 0,
      target: 1,
    },
    {
      key: "points",
      icon: Zap,
      label: t("challengePoints", "Kiếm 50 điểm xếp hạng"),
      current: Math.min(50, rankPoints),
      target: 50,
    },
    {
      key: "streak",
      icon: RotateCcw,
      label: t("challengeStreak", "Giữ chuỗi học 3 ngày"),
      current: Math.min(3, streakDays),
      target: 3,
    },
  ];

  const allDone = goals.every((g) => g.current >= g.target);
  const rewardXp = 115;

  return (
    <section className="wewin-card-3d p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-wewin-navy" aria-hidden />
        <h2 className="min-w-0 flex-1 text-sm font-semibold text-zinc-800">
          {t("challengesTitle", "Thử thách hằng ngày")}
        </h2>
      </div>
      <ul className="mt-4 space-y-3">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const done = goal.current >= goal.target;
          return (
            <li key={goal.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-wewin-navy text-white"
                    : "bg-wewin-accent-blue-bg text-wewin-navy"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-800">{goal.label}</p>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-wewin-navy"
                    style={{
                      width: `${Math.min(100, (goal.current / goal.target) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-zinc-500">
        {allDone
          ? t("challengesDone", "Bạn đã hoàn thành thử thách hôm nay!")
          : t(
              "challengesReward",
              { n: rewardXp },
              "Hoàn thành tất cả để nhận {n} XP!",
            )}
      </p>
      <Link
        href="/tests"
        className="mt-3 inline-block text-xs font-semibold text-wewin-navy hover:underline"
      >
        {t("challengesCta", "Luyện đề ngay >")}
      </Link>
    </section>
  );
}
