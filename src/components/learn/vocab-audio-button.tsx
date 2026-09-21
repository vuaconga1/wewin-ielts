"use client";

import { Volume2 } from "lucide-react";

type Accent = "uk" | "us" | "default";

type Props = {
  text: string;
  label: string;
  accent?: Accent;
  audioUrl?: string;
  /** Show speaker icon only (label used for a11y). */
  iconOnly?: boolean;
  className?: string;
};

function speechLang(accent: Accent): string {
  if (accent === "uk") return "en-GB";
  if (accent === "us") return "en-US";
  return "en-GB";
}

function playSpeech(text: string, accent: Accent) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = speechLang(accent);
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) =>
    v.lang.toLowerCase().startsWith(utter.lang.toLowerCase()),
  );
  if (match) utter.voice = match;
  window.speechSynthesis.speak(utter);
}

export function VocabAudioButton({
  text,
  label,
  accent = "default",
  audioUrl,
  iconOnly = false,
  className = "",
}: Props) {
  function onPlay() {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => playSpeech(text, accent));
      return;
    }
    playSpeech(text, accent);
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      className={`inline-flex items-center gap-1 rounded-md text-wewin-accent-blue hover:bg-wewin-accent-blue-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-wewin-navy ${
        iconOnly ? "p-1" : "px-1.5 py-1 text-xs font-semibold"
      } ${className}`}
      aria-label={label}
      title={label}
    >
      <Volume2 className="h-4 w-4 shrink-0" aria-hidden />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
