"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
} from "react";
import { SkipForward, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { useOptionalTour, type TourPrepareFn } from "@/components/tour/tour-provider";
import type { TourStep } from "@/lib/tour/types";

const MASCOT_SRC = "/branding/wewin-mascot-hero.png?v=4";
const PAD = 12;
const RING = 8;

type Hole = {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
};

type TipPos = {
  top: number;
  left: number;
  width: number;
  bottomAnchored: boolean;
};

function queryVisible(selector: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(selector);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (r.width < 2 || r.height < 2) continue;
    if (style.visibility === "hidden" || style.display === "none") continue;
    return el;
  }
  return null;
}

async function waitForVisible(
  selector: string,
  timeoutMs = 700,
): Promise<HTMLElement | null> {
  const start = performance.now();
  let el = queryVisible(selector);
  while (!el && performance.now() - start < timeoutMs) {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    el = queryVisible(selector);
  }
  return el;
}

function holeFromEl(el: HTMLElement): Hole {
  const r = el.getBoundingClientRect();
  const top = Math.max(8, r.top - RING);
  const left = Math.max(8, r.left - RING);
  const maxH = window.innerHeight * 0.46;
  const maxW = window.innerWidth - 16;
  return {
    top,
    left,
    width: Math.min(maxW - left + 8, r.width + RING * 2),
    height: Math.min(maxH, window.innerHeight - top - 8, r.height + RING * 2),
    radius: Math.min(16, Math.round(Math.min(r.width, r.height) / 6) + 8),
  };
}

function placeTooltip(hole: Hole | null, tipW: number, tipH: number): TipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(tipW, vw - PAD * 2);
  const height = Math.min(tipH, vh - PAD * 2);

  if (!hole) {
    return {
      top: Math.max(PAD, vh - height - PAD),
      left: Math.max(PAD, (vw - width) / 2),
      width,
      bottomAnchored: true,
    };
  }

  const below = hole.top + hole.height + 14;
  const above = hole.top - height - 14;
  const right = hole.left + hole.width + 10;
  const leftOf = hole.left - width - 10;

  // Mobile / tight viewports: pin to bottom so the card never overflows.
  if (vw < 640 || height > vh * 0.45) {
    return {
      top: Math.max(PAD, vh - height - PAD),
      left: Math.max(PAD, (vw - width) / 2),
      width,
      bottomAnchored: true,
    };
  }

  if (right + width <= vw - PAD && hole.top + height <= vh - PAD) {
    return {
      top: Math.min(Math.max(PAD, hole.top), vh - height - PAD),
      left: right,
      width,
      bottomAnchored: false,
    };
  }

  if (leftOf >= PAD && hole.top + height <= vh - PAD) {
    return {
      top: Math.min(Math.max(PAD, hole.top), vh - height - PAD),
      left: leftOf,
      width,
      bottomAnchored: false,
    };
  }

  if (below + height <= vh - PAD) {
    return {
      top: below,
      left: Math.min(Math.max(PAD, hole.left), vw - width - PAD),
      width,
      bottomAnchored: false,
    };
  }

  if (above >= PAD) {
    return {
      top: above,
      left: Math.min(Math.max(PAD, hole.left), vw - width - PAD),
      width,
      bottomAnchored: false,
    };
  }

  return {
    top: Math.max(PAD, vh - height - PAD),
    left: Math.max(PAD, (vw - width) / 2),
    width,
    bottomAnchored: true,
  };
}

function DimButton({
  className,
  style,
  onClick,
  label,
}: {
  className?: string;
  style?: CSSProperties;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`fixed z-[100] bg-zinc-950/55 ${className ?? ""}`}
      style={style}
    />
  );
}

type Props = {
  onPrepareStep?: TourPrepareFn;
};

