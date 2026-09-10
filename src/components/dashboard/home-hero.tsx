"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

export function HomeHero() {
  const { t } = useTranslations("home");

  return (
    <section className="wewin-card-3d relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_40%,color-mix(in_srgb,var(--wewin-gold)_14%,transparent),transparent_55%),radial-gradient(ellipse_at_10%_90%,color-mix(in_srgb,var(--wewin-accent-blue)_10%,transparent),transparent_50%)]" />
      <div className="relative flex flex-col sm:flex-row sm:items-stretch">
        <div className="min-w-0 shrink-0 p-5 sm:max-w-xl sm:p-6 lg:max-w-2xl lg:p-8">
          <h2 className="break-words text-2xl font-bold leading-tight text-wewin-navy sm:text-3xl lg:text-[2rem]">
            {t("heroHeadlineLine", "Nâng cao mỗi ngày")}
            <span className="mt-1 block text-wewin-gold sm:mt-1.5">
              {t("heroHeadlineAccent", "Tiến bộ không ngừng!")}
            </span>
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-[0.95rem]">
            {t(
              "heroBody",
              "Luyện IELTS mỗi ngày cùng WEWIN — Listening, Reading, Writing, Speaking theo lộ trình rõ ràng, vững vàng từng bước.",
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 rounded-full bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-wewin-navy-hover"
            >
              {t("heroCta", "Bắt đầu học ngay")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 rounded-full border border-wewin-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-wewin-navy transition hover:bg-wewin-accent-blue-bg"
            >
              {t("heroSecondaryCta", "Luyện đề")}
            </Link>
          </div>
        </div>
        {/* Absolute mascot on sm+ so image intrinsic size cannot stretch the card */}
        <div
          className="relative flex items-center justify-center px-4 pb-4 pt-1 sm:min-h-0 sm:flex-1 sm:self-stretch sm:p-2"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/wewin-mascot-hero.png?v=4"
            alt=""
            className="h-36 w-auto max-w-full select-none bg-transparent object-contain sm:absolute sm:inset-2 sm:m-auto sm:h-auto sm:max-h-full sm:w-auto sm:max-w-[min(100%,280px)]"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
