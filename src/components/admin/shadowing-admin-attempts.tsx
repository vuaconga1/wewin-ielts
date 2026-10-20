"use client";

import { localeToIntl } from "@/i18n/config";
import { useTranslations } from "@/i18n/provider";
import type { ShadowingAdminAttempt } from "@/lib/shadowing/types";

/** Student submissions for one exercise, with their recordings while retained. */
export function ShadowingAdminAttempts({
  attempts,
  retentionDays,
}: {
  attempts: ShadowingAdminAttempt[];
  retentionDays: number;
}) {
  const { t, locale } = useTranslations("shadowingAdmin");
  const intlLocale = localeToIntl(locale);

  return (
    <section className="card-outline max-w-3xl min-w-0 space-y-3 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">{t("attemptsTitle", "Bài nộp của học viên")}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {t("retentionNote", { n: retentionDays }, "Bản ghi âm tự xóa sau {n} ngày; kết quả chấm vẫn được giữ.")}
        </p>
      </div>
      {attempts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-5 text-center text-sm text-zinc-600">
          {t("attemptsEmpty", "Chưa có học viên nào nộp bài.")}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
          {attempts.map((a) => (
            <li key={a.attemptId} className="min-w-0 space-y-2 px-3 py-3 sm:px-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="min-w-0 flex-1 break-words text-sm font-semibold text-zinc-900">{a.userLabel}</p>
                <span className="rounded-full bg-wewin-navy px-2.5 py-0.5 text-sm font-bold tabular-nums text-white">
                  {a.score}/100
                </span>
                <span className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString(intlLocale)}</span>
              </div>
              <p className="break-words text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">{t("recognized", "Nhận diện")}: </span>
                {a.recognizedText}
              </p>
              {a.recordingUrl ? (
                <audio src={a.recordingUrl} controls preload="none" className="w-full" />
              ) : (
                <p className="text-xs text-zinc-400">{t("recordingGone", "Bản ghi đã hết hạn lưu trữ.")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
