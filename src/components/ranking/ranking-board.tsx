"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  Star,
  Trophy,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { PaginationControls } from "@/components/ui/pagination";
import {
  formatPoints,
  shiftDay,
  shiftMonth,
  type RankingEntry,
  type RankingPeriod,
  type RankingResult,
} from "@/lib/ranking-shared";

type Props = {
  data: RankingResult;
  intlLocale: string;
  isLoggedIn: boolean;
};

function buildHref(
  period: RankingPeriod,
  year: number,
  month: number,
  day: number,
): string {
  const q = new URLSearchParams({ period });
  if (period !== "all") {
    q.set("year", String(year));
    q.set("month", String(month));
    if (period === "day" || period === "week") {
      q.set("day", String(day));
    }
  }
  return `/ranking?${q.toString()}`;
}

function Avatar({
  initials,
  size = "md",
  tone = "navy",
  className = "",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "navy" | "gold" | "silver" | "bronze";
  className?: string;
}) {
  const sizeCls =
    size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  const toneCls =
    tone === "gold"
      ? "bg-gradient-to-br from-amber-300 to-wewin-gold text-wewin-navy"
      : tone === "silver"
        ? "bg-gradient-to-br from-slate-200 to-slate-400 text-wewin-navy"
        : tone === "bronze"
          ? "bg-gradient-to-br from-orange-200 to-amber-700 text-white"
          : "bg-wewin-navy text-white";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeCls} ${toneCls} ${className}`}
    >
      {initials}
    </span>
  );
}

function PodiumCard({
  entry,
  place,
  intlLocale,
}: {
  entry: RankingEntry;
  place: 1 | 2 | 3;
  intlLocale: string;
}) {
  const height =
    place === 1 ? "min-h-[220px] sm:min-h-[260px]" : place === 2 ? "min-h-[190px] sm:min-h-[220px]" : "min-h-[170px] sm:min-h-[200px]";
  const block =
    place === 1
      ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 shadow-amber-500/40"
      : place === 2
        ? "bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 shadow-slate-600/40"
        : "bg-gradient-to-b from-orange-400 via-orange-600 to-orange-800 shadow-orange-600/40";
  const textOnBlock = "text-white";
  const Icon = place === 1 ? Crown : Medal;
  const tone = place === 1 ? "gold" : place === 2 ? "silver" : "bronze";
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  return (
    <div
      className={`flex w-full max-w-[11rem] flex-col items-center ${
        place === 1 ? "order-first sm:order-none sm:z-10" : ""
      }`}
    >
      <div className="mb-2 flex flex-col items-center gap-1.5 px-1 text-center">
        {place === 1 ? (
          <span className="animate-wewin-float text-3xl leading-none drop-shadow" aria-hidden>
            👑
          </span>
        ) : (
          <Icon
            className={`h-5 w-5 ${place === 2 ? "text-slate-500" : "text-orange-600"}`}
            aria-hidden
          />
        )}
        <Avatar
          initials={entry.initials}
          size="lg"
          tone={tone}
          className="shadow-md ring-4 ring-white"
        />
        <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold text-wewin-navy">
          {entry.username}
        </p>
      </div>
      <div
        className={`relative flex w-full flex-1 flex-col items-center justify-start overflow-hidden rounded-t-2xl px-3 pt-4 pb-3 shadow-lg ring-1 ring-white/30 ${height} ${block} ${textOnBlock}`}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent"
          aria-hidden
        />
        <span className="absolute right-2 top-2 text-2xl leading-none drop-shadow" aria-hidden>
          {medal}
        </span>
        <p className="relative text-lg font-bold tabular-nums drop-shadow sm:text-2xl">
          {formatPoints(entry.points, intlLocale)}
        </p>
        <span
          className="relative mt-auto text-6xl font-black leading-none text-white/25"
          aria-hidden
        >
          {place}
        </span>
      </div>
    </div>
  );
}

const PERIODS: RankingPeriod[] = ["day", "week", "month", "all"];

export function RankingBoard({ data, intlLocale, isLoggedIn }: Props) {
  const { t } = useTranslations("ranking");
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { period, year, month, day, entries, currentUser, updatedAt } = data;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(rest.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageEntries = rest.slice((safePage - 1) * pageSize, safePage * pageSize);
  const first = top3.find((e) => e.rank === 1);
  const second = top3.find((e) => e.rank === 2);
  const third = top3.find((e) => e.rank === 3);

  const updatedLabel = new Date(updatedAt).toLocaleString(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  function goPeriod(next: RankingPeriod) {
    router.push(buildHref(next, year, month, day));
  }

  function navigateAnchor(delta: number) {
    if (period === "all") return;
    if (period === "month") {
      const next = shiftMonth(year, month, delta);
      router.push(buildHref("month", next.year, next.month, 1));
      return;
    }
    const step = period === "week" ? delta * 7 : delta;
    const next = shiftDay(year, month, day, step);
    router.push(buildHref(period, next.year, next.month, next.day));
  }

  const navigatorLabel =
    period === "month"
      ? t("monthLabel", { month, year })
      : period === "week"
        ? t("weekLabel", { day, month, year })
        : period === "day"
          ? t("dayLabel", { day, month, year })
          : t("allTime");

  return (
    <div className="min-w-0 pb-24">
      <div
        data-tour="ranking-header"
        className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <Link
            href="/"
            className="mb-2 inline-block text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("back")}
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-wewin-navy sm:text-3xl">
            <Trophy className="hidden h-7 w-7 shrink-0 text-wewin-gold sm:block" aria-hidden />
            <span className="min-w-0 break-words">{t("title")}</span>
            <span className="text-2xl leading-none" aria-hidden>
              ✨
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("subtitle", "Luyện đề mỗi ngày, tích điểm và leo top cùng WEWIN!")}
          </p>
        </div>

        <div
          className="flex w-full min-w-0 flex-wrap gap-1 rounded-full border border-wewin-border bg-white p-1 sm:w-auto sm:justify-end"
          role="tablist"
          aria-label={t("periodAria")}
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => goPeriod(p)}
              className={`min-w-0 flex-1 rounded-full px-3 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm ${
                period === p
                  ? "bg-wewin-navy text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {t(`period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {period !== "all" ? (
        <div className="mb-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateAnchor(-1)}
            className="rounded-lg border border-wewin-border bg-white p-2 text-wewin-navy hover:bg-zinc-50"
            aria-label={t("prev")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="min-w-0 text-center text-sm font-bold uppercase tracking-wide text-wewin-navy sm:text-base">
            {navigatorLabel}
          </p>
          <button
            type="button"
            onClick={() => navigateAnchor(1)}
            className="rounded-lg border border-wewin-border bg-white p-2 text-wewin-navy hover:bg-zinc-50"
            aria-label={t("next")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <p className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-wewin-navy">
          {navigatorLabel}
        </p>
      )}

      <p className="mb-6 text-center text-xs text-zinc-500">
        {t("updatedAt", { time: updatedLabel })}
      </p>

      {entries.length === 0 ? (
        <div
          data-tour="ranking-podium"
          className="wewin-card-3d rounded-2xl px-4 py-12 text-center"
        >
          <Trophy className="mx-auto mb-3 h-10 w-10 text-wewin-accent-blue/50" aria-hidden />
          <p className="font-semibold text-wewin-navy">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-zinc-500">{t("emptyDesc")}</p>
          <Link
            href="/tests"
            className="mt-4 inline-block text-sm font-medium text-wewin-navy hover:underline"
          >
            {t("emptyAction")}
          </Link>
        </div>
      ) : (
        <>
          {(first || second || third) && (
            <div
              data-tour="ranking-podium"
              className="relative mb-6 flex flex-col items-end justify-center gap-4 sm:flex-row sm:items-end sm:gap-3 md:gap-6"
            >
              <div
                className="pointer-events-none absolute bottom-0 left-0 hidden select-none flex-col items-center xl:flex"
                aria-hidden
              >
                <span className="animate-wewin-float text-7xl drop-shadow-lg">🏆</span>
                <span className="mt-2 flex gap-2 text-2xl">
                  <span>🎉</span>
                  <span>⭐</span>
                  <span>🎯</span>
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-0 hidden select-none xl:block">
                <div className="relative mb-2 ml-auto w-40 rounded-2xl bg-white px-3 py-2 text-center text-xs font-semibold text-wewin-navy shadow-md ring-1 ring-wewin-border">
                  {t("mascotCheer", "Cố lên! Top 1 đang chờ bạn đó 🚀")}
                  <span className="absolute -bottom-1.5 right-10 h-3 w-3 rotate-45 bg-white ring-1 ring-wewin-border [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
                </div>
                <Image
                  src="/branding/wewin-mascot-hero.png"
                  alt=""
                  width={220}
                  height={260}
                  className="animate-wewin-float ml-auto h-auto w-36 drop-shadow-xl 2xl:w-44"
                />
              </div>
              {second ? (
                <div className="flex w-full justify-center sm:w-auto sm:flex-1 sm:justify-end">
                  <PodiumCard entry={second} place={2} intlLocale={intlLocale} />
                </div>
              ) : (
                <div className="hidden flex-1 sm:block" />
              )}
              {first ? (
                <div className="flex w-full justify-center sm:w-auto sm:flex-1 sm:justify-center">
                  <PodiumCard entry={first} place={1} intlLocale={intlLocale} />
                </div>
              ) : null}
              {third ? (
                <div className="flex w-full justify-center sm:w-auto sm:flex-1 sm:justify-start">
                  <PodiumCard entry={third} place={3} intlLocale={intlLocale} />
                </div>
              ) : (
                <div className="hidden flex-1 sm:block" />
              )}
            </div>
          )}

          {rest.length > 0 ? (
            <div className="relative">
              <span
                className="pointer-events-none absolute -left-3 -top-5 z-10 -rotate-12 select-none text-4xl drop-shadow-md"
                aria-hidden
              >
                🏆
              </span>
              <span
                className="pointer-events-none absolute -right-2 -top-4 z-10 rotate-12 select-none text-3xl drop-shadow-md"
                aria-hidden
              >
                🏅
              </span>
              <span
                className="pointer-events-none absolute -bottom-3 -right-2 z-10 select-none text-2xl drop-shadow"
                aria-hidden
              >
                ⭐
              </span>
            <ul className="wewin-card-3d overflow-hidden rounded-2xl">
              <li className="flex items-center justify-center gap-2 border-b border-wewin-border bg-gradient-to-r from-wewin-navy via-indigo-900 to-wewin-navy px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-wewin-gold-soft">
                <Trophy className="h-4 w-4" aria-hidden />
                {t("othersTitle", "Bảng vàng chiến binh")}
              </li>
              {pageEntries.map((entry) => {
                const isYou = currentUser?.userId === entry.userId;
                const topTen = entry.rank <= 10;
                return (
                  <li
                    key={entry.userId}
                    className={`flex min-w-0 items-center gap-3 border-b border-wewin-border px-3 py-3 transition-colors last:border-b-0 hover:bg-wewin-accent-blue-bg/40 sm:gap-4 sm:px-4 ${
                      isYou ? "bg-wewin-accent-blue-bg/50" : ""
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        topTen
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-300"
                          : "bg-wewin-accent-blue-bg text-wewin-navy"
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <Avatar initials={entry.initials} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {entry.username}
                        {isYou ? (
                          <span className="ml-1 text-xs font-medium text-wewin-accent-blue">
                            ({t("you")})
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-zinc-800">
                      <Star className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                      {formatPoints(entry.points, intlLocale)} {t("pointsSuffix", "điểm")}
                    </span>
                  </li>
                );
              })}
            </ul>
            </div>
          ) : null}
          <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {currentUser ? (
        <div
          data-tour="ranking-you"
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-wewin-navy/20 bg-wewin-navy text-white lg:left-[var(--wewin-sidebar-width)]"
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="shrink-0 text-sm font-semibold">
              {t("yourRank", { rank: currentUser.rank })}
            </span>
            <Avatar initials={currentUser.initials} size="sm" />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {currentUser.username}
            </p>
            <span className="shrink-0 text-sm font-bold tabular-nums">
              {formatPoints(currentUser.points, intlLocale)} {t("pointsSuffix", "điểm")}
            </span>
          </div>
        </div>
      ) : isLoggedIn ? (
        <div
          data-tour="ranking-you"
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-wewin-navy/20 bg-wewin-navy text-white lg:left-[var(--wewin-sidebar-width)]"
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <span className="shrink-0 text-sm font-semibold">{t("unranked")}</span>
            <p className="min-w-0 flex-1 text-sm text-white/80">{t("unrankedHint")}</p>
            <span className="shrink-0 text-sm font-bold tabular-nums">
              0 {t("pointsSuffix", "điểm")}
            </span>
          </div>
        </div>
      ) : (
        <div
          data-tour="ranking-you"
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-wewin-navy/20 bg-wewin-navy text-white lg:left-[var(--wewin-sidebar-width)]"
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="min-w-0 text-sm">{t("loginHint")}</p>
            <Link
              href="/login?next=/ranking"
              className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-wewin-navy hover:bg-zinc-100"
            >
              {t("loginCta")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
