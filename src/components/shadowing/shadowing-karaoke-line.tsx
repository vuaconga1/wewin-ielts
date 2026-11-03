"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CueWord } from "@/lib/shadowing/cues";

function cleanWord(str: string): string {
  return str.replace(/[^\w]/g, "").toLowerCase();
}

export type KaraokeVariant = "card" | "video" | "hero";

export function KaraokeLine({
  text,
  words,
  audioRef,
  isPlaying = false,
  variant = "card",
  className = "",
  onWordClick,
}: {
  text: string;
  words?: CueWord[] | null;
  audioRef: React.RefObject<HTMLMediaElement | null>;
  isPlaying?: boolean;
  variant?: KaraokeVariant;
  className?: string;
  onWordClick?: (timeSec: number) => void;
}) {
  const [currentTime, setCurrentTime] = useState<number>(() => audioRef.current?.currentTime ?? 0);
  const rafRef = useRef<number | null>(null);

  // Sync with audio events (timeupdate & seeked)
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const syncTime = () => setCurrentTime(el.currentTime);
    el.addEventListener("timeupdate", syncTime);
    el.addEventListener("seeked", syncTime);
    syncTime();
    return () => {
      el.removeEventListener("timeupdate", syncTime);
      el.removeEventListener("seeked", syncTime);
    };
  }, [audioRef]);

  // High-frame-rate animation loop while media is playing
  useEffect(() => {
    if (!words || words.length === 0) return;

    let cancelled = false;
    const loop = () => {
      const el = audioRef.current;
      if (el) {
        setCurrentTime(el.currentTime);
      }
      if (!cancelled) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [audioRef, isPlaying, words]);

  // Tokenize text into words preserving display punctuation
  const tokenPairs = useMemo(() => {
    if (!words || words.length === 0) return null;
    const rawTokens = text.trim().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return null;

    // Direct 1-to-1 match
    if (rawTokens.length === words.length) {
      return rawTokens.map((token, i) => ({
        token,
        word: words[i],
      }));
    }

    // Heuristic alignment when counts slightly differ (e.g. punctuation splits)
    const pairs: { token: string; word: CueWord }[] = [];
    let wi = 0;
    for (let ti = 0; ti < rawTokens.length && wi < words.length; ti++) {
      const token = rawTokens[ti];
      const tokenClean = cleanWord(token);
      const wordClean = cleanWord(words[wi].w);

      if (tokenClean === wordClean || tokenClean.includes(wordClean) || wordClean.includes(tokenClean)) {
        pairs.push({ token, word: words[wi] });
        wi++;
      } else {
        // Look ahead 1 word
        if (wi + 1 < words.length && cleanWord(words[wi + 1].w) === tokenClean) {
          wi++;
          pairs.push({ token, word: words[wi] });
          wi++;
        } else {
          pairs.push({ token, word: words[wi] });
          wi++;
        }
      }
    }

    return pairs.length > 0 ? pairs : null;
  }, [text, words]);

  // Fallback: If no word timings or alignment failed, render plain text
  if (!tokenPairs) {
    return <span className={className}>{text}</span>;
  }

  const isVideo = variant === "video";
  const isHero = variant === "hero";

  // Check if current playback position is anywhere inside this sentence span
  const sentenceStart = tokenPairs[0]?.word.s ?? 0;
  const sentenceEnd = tokenPairs[tokenPairs.length - 1]?.word.e ?? 0;
  const isSentenceActive = isPlaying || (currentTime >= sentenceStart - 0.25 && currentTime <= sentenceEnd + 0.35);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1 gap-y-1 ${className}`}>
      {tokenPairs.map(({ token, word }, i) => {
        const isPast = currentTime > word.e;
        const isActive = isSentenceActive && currentTime >= word.s && currentTime <= word.e;

        // Base stable classes for every word to prevent layout shifting
        const baseStyle =
          "relative inline-block px-1.5 py-0.5 rounded-md -mx-0.5 my-0.5 transition-all duration-75 select-none";

        let wordClass = "";

        if (!isSentenceActive) {
          // Playhead is outside this sentence and audio is not active on this line:
          // Keep text comfortably readable.
          if (isVideo) {
            wordClass = "text-white/90 font-medium";
          } else if (isHero) {
            wordClass = "text-slate-900 font-semibold";
          } else {
            wordClass = "text-slate-800 font-medium";
          }
        } else if (isVideo) {
          if (isActive) {
            wordClass =
              "bg-amber-400 text-slate-950 font-bold shadow-md ring-2 ring-amber-300 scale-[1.05] z-10";
          } else if (isPast) {
            wordClass = "text-amber-300 font-semibold";
          } else {
            wordClass = "text-white/60 font-medium";
          }
        } else if (isHero) {
          if (isActive) {
            wordClass =
              "bg-indigo-600 text-white font-bold shadow-sm ring-2 ring-indigo-400/50 scale-[1.05] z-10";
          } else if (isPast) {
            wordClass = "text-indigo-950 font-bold";
          } else {
            wordClass = "text-slate-400 font-medium";
          }
        } else {
          // card variant (default)
          if (isActive) {
            wordClass =
              "bg-wewin-navy text-white font-bold shadow-2xs ring-2 ring-indigo-300/80 scale-[1.04] z-10";
          } else if (isPast) {
            wordClass = "text-wewin-navy font-semibold";
          } else {
            wordClass = "text-slate-400 font-normal";
          }
        }

        const clickable = Boolean(onWordClick);

        return (
          <span
            key={i}
            onClick={
              clickable
                ? (e) => {
                    e.stopPropagation();
                    onWordClick?.(word.s);
                  }
                : undefined
            }
            title={clickable ? `Phát từ "${token}"` : undefined}
            className={`${baseStyle} ${wordClass} ${
              clickable ? "cursor-pointer hover:opacity-90 hover:underline" : ""
            }`}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
}
