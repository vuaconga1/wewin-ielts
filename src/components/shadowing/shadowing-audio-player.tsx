"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";

type Props = {
  src: string;
  title?: string;
  badge?: string;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  className?: string;
  onPlayChange?: (playing: boolean) => void;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ShadowingAudioPlayer({
  src,
  title = "Audio mẫu",
  badge = "Giọng bản xứ",
  audioRef: externalRef,
  className = "",
  onPlayChange,
}: Props) {
  const internalRef = useRef<HTMLAudioElement | null>(null);
  const ref = externalRef ?? internalRef;

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPlay = () => {
      setPlaying(true);
      onPlayChange?.(true);
    };
    const onPause = () => {
      setPlaying(false);
      onPlayChange?.(false);
    };
    const onEnded = () => {
      setPlaying(false);
      onPlayChange?.(false);
    };
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
      }
    };
    const onDurationChange = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration);
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("durationchange", onDurationChange);

    if (el.readyState >= 1 && Number.isFinite(el.duration)) {
      setDuration(el.duration);
    }

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("durationchange", onDurationChange);
    };
  }, [ref, onPlayChange]);

  const togglePlay = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  const seek = (seconds: number) => {
    const el = ref.current;
    if (!el) return;
    const clamped = Math.min(Math.max(seconds, 0), duration || seconds);
    el.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const skip = (delta: number) => {
    seek(currentTime + delta);
  };

  const changeSpeed = (rate: number) => {
    const el = ref.current;
    if (!el) return;
    el.playbackRate = rate;
    setSpeed(rate);
  };

  const toggleMute = () => {
    const el = ref.current;
    if (!el) return;
    el.muted = !muted;
    setMuted(!muted);
  };

  const changeVolume = (newVol: number) => {
    const el = ref.current;
    if (!el) return;
    el.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && muted) {
      el.muted = false;
      setMuted(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md ${className}`}
    >
      <audio ref={ref} src={src} preload="metadata" />

      {/* Header bar of audio player */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-wewin-accent-blue-bg text-wewin-accent-blue">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            <p className="text-[11px] text-slate-500">Nghe kỹ ngữ điệu và nối âm</p>
          </div>
        </div>

        {badge && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {badge}
          </span>
        )}
      </div>

      {/* Main interactive controls */}
      <div className="mt-4 space-y-3">
        {/* Timeline Slider & Progress Bar */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Thanh tiến trình audio"
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-wewin-navy transition-all hover:bg-slate-300"
              style={{
                background: `linear-gradient(to right, #0d1b3e ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between font-mono text-xs tabular-nums text-slate-500">
            <span className="font-medium text-slate-700">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons: Seek, Play, Speed, Volume */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => skip(-5)}
              aria-label="Lùi 5 giây"
              title="Lùi 5 giây"
              className="group flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-45" />
              <span>5s</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Tạm dừng" : "Phát audio"}
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-medium text-white shadow-sm transition-all active:scale-95 ${playing
                  ? "bg-slate-900 hover:bg-slate-800 ring-2 ring-slate-900/20"
                  : "bg-wewin-navy hover:bg-wewin-navy-hover ring-2 ring-wewin-navy/20"
                }`}
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skip(5)}
              aria-label="Tua nhanh 5 giây"
              title="Tua nhanh 5 giây"
              className="group flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            >
              <span>5s</span>
              <RotateCw className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
            </button>
          </div>

          {/* Speed & Volume Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed selection pills */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5">
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => changeSpeed(rate)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold transition-all ${speed === rate
                      ? "bg-white text-wewin-navy shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume toggle */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-rose-500" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>

              {showVolumeSlider && (
                <div className="absolute -top-10 right-0 z-10 flex w-28 items-center rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(Number(e.target.value))}
                    aria-label="Âm lượng"
                    className="h-1.5 w-full cursor-pointer accent-wewin-navy"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lightweight audio preview player for user recordings */
export function UserAudioPlayer({
  src,
  label = "Bản ghi của bạn",
  className = "",
}: {
  src: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);

    if (el.readyState >= 1 && Number.isFinite(el.duration)) {
      setDuration(el.duration);
    }

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const seek = (value: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = value;
    setCurrentTime(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2.5 ${className}`}
    >
      <audio ref={ref} src={src} preload="metadata" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Tạm dừng" : "Nghe lại"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wewin-navy text-white shadow-2xs transition-transform hover:scale-105 active:scale-95"
      >
        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current translate-x-0.5" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">{label}</span>
          <span className="font-mono tabular-nums text-slate-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="mt-1.5 relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-wewin-navy"
            style={{
              background: `linear-gradient(to right, #0d1b3e ${progress}%, #cbd5e1 ${progress}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
