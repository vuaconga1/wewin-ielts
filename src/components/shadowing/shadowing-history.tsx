"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
  Loader2,
  Mic,
  Sparkles,
  Trophy,
} from "lucide-react";
import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";
import { learnShadowingHref } from "@/lib/learn/hrefs";
import type { ShadowingAttemptResult, ShadowingHistoryItem } from "@/lib/shadowing/types";
import { ShadowingResult } from "@/components/shadowing/shadowing-result";

type HistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; signedIn: boolean; items: ShadowingHistoryItem[] };

type Props = {
  slug: string;
  sampleAudioUrl: string;
  /** Bump after each submission so the list reloads. */
  refreshKey: number;
};

export function ShadowingHistory({ slug, sampleAudioUrl, refreshKey }: Props) {
  const { t, locale } = useTranslations("shadowing");
  const { t: tc } = useTranslations("common");
  const intlLocale = localeToIntl(locale);
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [review, setReview] = useState<ShadowingAttemptResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shadowing/${slug}/history`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { signedIn: boolean; items: ShadowingHistoryItem[] };
        if (!cancelled) setState({ status: "ready", signedIn: data.signedIn, items: data.items });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, refreshKey]);

  const toggleReview = useCallback(
    async (attemptId: string) => {
      if (openId === attemptId) {
        setOpenId(null);
        setReview(null);
        return;
      }
      setOpenId(attemptId);
      setReview(null);
      setReviewError(null);
      setReviewLoading(true);
      try {
        const res = await fetch(`/api/shadowing/attempts/${attemptId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        setReview((await res.json()) as ShadowingAttemptResult);
      } catch {
        setReviewError(t("errors.reviewFailed", "Không mở được bài làm này."));
      } finally {
        setReviewLoading(false);
      }
    },
    [openId, t],
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleString(intlLocale);

  const loading = (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-wewin-navy" />
      <span>{tc("loading", "Đang tải lịch sử…")}</span>
    </div>
  );

  let body: React.ReactNode;
  let highestScore = 0;

  if (state.status === "loading") {
    body = loading;
  } else if (state.status === "error") {
    body = (
      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-center text-sm text-rose-700">
        {t("errors.historyFailed", "Không tải được lịch sử làm bài.")}
      </div>
    );
  } else if (!state.signedIn) {
    body = (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-600">
          {t("historySignIn", "Đăng nhập để luyện và xem lại lịch sử làm bài.")}
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(learnShadowingHref(slug))}`}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2 text-sm font-semibold text-white shadow-2xs hover:bg-wewin-navy-hover"
        >
          {t("signIn", "Đăng nhập ngay")}
        </Link>
      </div>
    );
  } else if (state.items.length === 0) {
    body = (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có lần nộp bài nào</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          {t(
            "historyEmpty",
            "Kết quả mỗi lần nộp bài và file thu âm của bạn sẽ được lưu tại đây để dễ dàng so sánh sự tiến bộ.",
          )}
        </p>
      </div>
    );
  } else {
    const total = state.items.length;
    highestScore = Math.max(...state.items.map((it) => it.score));

    body = (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <ul className="divide-y divide-slate-100">
          {state.items.map((item, i) => {
            const open = openId === item.attemptId;
            const score = item.score;
            const scoreColor =
              score >= 80
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : score >= 60
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-amber-50 text-amber-700 border-amber-200";

            return (
              <li key={item.attemptId} className="transition-colors hover:bg-slate-50/60">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                      #{total - i}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {t("historyAttempt", { n: total - i }, `Lần ${total - i}`)}
                        </span>
                        {item.hasRecording && (
                          <span
                            title="Có kèm bản ghi âm"
                            className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700"
                          >
                            <Mic className="h-3 w-3" />
                            Audio
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 font-mono text-sm font-bold tabular-nums ${scoreColor}`}
                      >
                        {item.score}/100
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t(
                          "wordsOf",
                          { correct: item.correctCount, total: item.totalWords },
                          `${item.correctCount}/${item.totalWords} từ`,
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void toggleReview(item.attemptId)}
                      aria-expanded={open}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span>{open ? t("closeReview", "Đóng") : t("viewAttempt", "Xem lại")}</span>
                      {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-5">
                    {reviewLoading ? (
                      <div className="p-4">{loading}</div>
                    ) : reviewError ? (
                      <p className="p-2 text-sm text-rose-600">{reviewError}</p>
                    ) : review ? (
                      <ShadowingResult
                        result={review}
                        sampleAudioUrl={sampleAudioUrl}
                        title={t(
                          "reviewTitle",
                          { time: formatTime(review.createdAt) },
                          `Chi tiết bài làm (${formatTime(review.createdAt)})`,
                        )}
                      />
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <History className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("historyTitle", "Lịch sử làm bài")}
            </h2>
            <p className="text-xs text-slate-500">Xem lại quá trình và so sánh kết quả từng lần đọc</p>
          </div>
        </div>

        {state.status === "ready" && state.items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              Cao nhất: {highestScore}/100
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {state.items.length} lượt nộp
            </span>
          </div>
        )}
      </div>

      {body}
    </section>
  );
}
