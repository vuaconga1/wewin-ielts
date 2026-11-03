"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import { transcriptLines } from "@/lib/shadowing/transcript";
import type { CueTiming } from "@/lib/shadowing/cues";
import type { LineAnnotation } from "@/lib/shadowing/annotations";
import type { SentenceResult } from "@/lib/shadowing/types";
import { AlignedTranscript } from "@/components/dictation/dictation-result";
import { UserAudioPlayer } from "@/components/shadowing/shadowing-audio-player";
import { useSentencePlayback } from "@/components/shadowing/use-sentence-playback";
import { KaraokeLine } from "@/components/shadowing/shadowing-karaoke-line";
import { ShadowingControlBar } from "@/components/shadowing/shadowing-control-bar";

type FontSize = "sm" | "base" | "lg";

export type SentencePlaybackHandle = {
  index: number;
  goTo: (idx: number) => void;
  replay: () => void;
  togglePlay: () => void;
  cues: CueTiming[];
  currentCue: CueTiming | undefined;
};

export function ShadowingTranscript({
  transcript,
  timings = null,
  annotations = null,
  sentenceResults,
  audioRef,
  disabled = false,
  onRecord,
  recordDisabled = false,
  isRecording = false,
  onSentenceChange,
  onSentenceIndexChange,
  onSentenceEnd,
  playbackRef,
  className = "",
}: {
  transcript: string;
  /** Aligned sentence timings; when absent they are estimated from the audio duration. */
  timings?: CueTiming[] | null;
  /** Per-sentence IPA and Vietnamese translation aligned with transcriptLines. */
  annotations?: LineAnnotation[] | null;
  /** Sentence-level grades & recognized text. */
  sentenceResults?: Map<number, SentenceResult>;
  audioRef: React.RefObject<HTMLMediaElement | null>;
  /** Locks sentence navigation and shortcuts, e.g. while the learner is recording. */
  disabled?: boolean;
  onRecord?: () => void;
  recordDisabled?: boolean;
  isRecording?: boolean;
  /** Text of the sentence currently playing (e.g. for a video subtitle). */
  onSentenceChange?: (text: string) => void;
  onSentenceIndexChange?: (index: number) => void;
  onSentenceEnd?: (index: number) => void;
  playbackRef?: React.RefObject<SentencePlaybackHandle | null>;
  className?: string;
}) {
  const { t } = useTranslations("shadowing");
  const lines = useMemo(() => transcriptLines(transcript), [transcript]);
  const [fontSize, setFontSize] = useState<FontSize>("base");
  const [showIpa, setShowIpa] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    try {
      const savedIpa = localStorage.getItem("wewin_shadowing_show_ipa");
      if (savedIpa !== null) setShowIpa(savedIpa === "true");
      const savedTrans = localStorage.getItem("wewin_shadowing_show_translation");
      if (savedTrans !== null) setShowTranslation(savedTrans === "true");
    } catch {
      /* ignore storage access restrictions */
    }
  }, []);

  const toggleIpa = () => {
    setShowIpa((v) => {
      const next = !v;
      try {
        localStorage.setItem("wewin_shadowing_show_ipa", String(next));
      } catch {}
      return next;
    });
  };

  const toggleTranslation = () => {
    setShowTranslation((v) => {
      const next = !v;
      try {
        localStorage.setItem("wewin_shadowing_show_translation", String(next));
      } catch {}
      return next;
    });
  };

  const reveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const hasIpa = useMemo(() => annotations?.some((a) => Boolean(a.ipa)) ?? false, [annotations]);
  const hasTranslation = useMemo(
    () => annotations?.some((a) => Boolean(a.translation)) ?? false,
    [annotations],
  );

  const { index, playing, timed, aligned, cues, currentCue, goTo, replay, togglePlay } = useSentencePlayback({
    lines,
    timings,
    audioRef,
    disabled,
    onSentenceEnd,
    onRecordToggle: onRecord,
  });

  useEffect(() => {
    if (playbackRef) {
      playbackRef.current = { index, goTo, replay, togglePlay, cues, currentCue };
    }
  }, [playbackRef, index, goTo, replay, togglePlay, cues, currentCue]);

  useEffect(() => {
    onSentenceIndexChange?.(index);
  }, [index, onSentenceIndexChange]);

  const practicedEntries = useMemo(() => {
    if (!sentenceResults || sentenceResults.size === 0) return [];
    return Array.from(sentenceResults.values()).filter((res) => res?.score !== undefined);
  }, [sentenceResults]);

  const practicedCount = practicedEntries.length;
  const averageScore = practicedCount > 0
    ? Math.round(practicedEntries.reduce((sum, r) => sum + r.score, 0) / practicedCount)
    : 0;

  const weakIndex = useMemo(() => {
    if (!sentenceResults) return -1;
    for (let i = 0; i < lines.length; i++) {
      const res = sentenceResults.get(i);
      if (res && res.score < 60) return i;
    }
    return -1;
  }, [lines.length, sentenceResults]);

  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentText = lines[index]?.text ?? "";
  useEffect(() => {
    onSentenceChange?.(currentText);
  }, [currentText, onSentenceChange]);

  useEffect(() => {
    const list = listRef.current;
    const item = itemRefs.current[index];
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: "smooth" });
    }
  }, [index]);

  const totalWords = useMemo(() => {
    return transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [transcript]);

  const fontSizeClass = {
    sm: "text-sm sm:text-base leading-relaxed",
    base: "text-base sm:text-[17px] leading-relaxed",
    lg: "text-lg sm:text-xl leading-relaxed",
  }[fontSize];

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <BookOpen className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
              {t("readAlongTitle", "Transcript")}
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{t("sentencesCount", { n: lines.length }, `${lines.length} câu`)}</span>
              <span>•</span>
              <span>{t("wordsCountShort", { n: totalWords }, `${totalWords} từ`)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* IPA & Translation Toggles with 3D Outline Effect & Explicit ON/OFF Badges */}
          {hasIpa ? (
            <button
              type="button"
              onClick={toggleIpa}
              aria-pressed={showIpa}
              className={`relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black tracking-wide transition-all active:translate-y-0.5 ${
                showIpa
                  ? "border-2 border-indigo-700 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow-[0_3px_0_0_#312e81] hover:brightness-110 active:shadow-[0_1px_0_0_#312e81]"
                  : "border-2 border-slate-300 bg-gradient-to-b from-white to-slate-100 text-slate-700 shadow-[0_3px_0_0_#cbd5e1] hover:border-slate-400 hover:from-slate-50 hover:to-slate-100 active:shadow-[0_1px_0_0_#cbd5e1]"
              }`}
              title={showIpa ? t("hideIpa", "Ẩn IPA") : t("showIpa", "Hiện IPA")}
            >
              <span>IPA</span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                  showIpa
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "bg-slate-200/90 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    showIpa ? "bg-white animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span>{showIpa ? "ON" : "OFF"}</span>
              </span>
            </button>
          ) : null}

          {hasTranslation ? (
            <button
              type="button"
              onClick={toggleTranslation}
              aria-pressed={showTranslation}
              className={`relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black tracking-wide transition-all active:translate-y-0.5 ${
                showTranslation
                  ? "border-2 border-indigo-700 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow-[0_3px_0_0_#312e81] hover:brightness-110 active:shadow-[0_1px_0_0_#312e81]"
                  : "border-2 border-slate-300 bg-gradient-to-b from-white to-slate-100 text-slate-700 shadow-[0_3px_0_0_#cbd5e1] hover:border-slate-400 hover:from-slate-50 hover:to-slate-100 active:shadow-[0_1px_0_0_#cbd5e1]"
              }`}
              title={showTranslation ? t("hideTranslation", "Ẩn dịch") : t("showTranslation", "Hiện dịch")}
            >
              <span>{t("showTranslation", "Dịch")}</span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                  showTranslation
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "bg-slate-200/90 text-slate-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    showTranslation ? "bg-white animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span>{showTranslation ? "ON" : "OFF"}</span>
              </span>
            </button>
          ) : null}

          {/* Font size controls with 3D Outline Effect */}
          <div className="flex items-center gap-1 rounded-xl border-2 border-slate-300 bg-gradient-to-b from-white to-slate-100 p-0.5 shadow-[0_3px_0_0_#cbd5e1]">
            <button
              type="button"
              onClick={() => setFontSize(fontSize === "lg" ? "base" : "sm")}
              disabled={fontSize === "sm"}
              title={t("fontSmaller", "Thu nhỏ chữ")}
              className="flex h-7 w-7 items-center justify-center rounded-lg font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-90 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="rounded-md border border-indigo-200/90 bg-indigo-50/90 px-2 py-0.5 font-mono text-xs font-black text-indigo-800 shadow-2xs select-none">
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => setFontSize(fontSize === "sm" ? "base" : "lg")}
              disabled={fontSize === "lg"}
              title={t("fontLarger", "Phóng to chữ")}
              className="flex h-7 w-7 items-center justify-center rounded-lg font-bold text-slate-700 transition-all hover:bg-slate-200 active:scale-90 disabled:opacity-25 disabled:hover:bg-transparent"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Summary Bar (sentence mode) */}
      {practicedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-emerald-50/50 px-4 py-2 text-xs text-slate-700">
          <span className="font-medium text-emerald-900">
            {t("progressSummary", { done: practicedCount, total: lines.length, avg: averageScore })}
          </span>
          {weakIndex >= 0 ? (
            <button
              type="button"
              onClick={() => goTo(weakIndex)}
              className="font-semibold text-wewin-navy hover:underline"
            >
              {t("reviewWeak", "Luyện câu < 60 điểm")} →
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Transcript Sentence Cards (tip text removed per user request) */}
      <div ref={listRef} className="max-h-[calc(100vh-320px)] min-h-[300px] overflow-y-auto p-3 sm:p-4">
        <div className={`space-y-2.5 ${fontSizeClass}`}>
          {lines.map((line, idx) => {
            const isHighlighted = index === idx;
            const sentenceNum = String(idx + 1).padStart(2, "0");
            const ann = annotations?.[idx];
            const res = sentenceResults?.get(idx);
            const badgeClass =
              res == null
                ? ""
                : res.score >= 80
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : res.score >= 60
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700";

            return (
              <div
                key={idx}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                onClick={() => {
                  if (!disabled) goTo(idx);
                }}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all ${
                  isHighlighted
                    ? "border-indigo-400 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-200"
                    : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700"
                }`}
              >
                {/* Sentence Number Badge */}
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                    isHighlighted
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                  }`}
                >
                  {sentenceNum}
                </span>

                {/* Sentence Content (3-layer) */}
                <div className="min-w-0 flex-1">
                  {line.speaker ? (
                    <span className="mr-1.5 inline-block rounded bg-wewin-navy/10 px-1.5 py-0.5 text-xs font-bold text-wewin-navy">
                      {line.speaker}:
                    </span>
                  ) : null}
                  {isHighlighted && cues[idx]?.words && (cues[idx]?.words?.length ?? 0) > 0 ? (
                    <KaraokeLine
                      text={line.text}
                      words={cues[idx].words}
                      audioRef={audioRef}
                      isPlaying={playing}
                      variant="card"
                      className="text-slate-900"
                      onWordClick={(timeSec) => {
                        const el = audioRef.current;
                        if (el) {
                          el.currentTime = timeSec;
                          if (el.paused) void el.play();
                        }
                      }}
                    />
                  ) : (
                    <span
                      className={
                        isHighlighted
                          ? "font-semibold text-slate-900"
                          : "text-slate-800"
                      }
                    >
                      {line.text}
                    </span>
                  )}

                  {/* Layer 2: IPA */}
                  {showIpa && ann?.ipa ? (
                    <p className="mt-1 break-words font-mono text-[13px] text-slate-500">
                      {ann.ipa}
                    </p>
                  ) : null}

                  {/* Layer 3: Vietnamese translation */}
                  {ann?.translation ? (
                    showTranslation || revealed.has(idx) ? (
                      <p className="mt-1 break-words text-sm italic text-slate-600">
                        {ann.translation}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          reveal(idx);
                        }}
                        className="mt-1 block text-xs font-semibold text-wewin-navy hover:underline"
                      >
                        {t("revealTranslation", "Xem nghĩa")}
                      </button>
                    )
                  ) : null}

                  {/* Sentence Evaluation Details (when active and graded) */}
                  {isHighlighted && res && (res.wordResults.length > 0 || res.recordingUrl) ? (
                    <div className="mt-3 space-y-2.5 rounded-lg border border-slate-200/60 bg-white/90 p-2.5 shadow-2xs">
                      {res.wordResults.length > 0 ? (
                        <AlignedTranscript
                          wordResults={res.wordResults}
                          title={t("transcriptTitle", "Đối chiếu câu đọc")}
                          actualLabel={(w) => t("heardAs", { word: w }, `Hệ thống nghe: ${w}`)}
                        />
                      ) : null}
                      {res.recordingUrl ? (
                        <UserAudioPlayer
                          src={res.recordingUrl}
                          label={t("yourRecording", "Bản ghi của bạn")}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Score badge or active check */}
                {res != null ? (
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums ${badgeClass}`}
                  >
                    {res.score}%
                  </span>
                ) : isHighlighted ? (
                  <span className="shrink-0 text-indigo-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <ShadowingControlBar
        currentIndex={index}
        totalSentences={lines.length}
        playing={playing}
        timed={timed}
        aligned={aligned}
        disabled={disabled}
        isRecording={isRecording}
        recordDisabled={recordDisabled}
        onReplay={replay}
        onPrev={() => goTo(index - 1)}
        onNext={() => goTo(index + 1)}
        onTogglePlay={togglePlay}
        onRecord={onRecord}
      />
    </section>
  );
}
