"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "@/i18n/provider";

type MicStatus = "idle" | "requesting" | "ready" | "error";
type TestPhase = "idle" | "recording" | "playback";

type Props = {
  attemptId: string;
  /** First speaking part label, e.g. "Part 1" — used on the start CTA. */
  startPartLabel?: string;
  onReady: () => void;
};

const AUDIO_CONSTRAINTS: MediaStreamConstraints[] = [
  { audio: true },
  {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function mediaErrorName(err: unknown): string {
  if (err && typeof err === "object" && "name" in err) {
    return String((err as { name: string }).name);
  }
  return "";
}

function mediaErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message ?? "").trim();
    if (msg) return msg;
  }
  if (typeof err === "string" && err.trim()) return err.trim();
  return "";
}

function isTransientMicError(name: string): boolean {
  return (
    name === "AbortError" ||
    name === "NotReadableError" ||
    name === "TrackStartError"
  );
}

/** Document-level Permissions-Policy / Feature-Policy denial (not user gesture deny). */
export function isMicBlockedByPermissionsPolicy(err?: unknown): boolean {
  if (typeof document !== "undefined") {
    const doc = document as Document & {
      permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
      featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    };
    const policy = doc.permissionsPolicy ?? doc.featurePolicy;
    if (
      typeof policy?.allowsFeature === "function" &&
      !policy.allowsFeature("microphone")
    ) {
      return true;
    }
  }

  if (err == null) return false;
  const name = mediaErrorName(err);
  const detail = mediaErrorMessage(err).toLowerCase();
  if (
    detail.includes("permissions policy") ||
    detail.includes("permission policy") ||
    detail.includes("feature policy") ||
    detail.includes("feature is disabled")
  ) {
    return true;
  }
  // Chrome often surfaces policy blocks as SecurityError / NotAllowedError
  // with an empty or generic message — pair with document policy check above.
  if (
    (name === "SecurityError" || name === "NotAllowedError") &&
    typeof document !== "undefined"
  ) {
    const doc = document as Document & {
      permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
      featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    };
    const policy = doc.permissionsPolicy ?? doc.featurePolicy;
    if (
      typeof policy?.allowsFeature === "function" &&
      !policy.allowsFeature("microphone")
    ) {
      return true;
    }
  }
  return false;
}

export function speakingMicStorageKey(attemptId: string) {
  return `wewin-speaking-mic:${attemptId}`;
}

/** ISO timestamp when the Speaking exam clock starts (after "Start Part 1"). */
export function speakingClockStorageKey(attemptId: string) {
  return `wewin-speaking-clock:${attemptId}`;
}

