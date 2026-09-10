"use client";

import Link from "next/link";
import {
  BookOpen,
  ChartColumn,
  Medal,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  progress: {
    finishedAttempts: number;
    skillsTried: number;
    avgPercent: number | null;
  };
  rankPoints: number | null;
};

export function HomeStatsCard({ progress, rankPoints }: Props) {
  const { t } = useTranslations("home");
  const { t: tCommon } = useTranslations("common");
  const dash = tCommon("dash", "—");

  const tiles = [
    {
      key: "submitted",
      icon: BookOpen,
      value: String(progress.finishedAttempts),
      label: t("submitted", "Bài đã nộp"),
    },
    {
      key: "skills",
      icon: Sparkles,
      value: `${progress.skillsTried}/4`,
      label: t("skillsTried", "Kỹ năng đã luyện"),
    },
    {
      key: "avg",
      icon: ChartColumn,
      value:
        progress.avgPercent != null ? `${progress.avgPercent}%` : dash,
      label: t("avgScore", "Điểm trung bình"),
    },
    {
      key: "points",
      icon: Medal,
      value: rankPoints != null ? String(rankPoints) : dash,
      label: t("rankPoints", "Điểm xếp hạng"),
    },
  ];

  return (
    <section className="wewin-card-3d flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("statsTitle", "Thống kê học tập")}
        </h2>
        <Link
          href="/account/attempts"
          className="shrink-0 text-xs font-medium text-wewin-navy hover:underline"
        >
          {t("statsDetail", "Xem thống kê chi tiết >")}
        </Link>
      </div>
      <div className="mt-4 grid flex-1 grid-cols-2 gap-2.5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.key}
              className="rounded-xl border border-wewin-navy/10 bg-wewin-bg/80 px-3 py-3"
            >
              <Icon className="h-4 w-4 text-wewin-navy" aria-hidden />
              <p className="mt-2 text-lg font-bold tabular-nums text-zinc-900">
                {tile.value}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{tile.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
