"use client";

import Link from "next/link";
import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";
import { practicePath } from "@/lib/practice/paths";

export type TestAttemptHistoryItem = {
  id: string;
  mode: "PRACTICE" | "FULL";
  sectionOrders: number[];
  startedAt: string;
  finishedAt: string | null;
  timeLimitMinutes: number | null;
  score: { correct: number; total: number } | null;
};

type PartRef = {
  title: string;
  order: number;
};

type Props = {
  slug: string;
  skill: string;
  isLoggedIn: boolean;
  parts: PartRef[];
  attempts: TestAttemptHistoryItem[];
};

function formatDurationMs(
  ms: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return t("durationHms", { h: hours, m: minutes, s: seconds });
  }
  if (minutes > 0) {
    return t("durationMs", { m: minutes, s: seconds });
  }
  return t("durationSec", { s: seconds });
}

export function TestAttemptHistory({
  slug,
  skill,
  isLoggedIn,
  parts,
  attempts,
}: Props) {
  const { t, locale } = useTranslations("tests");
  const { t: tc } = useTranslations("common");
  const intlLocale = localeToIntl(locale);
  const unscored = skill === "WRITING" || skill === "SPEAKING";

  const partByOrder = new Map(parts.map((p) => [p.order, p.title]));

  function modeLabel(attempt: TestAttemptHistoryItem): string {
    if (attempt.mode === "FULL") return t("modeFull");
    const titles = [...attempt.sectionOrders]
      .sort((a, b) => a - b)
      .map((order) => partByOrder.get(order) ?? t("sectionFallback", { n: order }));
    if (titles.length === 0) return t("modePractice");
    return titles.join(" + ");
  }

  function timeLabel(attempt: TestAttemptHistoryItem): string {
    if (attempt.finishedAt) {
      const ms =
        new Date(attempt.finishedAt).getTime() -
        new Date(attempt.startedAt).getTime();
      if (Number.isFinite(ms) && ms >= 0) {
        return formatDurationMs(ms, t);
      }
    }
    if (attempt.timeLimitMinutes != null) {
      return t("timeLimitUsed", { n: attempt.timeLimitMinutes });
    }
    return tc("dash");
  }

  function scoreLabel(attempt: TestAttemptHistoryItem): string {
    if (!attempt.finishedAt) return tc("inProgress");
    if (unscored) return t("scoreSubmitted");
    if (attempt.score) {
      return t("scoreCorrectTotal", {
        correct: attempt.score.correct,
        total: attempt.score.total,
      });
    }
    return tc("dash");
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-6 text-center">
        <p className="text-sm text-zinc-600">
          {t("historyLogin", "Đăng nhập để xem lịch sử làm đề này.")}
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/tests/${slug}`)}`}
          className="mt-3 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("historyLoginAction", "Đăng nhập")}
        </Link>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-6 text-center">
        <p className="text-sm text-zinc-600">
          {t("historyEmpty", "Chưa có lịch sử làm bài")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-wewin-accent-blue-bg/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2.5 sm:px-4">{t("colDate")}</th>
            <th className="px-3 py-2.5 sm:px-4">{t("colMode")}</th>
            <th className="px-3 py-2.5 sm:px-4">{t("colDuration")}</th>
            <th className="px-3 py-2.5 sm:px-4">{t("colScore")}</th>
            <th className="px-3 py-2.5 sm:px-4" />
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id} className="border-t border-zinc-200">
              <td className="whitespace-nowrap px-3 py-2.5 text-zinc-700 sm:px-4">
                {new Date(attempt.startedAt).toLocaleString(intlLocale)}
              </td>
              <td className="min-w-0 px-3 py-2.5 break-words text-zinc-800 sm:px-4">
                {modeLabel(attempt)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-zinc-600 sm:px-4">
                {timeLabel(attempt)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-zinc-800 sm:px-4">
                {scoreLabel(attempt)}
              </td>
              <td className="px-3 py-2.5 text-right sm:px-4">
                <Link
                  href={practicePath(slug, attempt.id, Boolean(attempt.finishedAt))}
                  className="inline-block font-medium text-wewin-navy hover:underline"
                >
                  {attempt.finishedAt
                    ? t("viewDetail")
                    : tc("continue")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