export function TourOverlay({ onPrepareStep }: Props) {
  const tour = useOptionalTour();
  const { t } = useTranslations("tour");
  const [hole, setHole] = useState<Hole | null>(null);
  const [tip, setTip] = useState<TipPos | null>(null);
  const [tipSize, setTipSize] = useState({ w: 420, h: 280 });

  const active = Boolean(tour?.active);
  const step: TourStep | undefined = tour?.steps[tour.stepIndex];
  const continueLabel = t("hint", "Chạm vùng tối trên màn hình để tiếp tục");

  const measure = useCallback(() => {
    if (!active || !step) {
      setHole(null);
      return;
    }
    const el = queryVisible(step.target);
    setHole(el ? holeFromEl(el) : null);
  }, [active, step]);

  useLayoutEffect(() => {
    if (!active || !step) return;
    let cancelled = false;
    const selector = step.target;

    async function prepareAndMeasure() {
      await onPrepareStep?.(step ?? null);
      if (cancelled) return;
      const el = await waitForVisible(selector);
      if (cancelled) return;
      if (el) {
        try {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch {
          /* ignore */
        }
      }
      if (cancelled) return;
      setHole(el ? holeFromEl(el) : null);
    }

    void prepareAndMeasure();
    return () => {
      cancelled = true;
    };
  }, [active, step, onPrepareStep]);

  useEffect(() => {
    if (!active) return;
    const onWin = () => measure();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, measure]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (!tour) return;
      if (e.key === "Escape") {
        e.preventDefault();
        tour.stop(true);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        tour.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        tour.prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, tour]);

  const tipCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setTipSize((prev) => {
      if (Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1) {
        return prev;
      }
      return { w: rect.width, h: rect.height };
    });
  }, []);

  useLayoutEffect(() => {
    if (!active) {
      setTip(null);
      return;
    }
    setTip(placeTooltip(hole, tipSize.w, tipSize.h));
  }, [active, hole, tipSize]);

  if (!tour || !active || !step) return null;

  const total = tour.steps.length;
  const current = tour.stepIndex + 1;
  const isFirst = tour.stepIndex === 0;
  const title = t(step.titleKey, "Hướng dẫn");
  const body = t(step.bodyKey, "");

  return (
    <div className="wewin-tour" role="dialog" aria-modal="true" aria-labelledby="wewin-tour-title">
      <button
        type="button"
        aria-label={continueLabel}
        onClick={tour.next}
        className="fixed inset-0 z-[99] cursor-pointer bg-transparent"
      />
      {hole ? (
        <>
          <DimButton
            onClick={tour.next}
            label={continueLabel}
            style={{ top: 0, left: 0, right: 0, height: hole.top }}
          />
          <DimButton
            onClick={tour.next}
            label={continueLabel}
            style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }}
          />
          <DimButton
            onClick={tour.next}
            label={continueLabel}
            style={{
              top: hole.top,
              left: hole.left + hole.width,
              right: 0,
              height: hole.height,
            }}
          />
          <DimButton
            onClick={tour.next}
            label={continueLabel}
            style={{
              top: hole.top + hole.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <button
            type="button"
            aria-label={continueLabel}
            onClick={tour.next}
            className="fixed z-[101] cursor-pointer bg-transparent"
            style={{
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              borderRadius: hole.radius,
              boxShadow: "0 0 0 3px #fff, 0 8px 24px rgb(15 40 94 / 0.25)",
            }}
          />
        </>
      ) : (
        <DimButton
          onClick={tour.next}
          label={continueLabel}
          className="inset-0"
        />
      )}

      <div
        ref={tipCallbackRef}
        className="pointer-events-none fixed z-[110] px-2"
        style={
          tip
            ? {
                top: tip.top,
                left: tip.left,
                width: tip.width,
                maxWidth: "calc(100vw - 16px)",
              }
            : { visibility: "hidden", top: 0, left: 0 }
        }
      >
        <div className="pointer-events-auto relative flex items-end gap-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MASCOT_SRC}
            alt=""
            draggable={false}
            className="relative z-10 -mb-1 -mr-2 h-24 w-auto max-w-[5.75rem] shrink-0 select-none object-contain object-bottom drop-shadow-lg sm:-mr-4 sm:h-[8.5rem] sm:max-w-none md:h-[9.5rem]"
          />
          <div className="relative min-w-0 flex-1 overflow-y-auto rounded-2xl bg-white p-3.5 shadow-[0_12px_40px_rgb(15_40_94_/_0.28)] sm:p-4 max-h-[min(70vh,28rem)]">
            <button
              type="button"
              onClick={() => tour.stop(true)}
              className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={t("close", "Đóng hướng dẫn")}
            >
              <X className="h-4 w-4" />
            </button>

            <h2
              id="wewin-tour-title"
              className="pr-8 text-base font-bold break-words text-[#e56b2e] sm:text-lg"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed break-words text-zinc-600">
              {body}
            </p>

            <p className="mt-3 text-xs font-semibold tabular-nums text-zinc-500">
              {t("step", { current, total }, "{current} / {total}")}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={tour.prev}
                disabled={isFirst}
                className="rounded-full bg-wewin-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("prev", "Trước")}
              </button>
              <button
                type="button"
                onClick={tour.next}
                className="rounded-full bg-wewin-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
              >
                {t("next", "Tiếp")}
              </button>
            </div>

            <button
              type="button"
              onClick={() => tour.stop(true)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-400 px-3 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <SkipForward className="h-4 w-4" aria-hidden />
              {t("skip", "Bỏ qua hướng dẫn")}
            </button>

            <p className="mt-2 text-center text-[11px] leading-snug text-zinc-400">
              {continueLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
