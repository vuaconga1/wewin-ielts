"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/provider";
import type { StoredAiScore } from "@/lib/ai/types";

type Props = {
  attemptId: string;
  skill: "SPEAKING" | "WRITING";
  initial: StoredAiScore | null;
};

function StatusCard({
  title,
  headline,
  body,
}: {
  title: string;
  headline: string;
  body: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-wewin-navy/15 bg-white shadow-sm shadow-wewin-navy/5">
      <div className="border-l-4 border-wewin-navy px-5 py-5 sm:px-6">
        <p className="text-sm font-medium text-wewin-navy/70">{title}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-wewin-navy">
          {headline}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
          {body}
        </p>
      </div>
    </section>
  );
}

function formatBand(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function AiScorePanel({ attemptId, skill, initial }: Props) {
  const { t } = useTranslations("result");
  const [aiScore, setAiScore] = useState<StoredAiScore | null>(initial);
  const [quotaNote, setQuotaNote] = useState<string | null>(null);
  const title = t("aiScoreTitle", "Điểm AI");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/practice/${attemptId}/ai-score`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          aiScore?: StoredAiScore | null;
          loggedIn?: boolean;
          unlimited?: boolean;
          quota?: { speaking: boolean; writing: boolean } | null;
        };
        if (cancelled) return;
        if (data.aiScore) setAiScore(data.aiScore);
        if (!data.loggedIn) {
          setQuotaNote(
            t(
              "aiScoreLoginRequired",
              "Đăng nhập để dùng chấm điểm AI (1 lần Speaking và 1 lần Writing mỗi ngày).",
            ),
          );
        } else if (data.unlimited) {
          setQuotaNote(
            t("aiScoreAdminUnlimited", "Tài khoản admin: không giới hạn chấm AI."),
          );
        } else if (data.quota) {
          const used =
            skill === "SPEAKING" ? data.quota.speaking : data.quota.writing;
          setQuotaNote(
            used
              ? t(
                  "aiScoreQuotaUsed",
                  "Bạn đã dùng hết lượt chấm AI cho kỹ năng này hôm nay.",
                )
              : t(
                  "aiScoreQuotaLeft",
                  "Còn 1 lượt chấm AI cho kỹ năng này hôm nay.",
                ),
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, skill, t]);

  if (!aiScore) {
    return (
      <StatusCard
        title={title}
        headline={t("aiScorePending", "Đang chờ chấm…")}
        body={
          quotaNote ??
          t(
            "aiScorePendingHint",
            "Điểm AI chỉ được chấm ngay sau khi bạn nộp bài (hoặc hết giờ hệ thống tự nộp).",
          )
        }
      />
    );
  }

  if (aiScore.status === "skipped_guest") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreSkippedGuest", "Cần đăng nhập")}
        body={
          quotaNote ??
          t(
            "aiScoreLoginRequired",
            "Đăng nhập để dùng chấm điểm AI (1 lần Speaking và 1 lần Writing mỗi ngày).",
          )
        }
      />
    );
  }

  if (aiScore.status === "skipped_quota") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreSkippedQuota", "Hết lượt hôm nay")}
        body={
          quotaNote ??
          t(
            "aiScoreQuotaUsed",
            "Bạn đã dùng hết lượt chấm AI cho kỹ năng này hôm nay.",
          )
        }
      />
    );
  }

  if (aiScore.status === "skipped_config") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreUnavailable", "Chưa cấu hình")}
        body={t(
          "aiScoreConfigHint",
          "Máy chủ chưa cấu hình OpenAI — liên hệ quản trị viên.",
        )}
      />
    );
  }

  if (aiScore.status === "skipped_no_audio") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreSkippedNoAudio", "Không có bản ghi âm")}
        body={t(
          "aiScoreSkippedNoAudioHint",
          "Bài đã nộp nhưng không có file ghi âm để chấm AI.",
        )}
      />
    );
  }

  if (aiScore.status === "failed") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreFailed", "Chấm AI thất bại")}
        body={t("aiScoreFailedHint", "Không chấm được bài. Thử lại sau.")}
      />
    );
  }

  if (aiScore.status === "scoring" || aiScore.status === "pending") {
    return (
      <StatusCard
        title={title}
        headline={t("aiScoreScoring", "Đang chấm…")}
        body={t(
          "aiScoreScoringHint",
          "Whisper + mô hình chấm điểm đang xử lý. Tải lại trang sau vài phút.",
        )}
      />
    );
  }

  // Scores only — no feedback / transcript / criterion comments
  return (
    <section className="overflow-hidden rounded-xl border border-wewin-navy/15 bg-white shadow-sm shadow-wewin-navy/5">
      <div className="border-l-4 border-wewin-navy px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-wewin-navy/70">{title}</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight text-wewin-navy">
              {aiScore.overallBand != null
                ? t(
                    "aiScoreBand",
                    { n: formatBand(aiScore.overallBand) },
                    "Band {n}",
                  )
                : t("aiScoreNoBand", "Chưa có band tổng")}
            </p>
          </div>
          {quotaNote ? (
            <p className="text-xs text-zinc-500 sm:max-w-xs sm:text-right">
              {quotaNote}
            </p>
          ) : null}
        </div>

        {aiScore.tasks.length > 0 ? (
          <ul className="mt-5 space-y-4 border-t border-wewin-navy/10 pt-5">
            {aiScore.tasks.map((task) => (
              <li key={task.number} className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-wewin-navy">
                    {task.label
                      ? task.label
                      : t("aiScoreTask", { n: task.number }, "Task {n}")}
                  </p>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatBand(task.band)}
                  </span>
                </div>
                {task.criteria.length > 0 ? (
                  <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {task.criteria.map((c) => (
                      <li
                        key={c.name}
                        className="rounded-md bg-wewin-bg px-2.5 py-2 text-center"
                      >
                        <p className="text-[11px] font-medium leading-tight text-zinc-600">
                          {c.name}
                        </p>
                        <p className="mt-0.5 text-base font-bold text-wewin-navy">
                          {formatBand(c.band)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
