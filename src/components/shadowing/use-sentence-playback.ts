"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TranscriptLine } from "@/lib/shadowing/transcript";
import { applyTimings, cueIndexAt, estimateCues, type CueTiming } from "@/lib/shadowing/cues";

/** Seeking can land a few ms before a cue start; without slack the previous cue would win. */
const SEEK_SLACK_SEC = 0.05;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName);
}

/**
 * Sentence-level control of the model audio: follows playback, seeks to a sentence,
 * replays one sentence, and wires Space / ←→ / R shortcuts.
 */
export function useSentencePlayback({
  lines,
  timings,
  audioRef,
  disabled,
}: {
  lines: TranscriptLine[];
  timings: CueTiming[] | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  disabled: boolean;
}) {
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const stopAtRef = useRef<number | null>(null);

  const aligned = useMemo(() => (timings ? applyTimings(lines, timings) : null), [lines, timings]);
  const cues = useMemo(() => aligned ?? estimateCues(lines, duration), [aligned, lines, duration]);
  const timed = Boolean(aligned) || duration > 0;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const syncDuration = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    syncDuration();
    el.addEventListener("loadedmetadata", syncDuration);
    el.addEventListener("durationchange", syncDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("loadedmetadata", syncDuration);
      el.removeEventListener("durationchange", syncDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, [audioRef]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !timed) return;
    const onTimeUpdate = () => {
      const stopAt = stopAtRef.current;
      if (stopAt != null && el.currentTime >= stopAt) {
        stopAtRef.current = null;
        el.pause();
        return;
      }
      setIndex(Math.max(0, cueIndexAt(cues, el.currentTime + SEEK_SLACK_SEC)));
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [audioRef, cues, timed]);

  const goTo = useCallback(
    (next: number) => {
      if (lines.length === 0) return;
      const i = Math.min(Math.max(next, 0), lines.length - 1);
      setIndex(i);
      stopAtRef.current = null;
      const el = audioRef.current;
      if (el && timed) el.currentTime = cues[i].start;
    },
    [audioRef, cues, lines.length, timed],
  );

  const replay = useCallback(() => {
    const el = audioRef.current;
    const cue = cues[index];
    if (!el || !timed || !cue) return;
    el.currentTime = cue.start;
    stopAtRef.current = cue.end;
    void el.play();
  }, [audioRef, cues, index, timed]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      stopAtRef.current = null;
      void el.play();
    } else {
      el.pause();
    }
  }, [audioRef]);

  useEffect(() => {
    if (disabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        replay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, goTo, index, replay, togglePlay]);

  return { index, playing, timed, aligned: Boolean(aligned), goTo, replay, togglePlay };
}
