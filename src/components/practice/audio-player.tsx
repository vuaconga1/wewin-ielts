"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  src: string;
  label?: string;
  clipStart?: number | null;
  clipEnd?: number | null;
  /** Compact bar for CDI exam chrome (header toolbar). */
  compact?: boolean;
};

export function parseTimestamp(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const parts = s.split(":").map((p) => Number(p));
  if (parts.length < 2 || parts.length > 3 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function AudioPlayer({
  src,
  label,
  clipStart,
  clipEnd,
  compact = false,
}: Props) {
  const { t } = useTranslations("audio");
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const start = clipStart != null && Number.isFinite(clipStart) ? clipStart : 0;
  const end =
    clipEnd != null && Number.isFinite(clipEnd) && clipEnd > start
      ? clipEnd
      : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clamp = () => {
      if (el.currentTime < start) {
        el.currentTime = start;
      }
      if (end != null && el.currentTime >= end) {
        el.pause();
        el.currentTime = end;
        setPlaying(false);
      }
    };

    const onTime = () => {
      clamp();
      setCurrent(el.currentTime);
    };
    const onMeta = () => {
      setDuration(el.duration || 0);
      if (el.currentTime < start) el.currentTime = start;
      setCurrent(el.currentTime);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    if (el.readyState >= 1) onMeta();

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src, start, end]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = start;
    setCurrent(start);
  }, [src, start]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      if (end != null && el.currentTime >= end - 0.05) {
        el.currentTime = start;
      }
      void el.play();
    } else {
      el.pause();
    }
  }

  function seek(value: number) {
    const el = ref.current;
    if (!el) return;
    const max = end ?? el.duration ?? value;
    const next = Math.min(Math.max(value, start), max);
    el.currentTime = next;
    setCurrent(next);
  }

  function skip(delta: number) {
    seek(current + delta);
  }

  const max = end ?? duration;
  const progressMax = max > start ? max : start + 1;
  const clipLabel =
    end != null
      ? t("partRange", { from: fmt(start), to: fmt(end) })
      : start > 0
        ? t("from", { time: fmt(start) })
        : null;

  if (compact) {
    return (
      <div className="mx-auto flex max-w-[1400px] min-w-0 flex-wrap items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        <audio ref={ref} src={src} preload="metadata" />
        <p className="min-w-0 shrink truncate text-[11px] font-medium text-zinc-300">
          {label ?? t("title")}
          {clipLabel ? (
            <span className="ml-1.5 font-normal text-zinc-500">{clipLabel}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={() => skip(-5)}
          className="rounded-sm border border-zinc-500 bg-[#3a4556] px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-[#465266]"
        >
          {t("back5")}
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-sm border border-[#8a6d00] bg-[#f5c518] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-900 hover:bg-[#e6b800]"
        >
          {playing ? t("pause") : t("play")}
        </button>
        <button
          type="button"
          onClick={() => skip(5)}
          className="rounded-sm border border-zinc-500 bg-[#3a4556] px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-[#465266]"
        >
          {t("fwd5")}
        </button>
        <input
          type="range"
          min={start}
          max={progressMax}
          step={0.1}
          value={Math.min(Math.max(current, start), progressMax)}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1.5 min-w-0 flex-1 basis-[6rem] cursor-pointer accent-[#f5c518]"
          aria-label={t("title")}
        />
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-300">
          {fmt(current)} / {fmt(max || duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-wewin-navy/15 bg-wewin-accent-blue-bg/60 px-3 py-3 sm:px-4">
      <audio ref={ref} src={src} preload="metadata" />
      <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
        <p className="min-w-0 break-words text-xs font-semibold uppercase tracking-wide text-wewin-navy">
          {label ?? t("title")}
          {clipLabel ? (
            <span className="ml-2 font-normal normal-case text-wewin-navy/70">
              {clipLabel}
            </span>
          ) : null}
        </p>
        <span className="shrink-0 font-mono text-xs text-wewin-navy/80">
          {fmt(current)} / {fmt(max || duration)}
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => skip(-5)}
          className="rounded-lg border border-wewin-navy/20 bg-white px-2 py-2 text-xs font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg"
        >
          {t("back5")}
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg bg-wewin-navy px-4 py-2 text-sm font-medium text-white hover:bg-wewin-navy-hover"
        >
          {playing ? t("pause") : t("play")}
        </button>
        <button
          type="button"
          onClick={() => skip(5)}
          className="rounded-lg border border-wewin-navy/20 bg-white px-2 py-2 text-xs font-medium text-wewin-navy hover:bg-wewin-accent-blue-bg"
        >
          {t("fwd5")}
        </button>
        <input
          type="range"
          min={start}
          max={progressMax}
          step={0.1}
          value={Math.min(Math.max(current, start), progressMax)}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-2 min-w-0 flex-1 basis-[8rem] cursor-pointer accent-wewin-navy"
        />
      </div>
    </div>
  );
}
