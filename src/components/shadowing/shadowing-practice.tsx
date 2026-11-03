"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Headphones,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { learnShadowingHref } from "@/lib/learn/hrefs";
import { formatClock } from "@/lib/dictation/format";
import { activeSpeechProvider, type SpeechErrorCode, type SpeechSession } from "@/lib/shadowing/stt/client";
import { gradeShadowing, pickClosestAlternatives } from "@/lib/shadowing/scoring";
import { transcriptLines } from "@/lib/shadowing/transcript";
import type {
  PublicShadowingExercise,
  SentenceResult,
  ShadowingAttemptResult,
  ShadowingGrade,
} from "@/lib/shadowing/types";
import { useTranslations } from "@/i18n/provider";
import { ShadowingResult } from "@/components/shadowing/shadowing-result";
import { ShadowingHistory } from "@/components/shadowing/shadowing-history";
import {
  ShadowingTranscript,
  type SentencePlaybackHandle,
} from "@/components/shadowing/shadowing-transcript";
import { ShadowingAudioPlayer, UserAudioPlayer } from "@/components/shadowing/shadowing-audio-player";
import { KaraokeLine } from "@/components/shadowing/shadowing-karaoke-line";
import { estimateWordTimings } from "@/lib/shadowing/cues";
import { AlignedTranscript } from "@/components/dictation/dictation-result";

type FullPhase = "idle" | "starting" | "recording" | "processing" | "recorded" | "submitting";
type SentencePhase = "idle" | "starting" | "recording" | "processing";

type Recording = { blob: Blob; url: string; durationMs: number };

