"use client";

import type { ReactNode } from "react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  skillLabel: string;
  testTitle: string;
  partTitle?: string | null;
  /** Optional status line under title (save / answered). */
  statusLine?: ReactNode;
  clock: string | null;
  /** Seconds left — drives flash/red warning like CDI. */
  secondsLeft: number | null;
  submitLabel: string;
  submitting: boolean;
  onSubmitClick: () => void;
  /** Compact toolbar under header (e.g. listening audio). */
  toolbar?: ReactNode;
  /** Minimal part/task tabs (replaces left sidebar). */
  partTabs?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function CdiExamShell({
  skillLabel,
  testTitle,
  partTitle,
  statusLine,
  clock,
  secondsLeft,
  submitLabel,
  submitting,
  onSubmitClick,
  toolbar,
  partTabs,
  children,
  footer,
}: Props) {
  const { t } = useTranslations("practice");
  const urgent =
    secondsLeft != null && secondsLeft > 0 && secondsLeft <= 10 * 60;
  const critical = secondsLeft != null && secondsLeft > 0 && secondsLeft <= 5 * 60;

  return (
    <div className="cdi-desk flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-[#d8dce2]">
      <header className="sticky top-0 z-20 border-b border-black/30 bg-[#2c3645] text-white shadow-md">
        <div className="mx-auto flex max-w-[1400px] min-w-0 flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-300">
              {skillLabel}
              {partTitle ? (
                <span className="font-normal normal-case tracking-normal text-zinc-400">
                  {" "}
                  · {partTitle}
                </span>
              ) : null}
            </p>
            <p className="truncate text-sm font-semibold text-white sm:text-[15px]">
              {testTitle}
            </p>
            {statusLine ? (
              <div className="mt-0.5 text-[11px] text-zinc-400">{statusLine}</div>
            ) : null}
          </div>

          {clock ? (
            <div
              className={`cdi-timer shrink-0 px-3 py-1.5 font-mono text-base font-bold tabular-nums sm:text-lg ${
                critical
                  ? "cdi-timer-flash border border-red-400 bg-red-600 text-white"
                  : urgent
                    ? "cdi-timer-flash border border-amber-300 bg-[#f5c518] text-zinc-900"
                    : "border border-[#c9a227] bg-[#f5c518] text-zinc-900"
              }`}
              aria-live="polite"
              aria-label={t("timeRemaining", "Time remaining")}
            >
              {clock}
            </div>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={onSubmitClick}
            className="shrink-0 rounded-sm border border-[#8a6d00] bg-[#f5c518] px-3 py-2 text-xs font-bold uppercase tracking-wide text-zinc-900 hover:bg-[#e6b800] disabled:opacity-50 sm:px-4 sm:text-[13px]"
          >
            {submitting ? t("submitting", "Submitting…") : submitLabel}
          </button>
        </div>
        {toolbar ? (
          <div className="border-t border-white/10 bg-[#242c38]">{toolbar}</div>
        ) : null}
      </header>

      {partTabs ? (
        <div className="border-b border-zinc-400/50 bg-[#eceff2]">{partTabs}</div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-1 flex-col px-2 py-2 sm:px-3 sm:py-3">
        {children}
      </div>

      {footer ? <div className="sticky bottom-0 z-20">{footer}</div> : null}
    </div>
  );
}
