"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ExternalLink, Video } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

type MobileJoinInfo = {
  meetingNumber: string;
  password: string;
};

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function ZoomMeetingPanel({ sessionId }: { sessionId: string }) {
  const { t } = useTranslations("classroom");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(false);
  const [mobileInfo, setMobileInfo] = useState<MobileJoinInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!joined) {
      setElapsedSeconds(0);
      return;
    }

    const storageKey = `wewin_zoom_joined_${sessionId}`;
    let startTime = Date.now();
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored && !isNaN(Number(stored))) {
        startTime = Number(stored);
      } else {
        sessionStorage.setItem(storageKey, String(startTime));
      }
    } catch {
      /* ignore */
    }

    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [joined, sessionId]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.source !== "wewin-zoom"
      ) {
        return;
      }
      setJoining(false);
      if (event.data.status === "joined") setJoined(true);
      if (event.data.status === "error") setError(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function prepareMobileJoin() {
    setJoining(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/classroom/sessions/${encodeURIComponent(sessionId)}/join`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      const payload = (await response.json()) as MobileJoinInfo & { error?: string };
      if (!response.ok) throw new Error(payload.error || "JOIN_FAILED");
      setMobileInfo(payload);
    } catch {
      setError(true);
    } finally {
      setJoining(false);
    }
  }

  const frameVisible = desktop && (joining || joined || error);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-wewin-border px-4 py-3">
        <h2 className="break-words text-sm font-bold text-wewin-navy">
          {t("zoomPanel", "Phòng học Zoom")}
        </h2>
        {joined ? (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold font-mono text-zinc-700 shadow-2xs"
              title={t("meetingDuration", "Thời gian buổi học")}
            >
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("live", "Đang diễn ra")}
            </span>
          </div>
        ) : null}
      </div>

      {desktop === false ? (
        <div className="space-y-4 p-5">
          <p className="break-words text-sm text-zinc-700">
            {t(
              "mobileUnsupported",
              "Giao diện Zoom nhúng chỉ hỗ trợ trình duyệt desktop. Hãy mở ứng dụng Zoom trên điện thoại.",
            )}
          </p>
          {!mobileInfo ? (
            <button
              type="button"
              disabled={joining}
              onClick={() => void prepareMobileJoin()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Video className="h-4 w-4" />
              {joining
                ? t("loading", "Đang tải lớp học…")
                : t("openZoomApp", "Mở ứng dụng Zoom")}
            </button>
          ) : (
            <div className="space-y-3">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="font-medium text-zinc-500">
                    {t("meetingNumber", "Meeting ID")}
                  </dt>
                  <dd className="mt-1 font-semibold text-zinc-900">
                    {mobileInfo.meetingNumber}
                  </dd>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <dt className="font-medium text-zinc-500">
                    {t("passcode", "Mật khẩu")}
                  </dt>
                  <dd className="mt-1 font-semibold text-zinc-900">
                    {mobileInfo.password || "—"}
                  </dd>
                </div>
              </dl>
              <a
                href={`zoommtg://zoom.us/join?action=join&confno=${encodeURIComponent(
                  mobileInfo.meetingNumber,
                )}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-wewin-navy px-4 py-2.5 text-sm font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                {t("openZoomApp", "Mở ứng dụng Zoom")}
              </a>
            </div>
          )}
        </div>
      ) : frameVisible ? (
        <iframe
          ref={iframeRef}
          src={`/classroom/${encodeURIComponent(sessionId)}/meeting-frame`}
          title={t("zoomPanel", "Phòng học Zoom")}
          allow="camera; microphone; display-capture; fullscreen"
          className="h-[min(68vh,720px)] min-h-[420px] w-full border-0 bg-wewin-navy"
        />
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-6 text-center">
          <Video className="h-10 w-10 text-wewin-blue" />
          <p className="max-w-xl break-words text-sm text-zinc-600">
            {t(
              "deviceHelp",
              "Hãy cho phép trình duyệt sử dụng camera và micro. Chia sẻ màn hình hoạt động tốt nhất trên Chrome hoặc Edge desktop.",
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setJoining(true);
              setError(false);
            }}
            className="min-h-11 rounded-xl bg-wewin-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-wewin-blue"
          >
            {t("joinZoom", "Kết nối Zoom")}
          </button>
        </div>
      )}

      {error ? (
        <p className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("joinFailed", "Không thể kết nối phòng Zoom. Vui lòng thử lại.")}
        </p>
      ) : null}
    </section>
  );
}