export function SpeakingMicSetup({
  attemptId,
  startPartLabel,
  onReady,
}: Props) {
  const { t } = useTranslations("practice");

  const [status, setStatus] = useState<MicStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [testPhase, setTestPhase] = useState<TestPhase>("idle");
  const [testUrl, setTestUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const testUrlRef = useRef<string | null>(null);
  /** Bumps on every request / unmount so stale getUserMedia results are ignored. */
  const requestGenRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True while a user- or boot-initiated acquire is in flight (survives Strict Mode timing). */
  const acquiringRef = useRef(false);
  /** True only for explicit "Retry microphone" clicks — cleanup must not abort mid-flight. */
  const userRetryRef = useRef(false);
  const mountedRef = useRef(true);

  const stopMeter = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  const releaseStream = useCallback(() => {
    stopMeter();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }, [stopMeter]);

  const revokeTestUrl = useCallback(() => {
    if (testUrlRef.current) {
      try {
        URL.revokeObjectURL(testUrlRef.current);
      } catch {
        /* ignore */
      }
      testUrlRef.current = null;
      setTestUrl(null);
    }
  }, []);

  const startMeter = useCallback(
    (stream: MediaStream) => {
      stopMeter();
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        void ctx.resume().catch(() => undefined);
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          const a = analyserRef.current;
          if (!a) return;
          a.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i]!;
          const avg = sum / data.length / 255;
          setLevel(Math.min(1, avg * 2.2));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        /* meter optional */
      }
    },
    [stopMeter],
  );

  const classifyMicError = useCallback(
    (err: unknown): string => {
      if (isMicBlockedByPermissionsPolicy(err)) {
        return t(
          "speakingMicPolicyBlocked",
          "This page blocked the microphone via Permissions-Policy. That restriction is fixed — hard-refresh (Ctrl+Shift+R), then try again.",
        );
      }

      const name = mediaErrorName(err);
      const detail = mediaErrorMessage(err);

      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        return t(
          "speakingMicNoDevice",
          "No microphone found. Plug in a mic and try again.",
        );
      }
      if (
        name === "NotAllowedError" ||
        name === "PermissionDeniedError" ||
        name === "SecurityError"
      ) {
        return t(
          "speakingMicDenied",
          "Microphone access denied. Allow the mic, then continue.",
        );
      }
      if (isTransientMicError(name)) {
        return t(
          "speakingMicBusy",
          "Microphone is busy or was interrupted. Wait a moment, then retry.",
        );
      }
      if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
        return t(
          "speakingMicConstraint",
          "Could not open the microphone with the requested settings. Try again.",
        );
      }
      const base = t(
        "speakingMicGeneric",
        "Could not open the microphone. Try again.",
      );
      return detail ? `${base} (${name || "Error"}: ${detail})` : `${base}${name ? ` (${name})` : ""}`;
    },
    [t],
  );

  const acquireStream = useCallback(async (): Promise<MediaStream> => {
    if (isMicBlockedByPermissionsPolicy()) {
      const err = new DOMException(
        "Permissions policy violation: microphone is not allowed in this document.",
        "NotAllowedError",
      );
      throw err;
    }

    let lastErr: unknown;
    for (const constraints of AUDIO_CONSTRAINTS) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
        const name = mediaErrorName(err);
        // Permission / missing device / policy won't succeed with different constraints.
        if (
          isMicBlockedByPermissionsPolicy(err) ||
          name === "NotAllowedError" ||
          name === "PermissionDeniedError" ||
          name === "SecurityError" ||
          name === "NotFoundError" ||
          name === "DevicesNotFoundError"
        ) {
          throw err;
        }
      }
    }
    throw lastErr;
  }, []);

  const requestMic = useCallback(
    async (opts?: { autoRetry?: boolean; fromUser?: boolean }) => {
      const autoRetry = opts?.autoRetry !== false;
      const fromUser = opts?.fromUser === true;

      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (fromUser) {
        userRetryRef.current = true;
      }

      const gen = ++requestGenRef.current;
      acquiringRef.current = true;
      setErrorMessage(null);
      setStatus("requesting");
      revokeTestUrl();
      setTestPhase("idle");

      // Stop any prior live stream before opening a new one (keep device free).
      // Do this after bumping gen so a concurrent cleanup cannot race the new request.
      releaseStream();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        if (gen !== requestGenRef.current) return;
        acquiringRef.current = false;
        userRetryRef.current = false;
        setStatus("error");
        setErrorMessage(
          t(
            "speakingMicUnsupported",
            "Recording is not supported in this browser.",
          ),
        );
        return;
      }

      // Never trust Permissions API alone — always attempt getUserMedia.
      // (Chrome can report prompt/denied inconsistently; query may throw.)

      try {
        const stream = await acquireStream();
        if (gen !== requestGenRef.current) {
          // Newer request superseded this one: discard immediately.
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        if (!mountedRef.current) {
          stream.getTracks().forEach((tr) => tr.stop());
          acquiringRef.current = false;
          return;
        }
        streamRef.current = stream;
        startMeter(stream);
        setStatus("ready");
        acquiringRef.current = false;
        userRetryRef.current = false;
      } catch (err) {
        if (gen !== requestGenRef.current) return;
        if (!mountedRef.current) {
          acquiringRef.current = false;
          return;
        }

        const name = mediaErrorName(err);
        if (autoRetry && isTransientMicError(name) && !isMicBlockedByPermissionsPolicy(err)) {
          // Device still releasing after Strict Mode stop, or overlapping request.
          setStatus("requesting");
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            if (gen !== requestGenRef.current) return;
            void requestMic({
              autoRetry: false,
              fromUser: userRetryRef.current,
            });
          }, 350);
          return;
        }

        acquiringRef.current = false;
        userRetryRef.current = false;
        setStatus("error");
        setErrorMessage(classifyMicError(err));
      }
    },
    [
      acquireStream,
      classifyMicError,
      releaseStream,
      revokeTestUrl,
      startMeter,
      t,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;
    void requestMic({ autoRetry: true });
    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current != null) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      // User-initiated retry in flight: do not bump gen / tear down mid-acquire.
      // Strict Mode remount will start a fresh request; abandoning a click-retry
      // mid-flight causes an instant AbortError/"cuts off" UX.
      if (userRetryRef.current && acquiringRef.current) {
        return;
      }

      requestGenRef.current += 1;
      acquiringRef.current = false;
      releaseStream();
      revokeTestUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTestRecord = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || status !== "ready") return;
    revokeTestUrl();
    chunksRef.current = [];
    try {
      const mime = pickMimeType();
      const rec = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blobType = rec.mimeType || "audio/webm";
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: blobType })
            : null;
        chunksRef.current = [];
        recorderRef.current = null;
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          testUrlRef.current = url;
          setTestUrl(url);
          setTestPhase("playback");
        } else {
          setTestPhase("idle");
        }
      };
      rec.start(100);
      setTestPhase("recording");
      // Cap test clip at ~4s
      window.setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state === "recording") {
          try {
            recorderRef.current.stop();
          } catch {
            setTestPhase("idle");
          }
        }
      }, 4000);
    } catch {
      setTestPhase("idle");
    }
  }, [revokeTestUrl, status]);

  const stopTestRecord = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try {
        recorderRef.current.stop();
      } catch {
        setTestPhase("idle");
      }
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (status !== "ready") return;
    try {
      sessionStorage.setItem(speakingMicStorageKey(attemptId), "1");
      // Start exam clock only when leaving mic setup — persist for refresh mid-exam
      if (!sessionStorage.getItem(speakingClockStorageKey(attemptId))) {
        sessionStorage.setItem(
          speakingClockStorageKey(attemptId),
          new Date().toISOString(),
        );
      }
    } catch {
      /* ignore */
    }
    // Release setup stream so SpeakingExamDesk can request mic cleanly
    releaseStream();
    revokeTestUrl();
    onReady();
  }, [attemptId, onReady, releaseStream, revokeTestUrl, status]);

  const startLabel = startPartLabel
    ? t(
        "speakingMicStartWithPart",
        { part: startPartLabel },
        "Start {part}",
      )
    : t("speakingMicStart", "Start speaking");

  const bars = 16;
  const activeBars = Math.round(level * bars);

  return (
    <div className="cdi-pane mx-auto flex w-full max-w-lg min-w-0 flex-col border border-zinc-400/70 bg-white shadow-sm">
      <div className="border-b border-zinc-300 bg-[#eceff2] px-3 py-2.5 sm:px-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {t("speakingMicSetupEyebrow", "Microphone check")}
        </p>
        <h2 className="text-base font-bold text-[#1a3a6b] sm:text-lg">
          {t("speakingMicSetupTitle", "Set up your microphone")}
        </h2>
      </div>

      <div className="space-y-4 px-3 py-4 sm:px-5 sm:py-5">
        <p className="text-sm leading-relaxed text-zinc-600">
          {t(
            "speakingMicSetupBody",
            "Allow microphone access and optionally record a short test. When you are ready, start the speaking exam.",
          )}
        </p>

        <div className="rounded-sm border border-zinc-300 bg-[#f7f8fa] px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {status === "requesting"
                ? t("speakingMicStatusRequesting", "Requesting permission…")
                : status === "ready"
                  ? t("speakingMicStatusReady", "Microphone ready")
                  : status === "error"
                    ? t("speakingMicStatusError", "Microphone unavailable")
                    : t("speakingMicStatusIdle", "Waiting…")}
            </span>
            <span
              className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                status === "ready"
                  ? "bg-emerald-600"
                  : status === "requesting"
                    ? "animate-pulse bg-[#1a3a6b]"
                    : status === "error"
                      ? "bg-amber-600"
                      : "bg-zinc-400"
              }`}
              aria-hidden
            />
          </div>

          <div
            className="flex h-10 items-end gap-0.5"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(level * 100)}
            aria-label={t("speakingMicLevel", "Microphone level")}
          >
            {Array.from({ length: bars }, (_, i) => (
              <div
                key={i}
                className={`min-w-0 flex-1 rounded-sm transition-[height,background-color] duration-75 ${
                  i < activeBars && status === "ready"
                    ? i > bars * 0.75
                      ? "bg-amber-500"
                      : "bg-[#1a3a6b]"
                    : "bg-zinc-200"
                }`}
                style={{
                  height:
                    status === "ready" && i < activeBars
                      ? `${28 + (i / bars) * 72}%`
                      : "18%",
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {status === "ready"
              ? t(
                  "speakingMicLevelHint",
                  "Speak into the mic — the bars should move.",
                )
              : t(
                  "speakingMicLevelIdle",
                  "Level meter appears after permission is granted.",
                )}
          </p>
        </div>

        {errorMessage ? (
          <p className="break-words rounded-sm border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {errorMessage}
          </p>
        ) : null}

        {testUrl && testPhase === "playback" ? (
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
              {t("speakingMicTestPlayback", "Test recording")}
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <audio controls src={testUrl} className="w-full" />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2 border-t border-zinc-300 bg-[#eceff2] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          {status === "error" || status === "idle" ? (
            <button
              type="button"
              onClick={() =>
                void requestMic({ autoRetry: true, fromUser: true })
              }
              className="rounded-sm border border-[#1a3a6b] bg-white px-3 py-2.5 text-sm font-semibold text-[#1a3a6b] hover:bg-zinc-50"
            >
              {t("speakingMicRetry", "Retry microphone")}
            </button>
          ) : null}
          {status === "ready" ? (
            testPhase === "recording" ? (
              <button
                type="button"
                onClick={stopTestRecord}
                className="rounded-sm border border-red-700 bg-red-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
              >
                {t("speakingMicStopTest", "Stop test")}
              </button>
            ) : (
              <button
                type="button"
                onClick={startTestRecord}
                className="rounded-sm border border-zinc-400 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                {t("speakingMicTestRecord", "Test recording")}
              </button>
            )
          ) : null}
        </div>
        <button
          type="button"
          disabled={status !== "ready"}
          onClick={handleContinue}
          className="w-full shrink-0 rounded-sm border border-[#1a3a6b] bg-[#1a3a6b] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#152f57] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
