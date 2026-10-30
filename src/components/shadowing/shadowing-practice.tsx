"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Clock,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { learnShadowingHref } from "@/lib/learn/hrefs";
import { formatClock } from "@/lib/dictation/format";
import { activeSpeechProvider, type SpeechErrorCode, type SpeechSession } from "@/lib/shadowing/stt/client";
import type { PublicShadowingExercise, ShadowingAttemptResult } from "@/lib/shadowing/types";
import { useTranslations } from "@/i18n/provider";
import { ShadowingResult } from "@/components/shadowing/shadowing-result";
import { ShadowingHistory } from "@/components/shadowing/shadowing-history";
import { ShadowingTranscript } from "@/components/shadowing/shadowing-transcript";
import { ShadowingAudioPlayer, UserAudioPlayer } from "@/components/shadowing/shadowing-audio-player";

type Phase = "idle" | "starting" | "recording" | "processing" | "recorded" | "submitting";

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

  const sampleRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRef = useRef<SpeechSession | null>(null);
  const segmentsRef = useRef<string[][]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const recordingUrlRef = useRef<string | null>(null);
  const stopRef = useRef<() => void>(() => {});

  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [recognized, setRecognized] = useState("");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [result, setResult] = useState<ShadowingAttemptResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    setSupported(
      provider.isSupported() &&
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined",
    );
  }, [provider]);

  const releaseMic = useCallback(() => {
    if (tickRef.current != null) window.clearInterval(tickRef.current);
    tickRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const replaceRecordingUrl = useCallback((url: string | null) => {
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = url;
  }, []);

  useEffect(
    () => () => {
      speechRef.current?.abort();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseMic();
      replaceRecordingUrl(null);
    },
    [releaseMic, replaceRecordingUrl],
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
    streamRef.current = stream;

    const mime = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      releaseMic();
      setError(t("errors.unsupported", "Trình duyệt này chưa hỗ trợ nhận diện giọng nói."));
      setPhase("idle");
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorderRef.current = recorder;
    recorder.start(250);

    speechRef.current = provider.start({
      lang: RECOGNITION_LANG,
      onText: setLiveText,
      onError: (code) => {
        setError(speechErrorMessage(code));
        if (code !== "other") stopRef.current();
      },
    });

    startedAtRef.current = Date.now();
    setElapsedMs(0);
    tickRef.current = window.setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsedMs(ms);
      if (ms >= maxMs) stopRef.current();
    }, 200);
    setPhase("recording");
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    setPhase("processing");
    if (tickRef.current != null) window.clearInterval(tickRef.current);
    tickRef.current = null;
    const durationMs = Math.min(maxMs, Date.now() - startedAtRef.current);

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    const heard = (await speechRef.current?.stop()) ?? { text: "", segments: [] };
    const text = heard.text;
    segmentsRef.current = heard.segments;
    speechRef.current = null;
    await stopped;
    releaseMic();

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    const url = URL.createObjectURL(blob);
    replaceRecordingUrl(url);
    setRecording({ blob, url, durationMs });
    setRecognized(text.trim());
    setLiveText("");
    setPhase("recorded");
  }

  stopRef.current = () => void stopRecording();

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
      form.append("alternatives", JSON.stringify(segmentsRef.current));
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

  const recordingActive = phase === "recording";
  const busy = phase === "starting" || phase === "processing" || phase === "submitting";
  const progressRatio = Math.min(1, elapsedMs / maxMs);

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Main 2-Column Responsive Practice Deck */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        {/* Left Column (Col 1-7): Audio Player + Voice Recording Studio / Result */}
        <div className="space-y-4 xl:col-span-7">
          {/* 1. Model Audio Player */}
          <ShadowingAudioPlayer
            src={exercise.audioUrl}
            title={t("sampleAudio", "Audio mẫu")}
            badge={exercise.level ? t("level", { level: exercise.level }, `Trình độ ${exercise.level}`) : undefined}
            audioRef={sampleRef}
          />

          {/* 2. Result or Recording Studio */}
          {result ? (
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
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    recordingActive ? "bg-rose-100 text-rose-600" : "bg-purple-100 text-purple-700"
                  }`}>
                    <Mic className={`h-4.5 w-4.5 ${recordingActive ? "animate-pulse" : ""}`} />
                  </span>
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
                    {recordingActive ? t("recordingActiveTitle", "Đang thu âm giọng đọc") : t("recordingStudio", "Ghi âm giọng đọc")}
                  </h2>
                </div>

                {/* State Badge */}
                <div>
                  {recordingActive ? (
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
                      {t("maxTime", { time: formatClock(exercise.maxRecordSeconds) }, `Tối đa ${formatClock(exercise.maxRecordSeconds)}`)}
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
                      {/* Pulse Circle Button */}
                      <div className="relative mb-3">
                        <button
                          type="button"
                          onClick={() => void startRecording()}
                          disabled={busy || supported !== true}
                          aria-label={t("tapToSpeak", "Bấm để ghi âm")}
                          className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-wewin-navy via-indigo-700 to-purple-600 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 hover:shadow-indigo-600/40 active:scale-95 disabled:opacity-50"
                        >
                          {busy ? (
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
                  {recordingActive || phase === "processing" ? (
                    <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/30 p-5">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        {/* Stop Button */}
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

                        {/* Digital Timer */}
                        <div>
                          <div className="font-mono text-2xl font-black tabular-nums text-slate-900">
                            {formatClock(elapsedMs / 1000)}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              / {formatClock(exercise.maxRecordSeconds)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-rose-600">
                            {phase === "processing" ? t("processingAudio", "Đang xử lý âm thanh…") : t("recordingHint", "Đang ghi âm... Bấm nút đỏ để hoàn thành")}
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
                      {/* User's Audio Playback */}
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

                      {/* Recognized Text Display */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                            {t("recognizedTitle", "Văn bản hệ thống nghe được")}
                          </h3>
                          {recognized && (
                            <span className="text-xs text-slate-500">
                              {t("wordsCount", { n: recognized.split(/\s+/).filter(Boolean).length }, `${recognized.split(/\s+/).filter(Boolean).length} từ`)}
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

                      {/* Actions: Re-record or Submit */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={resetRecording}
                          disabled={phase === "submitting"}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:text-base font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                        >
                          <RotateCcw className="h-4.5 w-4.5" />
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
          )}
        </div>

        {/* Right Column (Col 8-12): Sticky Transcript Console */}
        <div className="xl:sticky xl:top-20 xl:col-span-5">
          <ShadowingTranscript
            transcript={exercise.transcript}
            timings={exercise.cues}
            audioRef={sampleRef}
            disabled={recordingActive || phase === "processing" || phase === "submitting"}
            onRecord={result ? undefined : () => void startRecording()}
            recordDisabled={busy || supported !== true || (phase !== "idle" && phase !== "recorded")}
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
