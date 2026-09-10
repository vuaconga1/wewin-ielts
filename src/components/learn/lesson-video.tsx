"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type Props = {
  src: string;
  lessonId: string;
  initialMaxWatchedSec?: number;
  alreadyCompleted?: boolean;
  onCompleted: () => void;
};

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/**
 * HTML5 video with anti-skip: scrub/seek only up to maxWatchedTime.
 * Pause allowed; forward seek blocked. Marks complete at ≥95% or ended.
 */
export function LessonVideo({
  src,
  lessonId,
  initialMaxWatchedSec = 0,
  alreadyCompleted = false,
  onCompleted,
}: Props) {
  const { t } = useTranslations("learn");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxWatched, setMaxWatched] = useState(initialMaxWatchedSec);
  const [completed, setCompleted] = useState(alreadyCompleted);

  const maxWatchedRef = useRef(initialMaxWatchedSec);
  const completedRef = useRef(alreadyCompleted);
  const lastPersist = useRef(0);
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    maxWatchedRef.current = initialMaxWatchedSec;
    setMaxWatched(initialMaxWatchedSec);
    completedRef.current = alreadyCompleted;
    setCompleted(alreadyCompleted);
    setCurrent(0);
    setPlaying(false);
  }, [lessonId, initialMaxWatchedSec, alreadyCompleted, src]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const persist = (sec: number, done?: boolean) => {
      const now = Date.now();
      if (!done && now - lastPersist.current < 2500) return;
      lastPersist.current = now;
      void fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "video",
          lessonId,
          maxWatchedSec: sec,
          videoCompleted: done || completedRef.current,
        }),
      }).catch(() => {});
    };

    const markDone = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      setCompleted(true);
      const sec = Math.max(
        maxWatchedRef.current,
        el.currentTime,
        el.duration || 0,
      );
      maxWatchedRef.current = sec;
      setMaxWatched(sec);
      persist(sec, true);
      onCompletedRef.current();
    };

    const onTime = () => {
      const cap = maxWatchedRef.current;
      const t = el.currentTime;
      if (t > cap + 0.35 && !completedRef.current) {
        el.currentTime = cap;
        return;
      }
      setCurrent(t);
      if (t > cap) {
        maxWatchedRef.current = t;
        setMaxWatched(t);
        persist(t);
      }
      const dur = el.duration;
      if (Number.isFinite(dur) && dur > 0 && t / dur >= 0.95) {
        markDone();
      }
    };

    const onMeta = () => {
      setDuration(el.duration || 0);
      setCurrent(el.currentTime);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      markDone();
    };
    const onSeeking = () => {
      if (completedRef.current) return;
      if (el.currentTime > maxWatchedRef.current + 0.25) {
        el.currentTime = maxWatchedRef.current;
      }
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("seeking", onSeeking);
    if (el.readyState >= 1) onMeta();

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("seeking", onSeeking);
    };
  }, [lessonId, src]);

  function toggle() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function seek(value: number) {
    const el = videoRef.current;
    if (!el) return;
    const cap = completed ? duration || value : maxWatchedRef.current;
    const next = Math.min(Math.max(0, value), cap);
    el.currentTime = next;
    setCurrent(next);
  }

  const progressMax = Math.max(duration || 1, 0.1);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 text-white shadow-lg">
      <div className="relative aspect-video bg-black">
        <video
          key={lessonId}
          ref={videoRef}
          src={src}
          className="h-full w-full"
          playsInline
          preload="metadata"
          controls={false}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="relative h-2 w-full rounded-full bg-zinc-700">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-zinc-500/70"
            style={{
              width: `${Math.min(100, (maxWatched / progressMax) * 100)}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={progressMax}
            step={0.1}
            value={Math.min(current, progressMax)}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent accent-wewin-navy"
            aria-label={t("videoProgressAria")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold hover:bg-wewin-navy-hover"
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-white" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
            {playing ? t("pause") : t("play")}
          </button>
          <span className="font-mono text-xs text-zinc-300">
            {fmt(current)} / {fmt(duration)}
          </span>
          <span className="w-full text-xs leading-snug text-zinc-400 sm:ml-auto sm:w-auto sm:text-right">
            {completed ? t("watchedDone") : t("noSeekAhead")}
          </span>
        </div>
      </div>
    </div>
  );
}