const RECOGNITION_LANG = "en-US";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) =>
    MediaRecorder.isTypeSupported(t),
  );
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function ShadowingPractice({ exercise }: { exercise: PublicShadowingExercise }) {
  const { t } = useTranslations("shadowing");
  const provider = activeSpeechProvider;
  const maxMs = exercise.maxRecordSeconds * 1000;
  const lines = useMemo(() => transcriptLines(exercise.transcript), [exercise.transcript]);

  // Mode: "sentence" (default if video or >= 4 lines) or "full"
  const [mode, setMode] = useState<"sentence" | "full">(() =>
    exercise.videoUrl || lines.length >= 4 ? "sentence" : "full",
  );

  const sampleRef = useRef<HTMLMediaElement>(null);
  const playbackRef = useRef<SentencePlaybackHandle | null>(null);
  const [samplePlaying, setSamplePlaying] = useState(false);

  useEffect(() => {
    const el = sampleRef.current;
    if (!el) return;
    const onPlay = () => setSamplePlaying(true);
    const onPause = () => setSamplePlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onPause);
    };
  }, []);

  // Common browser support check
  const [supported, setSupported] = useState<boolean | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Full passage recording state
  // ---------------------------------------------------------------------------
  const fullStreamRef = useRef<MediaStream | null>(null);
  const fullRecorderRef = useRef<MediaRecorder | null>(null);
  const fullChunksRef = useRef<Blob[]>([]);
  const fullSpeechRef = useRef<SpeechSession | null>(null);
  const fullSegmentsRef = useRef<string[][]>([]);
  const fullTickRef = useRef<number | null>(null);
  const fullStartedAtRef = useRef(0);
  const fullRecordingUrlRef = useRef<string | null>(null);
  const fullStopRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<FullPhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [recognized, setRecognized] = useState("");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [result, setResult] = useState<ShadowingAttemptResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  // ---------------------------------------------------------------------------
  // 2. Sentence-by-sentence recording & grading state
  // ---------------------------------------------------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentencePhase, setSentencePhase] = useState<SentencePhase>("idle");
  const [sentenceElapsedMs, setSentenceElapsedMs] = useState(0);
  const [sentenceMaxMs, setSentenceMaxMs] = useState(6000);
  const [sentenceLiveText, setSentenceLiveText] = useState("");
  const [autoShadow, setAutoShadow] = useState(false);
  const [sentenceResults, setSentenceResults] = useState<Map<number, SentenceResult>>(() => new Map());

  const sentenceStreamRef = useRef<MediaStream | null>(null);
  const sentenceRecorderRef = useRef<MediaRecorder | null>(null);
  const sentenceChunksRef = useRef<Blob[]>([]);
  const sentenceSpeechRef = useRef<SpeechSession | null>(null);
  const sentenceTickRef = useRef<number | null>(null);
  const sentenceStartedAtRef = useRef(0);
  const sentenceStopRef = useRef<() => void>(() => {});
  const activeRecordingIdxRef = useRef(0);
  const sentenceUrlsRef = useRef<Map<number, string>>(new Map());

  const autoShadowRef = useRef(false);
  useEffect(() => {
    autoShadowRef.current = autoShadow;
  }, [autoShadow]);
  const autoTimerRef = useRef<number | null>(null);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current != null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Initial check & hydration from localStorage
  // ---------------------------------------------------------------------------
  useEffect(() => {
    setSupported(
      provider.isSupported() &&
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined",
    );
  }, [provider]);

  useEffect(() => {
    try {
      const storageKey = `wewin_shadowing_progress_${exercise.slug}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      if (parsed && typeof parsed === "object") {
        setSentenceResults((prev) => {
          const next = new Map(prev);
          for (const [idxStr, score] of Object.entries(parsed)) {
            const idx = Number(idxStr);
            if (Number.isInteger(idx) && idx >= 0 && idx < lines.length) {
              if (!next.has(idx)) {
                next.set(idx, {
                  score: Math.round(Number(score)),
                  wer: 0,
                  totalWords: 0,
                  correctCount: 0,
                  substitutionCount: 0,
                  deletionCount: 0,
                  insertionCount: 0,
                  recognizedText: "",
                  wordResults: [],
                });
              }
            }
          }
          return next;
        });
      }
    } catch {
      /* ignore storage access restrictions */
    }
  }, [exercise.slug, lines.length]);

  // Mic & recording cleanup helpers
  const releaseFullMic = useCallback(() => {
    if (fullTickRef.current != null) window.clearInterval(fullTickRef.current);
    fullTickRef.current = null;
    fullStreamRef.current?.getTracks().forEach((track) => track.stop());
    fullStreamRef.current = null;
  }, []);

  const replaceRecordingUrl = useCallback((url: string | null) => {
    if (fullRecordingUrlRef.current) URL.revokeObjectURL(fullRecordingUrlRef.current);
    fullRecordingUrlRef.current = url;
  }, []);

  const releaseSentenceMic = useCallback(() => {
    if (sentenceTickRef.current != null) window.clearInterval(sentenceTickRef.current);
    sentenceTickRef.current = null;
    sentenceStreamRef.current?.getTracks().forEach((track) => track.stop());
    sentenceStreamRef.current = null;
  }, []);

  useEffect(
    () => () => {
      clearAutoTimer();
      fullSpeechRef.current?.abort();
      if (fullRecorderRef.current?.state === "recording") fullRecorderRef.current.stop();
      releaseFullMic();
      replaceRecordingUrl(null);

      sentenceSpeechRef.current?.abort();
      if (sentenceRecorderRef.current?.state === "recording") sentenceRecorderRef.current.stop();
      releaseSentenceMic();

      for (const url of sentenceUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      sentenceUrlsRef.current.clear();
    },
    [clearAutoTimer, releaseFullMic, releaseSentenceMic, replaceRecordingUrl],
  );

  const speechErrorMessage = useCallback(
    (code: SpeechErrorCode) => {
      switch (code) {
        case "not-allowed":
          return t("errors.micDenied", "Trình duyệt đang chặn micro. Hãy cho phép micro rồi thử lại.");
        case "audio-capture":
          return t("errors.noMic", "Không tìm thấy micro trên thiết bị.");
        case "network":
          return t("errors.sttNetwork", "Nhận diện giọng nói cần kết nối Internet. Kiểm tra mạng rồi thử lại.");
        case "unsupported":
          return t("errors.unsupported", "Trình duyệt này chưa hỗ trợ nhận diện giọng nói.");
        default:
          return t("errors.sttFailed", "Nhận diện giọng nói bị gián đoạn. Hãy ghi âm lại.");
      }
    },
    [t],
  );

  // ---------------------------------------------------------------------------
  // Full mode recording methods
  // ---------------------------------------------------------------------------
  async function startRecording() {
    if (phase !== "idle" && phase !== "recorded") return;
    setError(null);
    setNeedsLogin(false);
    setLiveText("");
    setRecognized("");
    setRecording(null);
    replaceRecordingUrl(null);
    sampleRef.current?.pause();
    setPhase("starting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotFoundError" || name === "OverconstrainedError"
          ? t("errors.noMic", "Không tìm thấy micro trên thiết bị.")
          : t("errors.micDenied", "Trình duyệt đang chặn micro. Hãy cho phép micro rồi thử lại."),
      );
      setPhase("idle");
      return;
    }
    fullStreamRef.current = stream;

    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      releaseFullMic();
      setError(t("errors.unsupported", "Trình duyệt này chưa hỗ trợ nhận diện giọng nói."));
      setPhase("idle");
      return;
    }
    fullChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) fullChunksRef.current.push(e.data);
    };
    fullRecorderRef.current = recorder;
    recorder.start(250);

    fullSpeechRef.current = provider.start({
      lang: RECOGNITION_LANG,
      onText: setLiveText,
      onError: (code) => {
        setError(speechErrorMessage(code));
        if (code !== "other") fullStopRef.current();
      },
    });

    fullStartedAtRef.current = Date.now();
    setElapsedMs(0);
    fullTickRef.current = window.setInterval(() => {
      const ms = Date.now() - fullStartedAtRef.current;
      setElapsedMs(ms);
      if (ms >= maxMs) fullStopRef.current();
    }, 200);
    setPhase("recording");
  }

  async function stopRecording() {
    const recorder = fullRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    setPhase("processing");
    if (fullTickRef.current != null) window.clearInterval(fullTickRef.current);
    fullTickRef.current = null;
    const durationMs = Math.min(maxMs, Date.now() - fullStartedAtRef.current);

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    const heard = (await fullSpeechRef.current?.stop()) ?? { text: "", segments: [] };
    const text = heard.text;
    fullSegmentsRef.current = heard.segments;
    fullSpeechRef.current = null;
    await stopped;
    releaseFullMic();

    const blob = new Blob(fullChunksRef.current, { type: recorder.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    replaceRecordingUrl(url);
    setRecording({ blob, url, durationMs });
    setRecognized(text.trim());
    setLiveText("");
    setPhase("recorded");
  }

  fullStopRef.current = () => void stopRecording();

  function resetRecording() {
    setRecording(null);
    replaceRecordingUrl(null);
    setRecognized("");
    setError(null);
    setNeedsLogin(false);
    setElapsedMs(0);
    setPhase("idle");
  }

  async function submit() {
    if (phase !== "recorded" || !recording || !recognized) return;
    setPhase("submitting");
    setError(null);
    setNeedsLogin(false);
    try {
      const form = new FormData();
      form.append("recognizedText", recognized);
      form.append("alternatives", JSON.stringify(fullSegmentsRef.current));
      form.append("sttProvider", provider.id);
      form.append("durationMs", String(recording.durationMs));
      form.append(
        "recording",
        recording.blob,
        `recording.${extensionFor(recording.blob.type || "audio/webm")}`,
      );
      const res = await fetch(`/api/shadowing/${exercise.slug}/submit`, { method: "POST", body: form });
      const data = (await res.json()) as ShadowingAttemptResult & { code?: string };
      if (!res.ok) {
        if (res.status === 401) setNeedsLogin(true);
        setError(
          data.code
            ? t(`errors.${data.code}`, t("errors.submitFailed", "Không nộp được bài. Thử lại."))
            : t("errors.submitFailed", "Không nộp được bài. Thử lại."),
        );
        setPhase("recorded");
        return;
      }
      setResult(data);
      setHistoryKey((k) => k + 1);
      resetRecording();
    } catch {
      setError(t("errors.submitFailed", "Không nộp được bài. Thử lại."));
      setPhase("recorded");
    }
  }

  function retry() {
    setResult(null);
    resetRecording();
  }

  // ---------------------------------------------------------------------------
  // Sentence mode recording & client-side grading
  // ---------------------------------------------------------------------------
  async function startSentenceRecording(targetIdx?: number) {
    const idx = targetIdx ?? currentIndex;
    activeRecordingIdxRef.current = idx;
    if (sentencePhase !== "idle") return;
    setError(null);
    setSentenceLiveText("");
    sampleRef.current?.pause();
    setSentencePhase("starting");

    const cue = exercise.cues?.[idx];
    const cueDur = cue ? Math.max(1, cue.end - cue.start) : 3;
    const maxSec = Math.max(4, Math.round(cueDur * 2 + 2));
    const thisMaxMs = maxSec * 1000;
    setSentenceMaxMs(thisMaxMs);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotFoundError" || name === "OverconstrainedError"
          ? t("errors.noMic", "Không tìm thấy micro trên thiết bị.")
          : t("errors.micDenied", "Trình duyệt đang chặn micro. Hãy cho phép micro rồi thử lại."),
      );
      setSentencePhase("idle");
      if (autoShadowRef.current) setAutoShadow(false);
      return;
    }
    sentenceStreamRef.current = stream;

    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      releaseSentenceMic();
      setError(t("errors.unsupported", "Trình duyệt này chưa hỗ trợ nhận diện giọng nói."));
      setSentencePhase("idle");
      if (autoShadowRef.current) setAutoShadow(false);
      return;
    }
    sentenceChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) sentenceChunksRef.current.push(e.data);
    };
    sentenceRecorderRef.current = recorder;
    recorder.start(250);

    sentenceSpeechRef.current = provider.start({
      lang: RECOGNITION_LANG,
      onText: setSentenceLiveText,
      onError: (code) => {
        setError(speechErrorMessage(code));
        if (code !== "other") sentenceStopRef.current();
      },
    });

    sentenceStartedAtRef.current = Date.now();
    setSentenceElapsedMs(0);
    sentenceTickRef.current = window.setInterval(() => {
      const ms = Date.now() - sentenceStartedAtRef.current;
      setSentenceElapsedMs(ms);
      if (ms >= thisMaxMs) sentenceStopRef.current();
    }, 200);
    setSentencePhase("recording");
  }

  async function stopSentenceRecording() {
    const recorder = sentenceRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    setSentencePhase("processing");
    if (sentenceTickRef.current != null) window.clearInterval(sentenceTickRef.current);
    sentenceTickRef.current = null;

    const idx = activeRecordingIdxRef.current;
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    const heard = (await sentenceSpeechRef.current?.stop()) ?? { text: "", segments: [] };
    sentenceSpeechRef.current = null;
    await stopped;
    releaseSentenceMic();

    const blob = new Blob(sentenceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    const prevUrl = sentenceUrlsRef.current.get(idx);
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    sentenceUrlsRef.current.set(idx, url);

    const lineText = lines[idx]?.text ?? "";
    const bestRecognized = (pickClosestAlternatives(lineText, heard.segments) ?? heard.text).trim();

    let grade: ShadowingGrade;
    try {
      grade = gradeShadowing(lineText, bestRecognized);
    } catch {
      grade = {
        score: 0,
        wer: 1,
        totalWords: 1,
        correctCount: 0,
        substitutionCount: 0,
        deletionCount: 1,
        insertionCount: 0,
        normalizedText: "",
        wordResults: [],
        errorSummary: { missing: [lineText], incorrect: [], extra: [] },
      };
    }

    const sentenceRes: SentenceResult = {
      score: grade.score,
      wer: grade.wer,
      totalWords: grade.totalWords,
      correctCount: grade.correctCount,
      substitutionCount: grade.substitutionCount,
      deletionCount: grade.deletionCount,
      insertionCount: grade.insertionCount,
      recognizedText: bestRecognized,
      wordResults: grade.wordResults,
      recordingUrl: url,
    };

    setSentenceResults((prev) => {
      const next = new Map(prev);
      next.set(idx, sentenceRes);
      return next;
    });

    try {
      const storageKey = `wewin_shadowing_progress_${exercise.slug}`;
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      parsed[idx] = grade.score;
      localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      /* ignore storage access restrictions */
    }

    setSentenceLiveText("");
    setSentencePhase("idle");

    // Auto-shadow advance: after 1200ms delay, go to next sentence and play
    if (autoShadowRef.current) {
      clearAutoTimer();
      autoTimerRef.current = window.setTimeout(() => {
        if (!autoShadowRef.current) return;
        if (idx < lines.length - 1) {
          const nextIdx = idx + 1;
          playbackRef.current?.goTo(nextIdx);
          playbackRef.current?.replay();
        } else {
          setAutoShadow(false);
        }
      }, 1200);
    }
  }

  const startSentenceRecordingRef = useRef(startSentenceRecording);
  startSentenceRecordingRef.current = startSentenceRecording;
  const stopSentenceRecordingRef = useRef(stopSentenceRecording);
  stopSentenceRecordingRef.current = stopSentenceRecording;
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;
  const stopRecordingRef = useRef(stopRecording);
  stopRecordingRef.current = stopRecording;

  sentenceStopRef.current = () => void stopSentenceRecording();

  const handleSentenceEnd = useCallback((endedIdx: number) => {
    if (!autoShadowRef.current) return;
    clearAutoTimer();
    autoTimerRef.current = window.setTimeout(() => {
      if (autoShadowRef.current) {
        void startSentenceRecordingRef.current(endedIdx);
      }
    }, 250);
  }, [clearAutoTimer]);

  const toggleAutoShadow = () => {
    if (autoShadow) {
      setAutoShadow(false);
      clearAutoTimer();
      if (sentencePhase === "recording") {
        void stopSentenceRecording();
      }
    } else {
      setAutoShadow(true);
      if (sentencePhase === "idle") {
        playbackRef.current?.replay();
      }
    }
  };

  const handleSentenceRecordToggle = useCallback(() => {
    if (sentencePhase === "recording") {
      void stopSentenceRecordingRef.current();
    } else if (sentencePhase === "idle") {
      void startSentenceRecordingRef.current();
    }
  }, [sentencePhase]);

  const handleFullRecordToggle = useCallback(() => {
    if (phase === "recording") {
      void stopRecordingRef.current();
    } else if (phase === "idle" || phase === "recorded") {
      void startRecordingRef.current();
    }
  }, [phase]);

  // Combined statuses
  const fullRecordingActive = phase === "recording";
  const sentenceRecordingActive = sentencePhase === "recording";
  const recordingActive = mode === "sentence" ? sentenceRecordingActive : fullRecordingActive;

  const fullBusy = phase === "starting" || phase === "processing" || phase === "submitting";
  const sentenceBusy = sentencePhase === "starting" || sentencePhase === "processing";
  const busy = mode === "sentence" ? sentenceBusy : fullBusy;

  const currentLine = lines[currentIndex];
  const currentCue = exercise.cues?.[currentIndex];
  const currentAnnotation = exercise.annotations?.[currentIndex];
  const currentSentenceRes = sentenceResults.get(currentIndex);

  const activeCueWords = useMemo(() => {
    if (currentCue?.words && currentCue.words.length > 0) {
      return currentCue.words;
    }
    if (currentLine && currentCue) {
      return estimateWordTimings(currentLine.text, currentCue.start, currentCue.end);
    }
    return undefined;
  }, [currentCue, currentLine]);

  return (
    <div className="w-full min-w-0 space-y-4 pb-24 xl:pb-0">
      {/* Main 2-Column Responsive Practice Deck */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        {/* Left Column (Col 1-7): Audio/Video Player + Mode Toggle + Studio */}
        <div className="space-y-4 xl:col-span-7">
          {/* 1. Model Audio/Video Player */}
          <ShadowingAudioPlayer
            src={exercise.audioUrl}
            videoSrc={exercise.videoUrl}
            caption={caption || currentLine?.text}
            captionWords={currentCue?.words ?? activeCueWords}
            title={exercise.videoUrl ? t("sampleVideo", "Video mẫu") : t("sampleAudio", "Audio mẫu")}
            badge={exercise.level ? t("level", { level: exercise.level }, `Trình độ ${exercise.level}`) : undefined}
            audioRef={sampleRef}
            onPlayChange={setSamplePlaying}
          />

          {/* 2. Practice Mode Segmented Control */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 text-xs font-bold text-slate-600 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (fullRecordingActive) void stopRecording();
                  setMode("sentence");
                }}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 transition-all ${
                  mode === "sentence"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                {t("modeSentence", "Luyện từng câu")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sentenceRecordingActive) void stopSentenceRecording();
                  if (autoShadow) setAutoShadow(false);
                  setMode("full");
                }}
                className={`min-h-9 rounded-lg px-3.5 py-1.5 transition-all ${
                  mode === "full"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                {t("modeFull", "Đọc cả bài")}
              </button>
            </div>

            {/* Quick Auto-shadow pill in sentence mode */}
            {mode === "sentence" ? (
              <button
                type="button"
                onClick={toggleAutoShadow}
                title={t("autoShadowHint", "Tự động phát câu, ghi âm và chuyển sang câu tiếp theo")}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-2xs ${
                  autoShadow
                    ? "border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-400/40"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Sparkles className={`h-3.5 w-3.5 ${autoShadow ? "text-amber-500 animate-spin" : "text-amber-500"}`} />
                <span>{t("autoShadow", "Shadow tự động")}</span>
              </button>
            ) : null}
          </div>

          {/* 3. Mode Content: Sentence Studio OR Full Passage Studio */}
          {mode === "sentence" ? (
            /* =========================================================================
             * SENTENCE STUDIO
             * ========================================================================= */
            <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
              {/* Studio Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      sentenceRecordingActive
                        ? "bg-rose-100 text-rose-600"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <Mic className={`h-4.5 w-4.5 ${sentenceRecordingActive ? "animate-pulse" : ""}`} />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
                      {sentenceRecordingActive
                        ? t("recordingActiveTitle", "Đang thu âm giọng đọc")
                        : t("recordSentence", "Ghi âm câu này")}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    {t(
                      "sentenceCounter",
                      { n: currentIndex + 1, total: lines.length },
                      `Câu ${currentIndex + 1} / ${lines.length}`,
                    )}
                  </span>
                </div>
              </div>

              {/* Active Sentence Card */}
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">
                    {String(currentIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    {currentLine?.speaker ? (
                      <span className="mr-1.5 inline-block rounded bg-wewin-navy/10 px-1.5 py-0.5 text-xs font-bold text-wewin-navy">
                        {currentLine.speaker}:
                      </span>
                    ) : null}
                    <div className="text-base sm:text-lg font-semibold leading-relaxed">
                      <KaraokeLine
                        text={currentLine?.text ?? ""}
                        words={activeCueWords}
                        audioRef={sampleRef}
                        isPlaying={samplePlaying}
                        variant="hero"
                        className="text-slate-900"
                        onWordClick={(timeSec) => {
                          if (sampleRef.current) {
                            sampleRef.current.currentTime = timeSec;
                            if (sampleRef.current.paused) {
                              void sampleRef.current.play();
                            }
                          }
                        }}
                      />
                    </div>
                    {currentAnnotation?.ipa ? (
                      <p className="font-mono text-xs sm:text-[13px] text-slate-500">
                        {currentAnnotation.ipa}
                      </p>
                    ) : null}
                    {currentAnnotation?.translation ? (
                      <p className="text-xs sm:text-sm italic text-slate-600">
                        {currentAnnotation.translation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Supported Check */}
              {supported === false ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <p className="font-semibold">{t("errors.unsupported", "Trình duyệt chưa hỗ trợ ghi âm")}</p>
                  <p className="mt-1 text-slate-500">
                    Chrome, Edge or Safari desktop recommended.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {/* SENTENCE RECORDING ACTIVE STATE */}
                  {sentenceRecordingActive || sentencePhase === "processing" ? (
                    <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/30 p-5">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        {/* Stop Button */}
                        <button
                          type="button"
                          onClick={() => void stopSentenceRecording()}
                          disabled={sentencePhase === "processing"}
                          aria-label={t("stopSentence", "Dừng ghi âm")}
                          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-transform hover:bg-rose-700 active:scale-95"
                        >
                          {sentencePhase === "processing" ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                          ) : (
                            <Square className="h-6 w-6 fill-current" />
                          )}
                        </button>

                        {/* Digital Timer */}
                        <div>
                          <div className="font-mono text-2xl font-black tabular-nums text-slate-900">
                            {formatClock(sentenceElapsedMs / 1000)}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              / {formatClock(sentenceMaxMs / 1000)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-rose-600">
                            {sentencePhase === "processing"
                              ? t("processingAudio", "Đang xử lý âm thanh…")
                              : t("recordingHint", "Đang ghi âm... Bấm nút đỏ để hoàn thành")}
                          </p>
                        </div>

                        {/* Sound Wave Animation */}
                        <div className="flex h-7 items-center justify-center gap-1.5">
                          {[0.4, 0.8, 0.5, 1.0, 0.7, 0.9, 0.3, 0.95, 0.6, 0.4].map((ratio, i) => (
                            <span
                              key={i}
                              className="animate-soundwave w-1 rounded-full bg-rose-500"
                              style={{
                                animationDelay: `${(i % 5) * 0.18}s`,
                                height: `${Math.round(ratio * 22)}px`,
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Live Speech Recognition Box */}
                      {sentenceLiveText ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            {t("liveListening", "🎙️ Hệ thống đang nghe bạn đọc:")}
                          </p>
                          <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800">
                            {sentenceLiveText}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : currentSentenceRes ? (
                    /* SENTENCE EVALUATED RESULT */
                    <div className="space-y-3.5">
                      {/* Score Summary Banner */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-extrabold tabular-nums border ${
                              currentSentenceRes.score >= 80
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : currentSentenceRes.score >= 60
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {currentSentenceRes.score}%
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-700">
                            {currentSentenceRes.score >= 80
                              ? t("scoreExcellent", "Rất tốt!")
                              : currentSentenceRes.score >= 60
                                ? t("scoreGood", "Khá tốt!")
                                : t("scoreNeedsPractice", "Cần luyện thêm")}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {t(
                            "wordsCount",
                            { n: currentSentenceRes.totalWords },
                            `${currentSentenceRes.totalWords} từ`,
                          )}
                        </span>
                      </div>

                      {/* Aligned Words */}
                      {currentSentenceRes.wordResults && currentSentenceRes.wordResults.length > 0 ? (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                          <AlignedTranscript
                            wordResults={currentSentenceRes.wordResults}
                            title={t("transcriptTitle", "Đối chiếu câu đọc")}
                            actualLabel={(w) => t("heardAs", { word: w }, `Hệ thống nghe: ${w}`)}
                          />
                        </div>
                      ) : null}

                      {/* User's Audio Playback */}
                      {currentSentenceRes.recordingUrl ? (
                        <UserAudioPlayer
                          src={currentSentenceRes.recordingUrl}
                          label={t("yourRecording", "Nghe lại giọng bạn")}
                        />
                      ) : null}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => void startSentenceRecording()}
                          disabled={sentenceBusy || supported !== true}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>{t("reRecord", "Ghi âm lại")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => playbackRef.current?.replay()}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>{t("replaySentence", "Nghe câu mẫu")}</span>
                        </button>

                        {currentIndex < lines.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => playbackRef.current?.goTo(currentIndex + 1)}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-wewin-navy px-5 py-2 text-sm font-bold text-white shadow-2xs transition-all hover:bg-wewin-navy-hover active:scale-95 sm:flex-initial"
                          >
                            <span>{t("nextSentence", "Câu tiếp theo")}</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    /* HERO RECORD CTA (Sentence idle, not evaluated yet) */
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                      <div className="relative mb-3">
                        <button
                          type="button"
                          onClick={() => void startSentenceRecording()}
                          disabled={sentenceBusy || supported !== true}
                          aria-label={t("recordSentence", "Ghi âm câu này")}
                          className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-wewin-navy via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 hover:shadow-indigo-600/40 active:scale-95 disabled:opacity-50"
                        >
                          {sentenceBusy ? (
                            <Loader2 className="h-7 w-7 animate-spin" />
                          ) : (
                            <Mic className="h-7 w-7 transition-transform group-hover:scale-110" />
                          )}
                        </button>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        {t("tapToSpeak", "Bấm micro để bắt đầu nói")}
                      </h3>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Headphones className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{t("headphoneTip", "Nên đeo tai nghe để tránh tiếng loa lọt vào micro.")}</span>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {error ? (
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <div className="flex-1">
                        <span>{error}</span>{" "}
                        {needsLogin ? (
                          <Link
                            href={`/login?next=${encodeURIComponent(learnShadowingHref(exercise.slug))}`}
                            className="font-bold underline hover:text-rose-950"
                          >
                            {t("signIn", "Đăng nhập ngay")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>
          ) : (
            /* =========================================================================
             * FULL PASSAGE STUDIO
             * ========================================================================= */
            result ? (
              <ShadowingResult
                result={result}
                sampleAudioUrl={exercise.audioUrl}
                onRetry={retry}
              />
            ) : (
              <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md">
                {/* Studio Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        fullRecordingActive ? "bg-rose-100 text-rose-600" : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <Mic className={`h-4.5 w-4.5 ${fullRecordingActive ? "animate-pulse" : ""}`} />
                    </span>
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
                      {fullRecordingActive
                        ? t("recordingActiveTitle", "Đang thu âm giọng đọc")
                        : t("recordingStudio", "Ghi âm giọng đọc")}
                    </h2>
                  </div>

                  <div>
                    {fullRecordingActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                        {t("recordingBadge", "Đang thu...")}
                      </span>
                    ) : phase === "recorded" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        {t("recordedBadge", "Đã ghi âm xong")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        {t(
                          "maxTime",
                          { time: formatClock(exercise.maxRecordSeconds) },
                          `Tối đa ${formatClock(exercise.maxRecordSeconds)}`,
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Supported Check */}
                {supported === false ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                    <p className="font-semibold">{t("errors.unsupported", "Trình duyệt chưa hỗ trợ ghi âm")}</p>
                    <p className="mt-1 text-slate-500">
                      Chrome, Edge or Safari desktop recommended.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {/* IDLE / STARTING STATE - Hero Action CTA */}
                    {phase === "idle" || phase === "starting" ? (
                      <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                        <div className="relative mb-3">
                          <button
                            type="button"
                            onClick={() => void startRecording()}
                            disabled={fullBusy || supported !== true}
                            aria-label={t("tapToSpeak", "Bấm để ghi âm")}
                            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-wewin-navy via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 hover:shadow-indigo-600/40 active:scale-95 disabled:opacity-50"
                          >
                            {fullBusy ? (
                              <Loader2 className="h-7 w-7 animate-spin" />
                            ) : (
                              <Mic className="h-7 w-7 transition-transform group-hover:scale-110" />
                            )}
                          </button>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-800">
                          {t("tapToSpeak", "Bấm micro để bắt đầu nói")}
                        </h3>
                      </div>
                    ) : null}

                    {/* RECORDING ACTIVE STATE */}
                    {fullRecordingActive || phase === "processing" ? (
                      <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/30 p-5">
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <button
                            type="button"
                            onClick={() => void stopRecording()}
                            disabled={phase === "processing"}
                            aria-label={t("stop", "Dừng ghi âm")}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-transform hover:bg-rose-700 active:scale-95"
                          >
                            {phase === "processing" ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Square className="h-6 w-6 fill-current" />
                            )}
                          </button>

                          <div>
                            <div className="font-mono text-2xl font-black tabular-nums text-slate-900">
                              {formatClock(elapsedMs / 1000)}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                / {formatClock(exercise.maxRecordSeconds)}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs sm:text-sm font-semibold text-rose-600">
                              {phase === "processing"
                                ? t("processingAudio", "Đang xử lý âm thanh…")
                                : t("recordingHint", "Đang ghi âm... Bấm nút đỏ để hoàn thành")}
                            </p>
                          </div>

                          <div className="flex h-7 items-center justify-center gap-1.5">
                            {[0.4, 0.8, 0.5, 1.0, 0.7, 0.9, 0.3, 0.95, 0.6, 0.4].map((ratio, i) => (
                              <span
                                key={i}
                                className="animate-soundwave w-1 rounded-full bg-rose-500"
                                style={{
                                  animationDelay: `${(i % 5) * 0.18}s`,
                                  height: `${Math.round(ratio * 22)}px`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {liveText ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              {t("liveListening", "🎙️ Hệ thống đang nghe bạn đọc:")}
                            </p>
                            <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-800">
                              {liveText}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* RECORDED / SUBMITTING STATE */}
                    {phase === "recorded" || phase === "submitting" ? (
                      <div className="space-y-4">
                        {recording ? (
                          <div className="space-y-1.5">
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                              {t("yourRecording", "Nghe lại bản ghi của bạn")}
                            </h3>
                            <UserAudioPlayer
                              src={recording.url}
                              label={t("yourRecording", "Giọng đọc của bạn")}
                              className="border-emerald-200/90 bg-emerald-50/40"
                            />
                          </div>
                        ) : null}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                              {t("recognizedTitle", "Văn bản hệ thống nghe được")}
                            </h3>
                            {recognized && (
                              <span className="text-xs text-slate-500">
                                {t(
                                  "wordsCount",
                                  { n: recognized.split(/\s+/).filter(Boolean).length },
                                  `${recognized.split(/\s+/).filter(Boolean).length} từ`,
                                )}
                              </span>
                            )}
                          </div>

                          {recognized ? (
                            <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 text-sm sm:text-base leading-relaxed text-slate-800">
                              {recognized}
                            </p>
                          ) : (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs sm:text-sm text-amber-900">
                              <p className="font-semibold">Chưa phát hiện giọng nói rõ ràng</p>
                              <p className="mt-0.5">
                                {t(
                                  "errors.NO_SPEECH",
                                  "Chưa thể đánh giá vì hệ thống không nghe được gì. Vui lòng bấm 'Ghi lại' và nói gần micro hơn.",
                                )}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={resetRecording}
                            disabled={phase === "submitting"}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:text-base font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>{t("reRecord", "Ghi âm lại")}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void submit()}
                            disabled={phase === "submitting" || !recognized}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wewin-navy to-indigo-700 px-6 py-2.5 text-sm sm:text-base font-bold text-white shadow-md shadow-indigo-700/20 transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 sm:flex-initial"
                          >
                            {phase === "submitting" ? (
                              <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-4.5 w-4.5 text-amber-300" />
                            )}
                            <span>
                              {phase === "submitting"
                                ? t("submittingAI", "Đang chấm điểm AI…")
                                : t("submitAI", "Nộp bài & Xem điểm AI")}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {/* Error Notification */}
                    {error ? (
                      <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                        <div className="flex-1">
                          <span>{error}</span>{" "}
                          {needsLogin ? (
                            <Link
                              href={`/login?next=${encodeURIComponent(learnShadowingHref(exercise.slug))}`}
                              className="font-bold underline hover:text-rose-950"
                            >
                              {t("signIn", "Đăng nhập ngay")}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            )
          )}
        </div>

        {/* Right Column (Col 8-12): Sticky Transcript Console */}
        <div className="xl:sticky xl:top-20 xl:col-span-5">
          <ShadowingTranscript
            transcript={exercise.transcript}
            timings={exercise.cues}
            annotations={exercise.annotations}
            sentenceResults={sentenceResults}
            audioRef={sampleRef}
            playbackRef={playbackRef}
            disabled={recordingActive || busy}
            onRecord={mode === "sentence" ? handleSentenceRecordToggle : result ? undefined : handleFullRecordToggle}
            recordDisabled={busy || supported !== true || (mode === "sentence" ? sentencePhase !== "idle" && sentencePhase !== "recording" : phase !== "idle" && phase !== "recorded" && phase !== "recording")}
            isRecording={recordingActive}
            onSentenceChange={setCaption}
            onSentenceIndexChange={setCurrentIndex}
            onSentenceEnd={handleSentenceEnd}
          />
        </div>

        {/* Bottom Full-Width Section: Practice History */}
        <div className="xl:col-span-12 pt-2">
          <ShadowingHistory
            slug={exercise.slug}
            sampleAudioUrl={exercise.audioUrl}
            refreshKey={historyKey}
          />
        </div>
      </div>
    </div>
  );
}
