"use client";

import Image from "next/image";
import { useTranslations } from "@/i18n/provider";

type Props = {
  open: boolean;
  unanswered: number;
  total: number;
  submitLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onReviewUnanswered?: () => void;
};

export function SubmitConfirmDialog({
  open,
  unanswered,
  total,
  submitLabel,
  submitting,
  onConfirm,
  onCancel,
  onReviewUnanswered,
}: Props) {
  const { t } = useTranslations("practice");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cdi-submit-title"
    >
      <div className="w-full max-w-md border border-zinc-500 bg-[#f0f1f3] shadow-xl">
        <div className="border-b border-zinc-400 bg-wewin-navy px-4 py-2.5">
          <h2
            id="cdi-submit-title"
            className="text-sm font-semibold tracking-wide text-white"
          >
            {t("confirmSubmitTitle", "End test?")}
          </h2>
        </div>
        <div className="space-y-3 px-4 py-4 text-sm text-zinc-800">
          <p>
            {t(
              "confirmSubmitBody",
              "Are you sure you want to submit this test? You will not be able to change your answers.",
            )}
          </p>
          <p className="font-medium tabular-nums">
            {unanswered > 0
              ? t(
                  "confirmUnanswered",
                  { n: unanswered, total },
                  "{n} of {total} questions unanswered",
                )
              : t(
                  "confirmAllAnswered",
                  { total },
                  "All {total} questions answered",
                )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-300 bg-[#e4e6ea] px-4 py-3">
          {unanswered > 0 && onReviewUnanswered ? (
            <button
              type="button"
              disabled={submitting}
              onClick={onReviewUnanswered}
              className="mr-auto rounded-sm border border-zinc-500 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {t("reviewUnanswered", "Review unanswered")}
            </button>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-sm border border-zinc-500 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t("cancelSubmit", "Cancel")}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="rounded-sm border border-[#8a6d00] bg-[#f5c518] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-zinc-900 hover:bg-[#e6b800] disabled:opacity-50"
          >
            {submitting ? t("submitting", "Submitting…") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Full-screen “test ended” transition before redirect. */
export function TestEndedOverlay({
  visible,
  fromTimeout = false,
}: {
  visible: boolean;
  fromTimeout?: boolean;
}) {
  const { t } = useTranslations("practice");
  const { t: tCommon } = useTranslations("common");
  const brand = tCommon("brand", "WEWIN Education");
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-wewin-navy px-6 text-center"
      role="status"
      aria-live="polite"
    >
      <Image
        src="/brand/wewin-logo.png"
        alt={brand}
        width={168}
        height={44}
        sizes="140px"
        className="mb-2 h-9 w-auto object-contain"
        priority
      />
      <p className="text-lg font-semibold tracking-wide text-white">
        {fromTimeout
          ? t("timeoutSubmitting", "Time’s up — submitting…")
          : t("testEnded", "Test ended")}
      </p>
      <p className="max-w-sm text-sm text-zinc-300">
        {fromTimeout
          ? t(
              "timeoutSubmittingHint",
              "Your answers are being saved. Loading results…",
            )
          : t(
              "testEndedHint",
              "Your answers have been submitted. Loading results…",
            )}
      </p>
      <div
        className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/20"
        aria-hidden
      >
        <div className="cdi-progress-bar h-full w-1/2 bg-[#f5c518]" />
      </div>
    </div>
  );
}

type LeaveProps = {
  open: boolean;
  leaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Warn that leaving mid-test discards the attempt (no score / history). */
export function LeaveConfirmDialog({
  open,
  leaving,
  onConfirm,
  onCancel,
}: LeaveProps) {
  const { t } = useTranslations("practice");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cdi-leave-title"
    >
      <div className="w-full max-w-md border border-zinc-500 bg-[#f0f1f3] shadow-xl">
        <div className="border-b border-zinc-400 bg-wewin-navy px-4 py-2.5">
          <h2
            id="cdi-leave-title"
            className="text-sm font-semibold tracking-wide text-white"
          >
            {t("leaveTitle", "Leave this test?")}
          </h2>
        </div>
        <div className="space-y-3 px-4 py-4 text-sm text-zinc-800">
          <p>
            {t(
              "leaveBody",
              "If you leave now, this attempt will end and your answers will not be saved to results or history.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-300 bg-[#e4e6ea] px-4 py-3">
          <button
            type="button"
            disabled={leaving}
            onClick={onCancel}
            className="rounded-sm border border-zinc-500 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {t("leaveCancel", "Stay")}
          </button>
          <button
            type="button"
            disabled={leaving}
            onClick={onConfirm}
            className="rounded-sm border border-red-800 bg-red-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-red-600 disabled:opacity-50"
          >
            {leaving
              ? t("leaveLeaving", "Leaving…")
              : t("leaveConfirm", "Leave without saving")}
          </button>
        </div>
      </div>
    </div>
  );
}
