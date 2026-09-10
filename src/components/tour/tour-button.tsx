"use client";

import { CircleHelp } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { useOptionalTour } from "@/components/tour/tour-provider";

type Props = {
  /** Navy top-bar chrome: gold icon above white label */
  variant?: "default" | "chrome";
  className?: string;
};

export function TourButton({ variant = "default", className = "" }: Props) {
  const tour = useOptionalTour();
  const { t } = useTranslations("tour");

  if (!tour?.tourId) return null;

  const label = t("open", "Hiện hướng dẫn");

  if (variant === "chrome") {
    return (
      <button
        type="button"
        onClick={() => tour.start({ replay: true })}
        className={`flex min-w-0 max-w-[7.5rem] flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 sm:max-w-[9rem] sm:px-2 ${className}`}
        aria-label={label}
        title={label}
      >
        <CircleHelp
          className="h-5 w-5 shrink-0 text-wewin-gold"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="w-full text-center text-[10px] font-medium leading-tight text-white sm:text-[11px]">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => tour.start({ replay: true })}
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-wewin-navy transition hover:bg-wewin-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 sm:gap-2 sm:px-2.5 ${className}`}
      aria-label={label}
      title={label}
    >
      <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
      <span className="hidden truncate text-xs font-semibold sm:inline">{label}</span>
    </button>
  );
}
