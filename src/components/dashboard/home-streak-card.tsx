"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

const WEEK_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Props = {
  streakDays: number;
  weekActive: boolean[];
  loggedIn: boolean;
};

export function HomeStreakCard({ streakDays, weekActive, loggedIn }: Props) {
  const { t } = useTranslations("home");

  return (
    <section className="wewin-card-3d p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-wewin-gold" aria-hidden />
        <h2 className="text-sm font-semibold text-zinc-800">
          {t("streakTitle", "Chuỗi học")}
        </h2>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-wewin-navy">
          {streakDays}
        </span>
        <span className="text-sm text-zinc-600">
          {t("streakDays", "ngày liên tiếp")}
        </span>
      </p>
      <div className="mt-5 flex justify-between gap-1.5">
        {WEEK_KEYS.map((key, i) => (
          <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-8 w-full max-w-8 items-center justify-center rounded-full border text-[10px] font-bold ${
                weekActive[i]
                  ? "border-wewin-navy bg-wewin-navy text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-400"
              }`}
            >
              {weekActive[i] ? "✓" : ""}
            </span>
            <span className="text-[10px] font-medium text-zinc-500">
              {t(`week.${key}`)}
            </span>
          </div>
        ))}
      </div>
      {!loggedIn ? (
        <p className="mt-4 text-xs text-zinc-500">
          <Link href="/login" className="font-medium text-wewin-navy hover:underline">
            {t("loginLink", "Đăng nhập")}
          </Link>{" "}
          {t("loginToSaveStreak", "để lưu chuỗi ngày luyện.")}
        </p>
      ) : (
        <p className="mt-4 text-xs text-zinc-500">
          {t(
            "streakHint",
            "Luyện hoặc học mỗi ngày để giữ chuỗi và nhận điểm xếp hạng.",
          )}
        </p>
      )}
    </section>
  );
}
