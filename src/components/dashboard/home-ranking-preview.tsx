"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { formatPoints, type RankingEntry } from "@/lib/ranking-shared";
import { useTranslations } from "@/i18n/provider";

type Props = {
  entries: RankingEntry[];
  intlLocale: string;
};

function toneForRank(rank: number) {
  if (rank === 1) return "bg-gradient-to-br from-amber-300 to-wewin-gold text-wewin-navy";
  if (rank === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 text-wewin-navy";
  if (rank === 3) return "bg-gradient-to-br from-orange-200 to-amber-700 text-white";
  return "bg-wewin-navy text-white";
}

export function HomeRankingPreview({ entries, intlLocale }: Props) {
  const { t } = useTranslations("home");
  const top = entries.slice(0, 3);

  return (
    <section className="wewin-card-3d p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-wewin-gold" aria-hidden />
        <h2 className="min-w-0 flex-1 text-sm font-semibold text-zinc-800">
          {t("rankingPreviewTitle", "Bảng xếp hạng")}
        </h2>
        <Link
          href="/ranking"
          className="shrink-0 text-xs font-medium text-wewin-navy hover:underline"
        >
          {t("viewAllRanking", "Xem tất cả >")}
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          {t(
            "rankingEmpty",
            "Chưa có xếp hạng. Hoàn thành Listening/Reading để ghi điểm.",
          )}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {top.map((entry) => (
            <li key={entry.userId} className="flex min-w-0 items-center gap-3">
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${toneForRank(entry.rank)}`}
              >
                {entry.rank}
              </span>
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wewin-accent-blue-bg text-xs font-semibold text-wewin-navy"
                aria-hidden
              >
                {entry.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {entry.username}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {t("rankingAttempts", { n: entry.attemptCount }, "{n} bài")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-wewin-navy">
                {formatPoints(entry.points, intlLocale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
