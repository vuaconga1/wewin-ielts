"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FlaskConical, Loader2, Mic, RotateCcw, Send, Square } from "lucide-react";
import { learnShadowingHref } from "@/lib/learn/hrefs";
import { formatClock } from "@/lib/dictation/format";
import { activeSpeechProvider, type SpeechErrorCode, type SpeechSession } from "@/lib/shadowing/stt/client";
import type { PublicShadowingExercise, ShadowingAttemptResult } from "@/lib/shadowing/types";
import { useTranslations } from "@/i18n/provider";
import { ShadowingResult } from "@/components/shadowing/shadowing-result";
import { ShadowingHistory } from "@/components/shadowing/shadowing-history";

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
    const text = (await speechRef.current?.stop()) ?? "";
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

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
      <header className="min-w-0">
        <Link href={learnShadowingHref()} className="text-sm font-medium text-wewin-navy hover:underline">
          {t("backCatalog", "← Tất cả bài Shadowing")}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 break-words text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            {exercise.title}
          </h1>
          {exercise.level ? (
            <span className="shrink-0 rounded-full bg-wewin-accent-blue-bg px-2.5 py-0.5 text-xs font-bold text-wewin-navy">
              {exercise.level}
            </span>
          ) : null}
        </div>
        <p className="mt-1 break-words text-sm text-zinc-600">
          {exercise.instructions ||
            t("defaultInstructions", "Nghe câu mẫu, sau đó ghi âm và đọc lại thật giống.")}
        </p>
      </header>

      <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {t(
            "testNotice",
            "Bản thử nghiệm: nhận diện giọng nói đang dùng công nghệ có sẵn của trình duyệt (nên dùng Chrome hoặc Edge). Kết quả chỉ mang tính tham khảo.",
          )}
        </span>
      </p>

      <section className="card-outline space-y-2 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">{t("sampleAudio", "Audio mẫu")}</h2>
        <audio ref={sampleRef} src={exercise.audioUrl} controls preload="metadata" className="w-full" />
      </section>

      {result ? (
        <ShadowingResult result={result} sampleAudioUrl={exercise.audioUrl} onRetry={retry} />
      ) : (
        <section className="card-outline space-y-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-zinc-900">{t("recordTitle", "Ghi âm giọng đọc của bạn")}</h2>

          {supported === false ? (
            <p className="text-sm text-rose-600" role="alert">
              {t(
                "errors.unsupported",
                "Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.",
              )}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => (recordingActive ? void stopRecording() : void startRecording())}
                disabled={busy || supported !== true || phase === "recorded"}
                aria-label={recordingActive ? t("stop", "Dừng") : t("record", "Ghi âm")}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50 ${
                  recordingActive ? "bg-rose-600 hover:bg-rose-700" : "bg-wewin-navy hover:bg-wewin-navy-hover"
                }`}
              >
                {busy ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : recordingActive ? (
                  <Square className="h-5 w-5 fill-current" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-zinc-900">
                  {recordingActive
                    ? t("recording", "Đang ghi âm… bấm để dừng")
                    : phase === "processing"
                      ? t("processing", "Đang xử lý…")
                      : phase === "recorded"
                        ? t("recorded", "Đã ghi âm xong")
                        : t("tapToRecord", "Bấm micro để bắt đầu ghi âm")}
                </p>
                <p className="tabular-nums text-zinc-500">
                  {formatClock(elapsedMs / 1000)} / {formatClock(exercise.maxRecordSeconds)}
                </p>
              </div>
            </div>
          )}

          {recordingActive ? (
            <p className="min-h-12 whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
              {liveText || t("listening", "Đang nghe…")}
            </p>
          ) : null}

          {phase === "recorded" || phase === "submitting" ? (
            <div className="space-y-3">
              {recording ? (
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-zinc-900">{t("yourRecording", "Bản ghi của bạn")}</h3>
                  <audio src={recording.url} controls className="w-full" />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-900">{t("recognizedTitle", "Hệ thống nghe được")}</h3>
                {recognized ? (
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
                    {recognized}
                  </p>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    {t("errors.NO_SPEECH", "Chưa thể đánh giá vì hệ thống không nghe được gì. Vui lòng ghi âm lại.")}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetRecording}
                  disabled={phase === "submitting"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("reRecord", "Ghi lại")}
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={phase === "submitting" || !recognized}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-navy-hover disabled:opacity-60"
                >
                  {phase === "submitting" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {phase === "submitting" ? t("submitting", "Đang chấm…") : t("submit", "Nộp bài")}
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}{" "}
              {needsLogin ? (
                <Link
                  href={`/login?next=${encodeURIComponent(learnShadowingHref(exercise.slug))}`}
                  className="font-medium text-wewin-navy underline"
                >
                  {t("signIn", "Đăng nhập")}
                </Link>
              ) : null}
            </p>
          ) : null}
        </section>
      )}

      <ShadowingHistory slug={exercise.slug} sampleAudioUrl={exercise.audioUrl} refreshKey={historyKey} />
    </div>
  );
}
