"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";
import type { VocabWord } from "@/lib/learn/vocab-grammar-types";
import { VocabAudioButton } from "@/components/learn/vocab-audio-button";
import { useTranslations } from "@/i18n/provider";

type Props = {
  words: VocabWord[];
};

function shuffled<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function VocabFlashcards({ words }: Props) {
  const { t } = useTranslations("learn");
  const [order, setOrder] = useState<VocabWord[]>(words);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    setOrder(words);
    setIndex(0);
    setFlipped(false);
    setIsShuffled(false);
  }, [words]);

  const total = order.length;
  const entry = order[index];

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setFlipped(false);
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
    },
    [total],
  );

  const toggleShuffle = useCallback(() => {
    setOrder(isShuffled ? words : shuffled(words));
    setIsShuffled((v) => !v);
    setIndex(0);
    setFlipped(false);
  }, [isShuffled, words]);

  const restart = useCallback(() => {
    setIndex(0);
    setFlipped(false);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        if (target?.tagName === "BUTTON") return;
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const percent = useMemo(
    () => (total ? Math.round(((index + 1) / total) * 100) : 0),
    [index, total],
  );

  if (!entry) return null;

  const posLabel = entry.pos ? ` (${entry.pos})` : "";
  const faceClass =
    "absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border px-5 py-6 text-center [backface-visibility:hidden]";

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-wewin-navy transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-600">
          {t("flashcardCounter", { n: index + 1, total }, "{n} / {total}")}
        </span>
      </div>

      <div className="[perspective:1200px]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setFlipped((f) => !f)}
          aria-label={t("flashcardFlip", "Lật thẻ")}
          aria-pressed={flipped}
          className="relative block h-64 w-full cursor-pointer select-none rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wewin-navy sm:h-72"
        >
          <div
            className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className={`${faceClass} border-zinc-200 bg-white shadow-sm`}>
              <p className="max-w-full break-words text-2xl font-bold text-zinc-900 sm:text-3xl">
                {entry.word}
                {posLabel ? (
                  <span className="text-lg font-semibold text-zinc-500">{posLabel}</span>
                ) : null}
              </p>
              {entry.ipa ? (
                <p className="max-w-full break-all font-mono text-sm text-zinc-600 sm:text-base">
                  {entry.ipa}
                </p>
              ) : null}
              <span
                className="flex flex-wrap items-center justify-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <VocabAudioButton
                  text={entry.word}
                  label={t("audioUk", "UK")}
                  accent="uk"
                  audioUrl={entry.audioUkUrl}
                />
                <VocabAudioButton
                  text={entry.word}
                  label={t("audioUs", "US")}
                  accent="us"
                  audioUrl={entry.audioUsUrl}
                />
              </span>
              <p className="text-xs text-zinc-400">
                {t("flashcardTapHint", "Chạm vào thẻ để xem nghĩa")}
              </p>
            </div>

            <div
              className={`${faceClass} border-wewin-navy bg-wewin-navy text-white [transform:rotateY(180deg)]`}
            >
              <p className="max-w-full break-words text-xl font-bold sm:text-2xl">
                {entry.meaningVi}
              </p>
              {entry.definitionEn ? (
                <p className="max-w-full break-words text-sm text-white/80">
                  {entry.definitionEn}
                </p>
              ) : null}
              {entry.exampleEn ? (
                <p className="max-w-full break-words text-sm italic text-white/80">
                  {entry.exampleEn.replace(/[\[\]]/g, "")}
                </p>
              ) : null}
              <p className="max-w-full break-words text-sm font-semibold text-white/70">
                {entry.word}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-pressed={isShuffled}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
              isShuffled
                ? "border-wewin-navy bg-wewin-accent-blue-bg text-wewin-navy"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Shuffle className="h-4 w-4" />
            {t("flashcardShuffle", "Trộn thẻ")}
          </button>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" />
            {t("flashcardRestart", "Học lại")}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="inline-flex items-center gap-0.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("flashcardPrev", "Trước")}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index >= total - 1}
            className="inline-flex items-center gap-0.5 rounded-lg bg-wewin-navy px-3 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-40"
          >
            {t("flashcardNext", "Tiếp")}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="hidden text-center text-xs text-zinc-400 sm:block">
        {t("flashcardKeyboardHint", "Phím ← → để chuyển thẻ, Space để lật")}
      </p>
    </div>
  );
}
