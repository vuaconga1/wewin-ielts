"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Medal,
  Star,
  Trophy,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
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
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "navy" | "gold" | "silver" | "bronze";
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
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeCls} ${toneCls}`}
    >
      {initials}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="inline-flex items-center rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[11px] font-bold text-wewin-navy">
      #{rank}
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
      ? "bg-gradient-to-b from-amber-200 via-wewin-gold-soft to-wewin-gold"
      : place === 2
        ? "bg-gradient-to-b from-slate-300 via-slate-400 to-wewin-navy"
        : "bg-gradient-to-b from-orange-200 via-amber-600 to-amber-800";
  const textOnBlock = place === 1 ? "text-wewin-navy" : "text-white";
  const Icon = place === 1 ? Crown : Medal;
  const tone = place === 1 ? "gold" : place === 2 ? "silver" : "bronze";

  return (
    <div
      className={`flex w-full max-w-[11rem] flex-col items-center ${
        place === 1 ? "order-first sm:order-none sm:z-10" : ""
      }`}
    >
      <div className="mb-2 flex flex-col items-center gap-1.5 px-1 text-center">
        <Icon
          className={`h-5 w-5 ${
            place === 1
              ? "text-wewin-gold"
              : place === 2
                ? "text-slate-400"
                : "text-amber-700"
          }`}
          aria-hidden
        />
        <Avatar initials={entry.initials} size="lg" tone={tone} />
        <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold text-wewin-navy">
          {entry.username}
        </p>
        <RankBadge rank={entry.rank} />
      </div>
      <div
        className={`flex w-full flex-1 flex-col items-center justify-start rounded-t-2xl px-3 pt-4 pb-5 shadow-sm ${height} ${block} ${textOnBlock}`}
      >
        <p className="text-lg font-bold tabular-nums sm:text-xl">
          {formatPoints(entry.points, intlLocale)}
        </p>
      </div>
    </div>
  );
}

const PERIODS: RankingPeriod[] = ["day", "week", "month", "all"];

export function RankingBoard({ data, intlLocale, isLoggedIn }: Props) {
  const { t } = useTranslations("ranking");
  const router = useRouter();
  const { period, year, month, day, entries, currentUser, updatedAt } = data;

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
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
          </h1>
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
              className="mb-6 flex flex-col items-end justify-center gap-4 sm:flex-row sm:items-end sm:gap-3 md:gap-6"
            >
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
            <ul className="wewin-card-3d overflow-hidden rounded-2xl">
              {rest.map((entry) => {
                const isYou = currentUser?.userId === entry.userId;
                return (
                  <li
                    key={entry.userId}
                    className={`flex min-w-0 items-center gap-3 border-b border-wewin-border px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4 ${
                      isYou ? "bg-wewin-accent-blue-bg/50" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wewin-accent-blue-bg text-xs font-bold text-wewin-navy">
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
                    <RankBadge rank={entry.rank} />
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-zinc-800">
                      <Star className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                      {formatPoints(entry.points, intlLocale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
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
              {formatPoints(currentUser.points, intlLocale)}
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
            <span className="shrink-0 text-sm font-bold tabular-nums">0</span>
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
