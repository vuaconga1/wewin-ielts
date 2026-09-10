"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";

type Props = {
  /** Compact for sidebar; larger for mobile header */
  size?: "sm" | "md";
  /** Navy top-bar chrome: gold globe above locale code */
  variant?: "default" | "chrome";
  className?: string;
};

export function LanguageSwitcher({
  size = "sm",
  variant = "default",
  className = "",
}: Props) {
  const { t, locale, setLocale, isPending } = useTranslations();

  function switchTo(next: Locale) {
    setLocale(next);
  }

  function toggle() {
    switchTo(locale === "vi" ? "en" : "vi");
  }

  if (variant === "chrome") {
    const code = t(`locale.${locale}`, locale.toUpperCase());
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 disabled:opacity-50 sm:px-2 ${className}`}
        aria-label={t("common.language", "Ngôn ngữ")}
        title={t("locale.switchTo", {
          lang: t(`locale.${locale === "vi" ? "en" : "vi"}`),
        })}
      >
        <Globe
          className="h-5 w-5 shrink-0 text-wewin-gold"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase leading-tight text-white sm:text-[11px]">
          {code}
        </span>
      </button>
    );
  }

  const btn =
    size === "sm"
      ? "min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold"
      : "min-w-[2.25rem] rounded-md px-2.5 py-1.5 text-sm font-semibold";

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-wewin-border bg-wewin-bg p-0.5 ${className}`}
      role="group"
      aria-label={t("common.language")}
    >
      {(["vi", "en"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            disabled={isPending}
            onClick={() => switchTo(code)}
            aria-pressed={active}
            aria-label={t("locale.switchTo", { lang: t(`locale.${code}`) })}
            className={`${btn} transition ${
              active
                ? "bg-wewin-navy text-white shadow-sm"
                : "text-wewin-navy hover:bg-white disabled:opacity-50"
            }`}
          >
            {t(`locale.${code}`)}
          </button>
        );
      })}
    </div>
  );
}
