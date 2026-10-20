"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { History, Loader2, Mic } from "lucide-react";
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
    <p className="flex items-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {tc("loading", "Đang tải…")}
    </p>
  );

  let body: React.ReactNode;
  if (state.status === "loading") {
    body = loading;
  } else if (state.status === "error") {
    body = (
      <p className="text-sm text-rose-600">
        {t("errors.historyFailed", "Không tải được lịch sử làm bài.")}
      </p>
    );
  } else if (!state.signedIn) {
    body = (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-center">
        <p className="text-sm text-zinc-600">
          {t("historySignIn", "Đăng nhập để luyện và xem lại lịch sử làm bài.")}
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(learnShadowingHref(slug))}`}
          className="mt-2 inline-block text-sm font-medium text-wewin-navy hover:underline"
        >
          {t("signIn", "Đăng nhập")}
        </Link>
      </div>
    );
  } else if (state.items.length === 0) {
    body = (
      <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-center text-sm text-zinc-600">
        {t("historyEmpty", "Chưa có lần nộp nào. Kết quả mỗi lần nộp bài sẽ được lưu ở đây.")}
      </p>
    );
  } else {
    const total = state.items.length;
    body = (
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {state.items.map((item, i) => {
          const open = openId === item.attemptId;
          return (
            <li key={item.attemptId} className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900">
                    {t("historyAttempt", { n: total - i }, "Lần {n}")}
                  </p>
                  <p className="text-xs text-zinc-500">{formatTime(item.createdAt)}</p>
                </div>
                <span className="rounded-full bg-wewin-navy px-2.5 py-0.5 text-sm font-bold tabular-nums text-white">
                  {item.score}/100
                </span>
                <span className="text-sm tabular-nums text-zinc-600">
                  {t("wordsOf", { correct: item.correctCount, total: item.totalWords }, "{correct}/{total} từ")}
                </span>
                {item.hasRecording ? (
                  <Mic className="h-4 w-4 text-zinc-400" aria-label={t("yourRecording", "Bản ghi của bạn")} />
                ) : null}
                <button
                  type="button"
                  onClick={() => void toggleReview(item.attemptId)}
                  aria-expanded={open}
                  className="min-h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-wewin-navy hover:bg-zinc-50"
                >
                  {open ? t("closeReview", "Đóng") : t("viewAttempt", "Xem lại")}
                </button>
              </div>
              {open ? (
                <div className="border-t border-zinc-200 bg-zinc-50/60 p-2 sm:p-3">
                  {reviewLoading ? (
                    <div className="p-2">{loading}</div>
                  ) : reviewError ? (
                    <p className="p-2 text-sm text-rose-600">{reviewError}</p>
                  ) : review ? (
                    <ShadowingResult
                      result={review}
                      sampleAudioUrl={sampleAudioUrl}
                      title={t("reviewTitle", { time: formatTime(review.createdAt) }, "Bài làm lúc {time}")}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className="card-outline space-y-3 p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
        <History className="h-5 w-5 text-wewin-navy" />
        {t("historyTitle", "Lịch sử làm bài")}
      </h2>
      {body}
    </section>
  );
}
