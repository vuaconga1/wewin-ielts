"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MonitorUp,
  Presentation,
  Video,
} from "lucide-react";
import { SlideViewer } from "@/components/classroom/slide-viewer";
import { ZoomMeetingPanel } from "@/components/classroom/zoom-meeting-panel";
import { useTranslations } from "@/i18n/provider";
import {
  newerPresentationState,
  publicPresentationStateSchema,
  type ClassroomPresentation,
  type PublicPresentationState,
} from "@/lib/classroom/types";

export type LiveClassroomProps = {
  session: {
    id: string;
    title: string;
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
    scheduledStart: string;
    scheduledEnd: string | null;
    classroom: { id: string; code: string; name: string; timezone: string };
    presentationState: PublicPresentationState;
    presentations: ClassroomPresentation[];
  };
  canControl: boolean;
  realtimeEnabled: boolean;
};

type AblyMessage = { data?: unknown };
type AblyChannel = {
  subscribe(name: string, listener: (message: AblyMessage) => void): Promise<void>;
  unsubscribe(name: string, listener: (message: AblyMessage) => void): void;
};
type AblyRealtimeClient = {
  channels: { get(name: string): AblyChannel };
  close(): void;
};
type AblyBrowserSdk = {
  Realtime: new (options: {
    authUrl: string;
    authMethod: "POST";
  }) => AblyRealtimeClient;
};

declare global {
  interface Window {
    Ably?: AblyBrowserSdk;
  }
}

const ABLY_BROWSER_SDK_URL = "https://cdn.ably.com/lib/ably.min-2.29.0.js";
const ABLY_BROWSER_SDK_INTEGRITY =
  "sha384-5yAEMesGsdaxOgT7cOhIeLuuqoKOQLVeflDLCDkvHUhu38nwjfxBt62LebIgx1DI";
let ablyBrowserSdkPromise: Promise<AblyBrowserSdk> | null = null;

function loadAblyBrowserSdk(): Promise<AblyBrowserSdk> {
  if (window.Ably) return Promise.resolve(window.Ably);
  if (ablyBrowserSdkPromise) return ablyBrowserSdkPromise;

  ablyBrowserSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${ABLY_BROWSER_SDK_URL}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () =>
      window.Ably ? resolve(window.Ably) : reject(new Error("ABLY_NOT_LOADED"));
    const onError = () => reject(new Error("ABLY_LOAD_FAILED"));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = ABLY_BROWSER_SDK_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.integrity = ABLY_BROWSER_SDK_INTEGRITY;
      document.head.appendChild(script);
    }
  });

  return ablyBrowserSdkPromise;
}

const STATUS_KEYS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  ENDED: "ended",
  CANCELLED: "cancelled",
} as const;
const STATUS_FALLBACKS = {
  SCHEDULED: "Sắp diễn ra",
  LIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
} as const;

export function LiveClassroom({
  session,
  canControl,
  realtimeEnabled,
}: LiveClassroomProps) {
  const { t } = useTranslations("classroom");
  const [state, setState] = useState(session.presentationState);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "polling"
  >(realtimeEnabled ? "connecting" : "polling");

  const applyState = useCallback((candidate: unknown) => {
    setState((current) => newerPresentationState(current, candidate));
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/classroom/sessions/${encodeURIComponent(session.id)}/presentation`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      const body = (await response.json()) as { state?: unknown };
      applyState(body.state);
    } catch {
      // The next realtime message or polling cycle will retry.
    }
  }, [applyState, session.id]);

  useEffect(() => {
    let disposed = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let closeRealtime: (() => void) | undefined;

    const startPolling = (intervalMs = 2_000) => {
      if (disposed || poll) return;
      setRealtimeStatus("polling");
      poll = setInterval(() => void refreshState(), intervalMs);
    };

    if (!realtimeEnabled) {
      startPolling();
      return () => {
        disposed = true;
        if (poll) clearInterval(poll);
      };
    }

    void loadAblyBrowserSdk()
      .then(async ({ Realtime }) => {
        if (disposed) return;
        const client = new Realtime({
          authUrl: `/api/classroom/sessions/${encodeURIComponent(
            session.id,
          )}/realtime-token`,
          authMethod: "POST",
        });
        const channel = client.channels.get(`classroom:${session.id}`);
        const listener = (message: AblyMessage) => applyState(message.data);
        closeRealtime = () => {
          channel.unsubscribe("presentation-state", listener);
          client.close();
        };
        try {
          await channel.subscribe("presentation-state", listener);
          if (disposed) return;
          setRealtimeStatus("connected");
          await refreshState();
          poll = setInterval(() => void refreshState(), 30_000);
        } catch {
          closeRealtime();
          startPolling();
        }
      })
      .catch(() => startPolling());

    return () => {
      disposed = true;
      if (poll) clearInterval(poll);
      closeRealtime?.();
    };
  }, [applyState, realtimeEnabled, refreshState, session.id]);

  const presentation = useMemo(
    () =>
      session.presentations.find((item) => item.id === state.presentationId) ??
      session.presentations[0] ??
      null,
    [session.presentations, state.presentationId],
  );
  const slide = presentation?.slides[state.slideIndex] ?? null;

  async function updatePresentation(
    patch: Partial<
      Pick<
        PublicPresentationState,
        "mode" | "presentationId" | "slideIndex"
      >
    >,
  ) {
    if (!canControl || updating) return;
    setUpdating(true);
    setUpdateError(false);
    try {
      const response = await fetch(
        `/api/classroom/sessions/${encodeURIComponent(session.id)}/presentation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: patch.mode ?? state.mode,
            presentationId:
              patch.presentationId === undefined
                ? state.presentationId ?? presentation?.id ?? null
                : patch.presentationId,
            slideIndex: patch.slideIndex ?? state.slideIndex,
            expectedVersion: state.version,
          }),
        },
      );
      const body = (await response.json()) as { state?: unknown };
      if (body.state) {
        const parsed = publicPresentationStateSchema.safeParse(body.state);
        if (parsed.success) setState(parsed.data);
      }
      if (!response.ok) throw new Error("UPDATE_FAILED");
    } catch {
      setUpdateError(true);
      await refreshState();
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#edf1f7] text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-wewin-navy text-white shadow-sm">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/classroom"
              aria-label={t("backToClasses", "Quay lại danh sách lớp")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-blue-200">
                {session.classroom.name} · {session.classroom.code}
              </p>
              <h1 className="truncate text-base font-bold sm:text-lg">
                {session.title}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1.5 font-semibold">
              {t(
                STATUS_KEYS[session.status],
                STATUS_FALLBACKS[session.status],
              )}
            </span>
            <span className="hidden rounded-full bg-white/10 px-3 py-1.5 sm:inline">
              {realtimeStatus === "connected"
                ? t("realtimeConnected", "Đồng bộ tức thời")
                : realtimeStatus === "polling"
                  ? t("syncFallback", "Đang đồng bộ định kỳ")
                  : t("reconnecting", "Đang kết nối lại trạng thái lớp…")}
            </span>
          </div>
        </div>
      </header>

      {canControl ? (
        <div className="border-b border-wewin-border bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[1600px] min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={updating || !presentation}
              onClick={() =>
                void updatePresentation({
                  mode: "WEWIN_SLIDES",
                  presentationId: presentation?.id ?? null,
                  slideIndex: state.slideIndex,
                })
              }
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                state.mode === "WEWIN_SLIDES"
                  ? "bg-wewin-navy text-white"
                  : "bg-zinc-100 text-zinc-700"
              } disabled:opacity-50`}
            >
              <Presentation className="h-4 w-4" />
              {t("modeSlides", "Slide WEWIN")}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                void updatePresentation({ mode: "ZOOM_SCREEN_SHARE" })
              }
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                state.mode === "ZOOM_SCREEN_SHARE"
                  ? "bg-wewin-navy text-white"
                  : "bg-zinc-100 text-zinc-700"
              } disabled:opacity-50`}
            >
              <MonitorUp className="h-4 w-4" />
              {t("modeScreenShare", "Chia sẻ màn hình")}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => void updatePresentation({ mode: "NONE" })}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                state.mode === "NONE"
                  ? "bg-wewin-navy text-white"
                  : "bg-zinc-100 text-zinc-700"
              } disabled:opacity-50`}
            >
              <Video className="h-4 w-4" />
              {t("modeNone", "Chỉ hiển thị Zoom")}
            </button>

            {session.presentations.length > 0 ? (
              <select
                value={presentation?.id ?? ""}
                disabled={updating}
                aria-label={t("selectPresentation", "Chọn bộ slide")}
                onChange={(event) =>
                  void updatePresentation({
                    mode: "WEWIN_SLIDES",
                    presentationId: event.target.value,
                    slideIndex: 0,
                  })
                }
                className="min-h-10 min-w-0 max-w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm sm:max-w-64"
              >
                {session.presentations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            ) : null}

            {state.mode === "WEWIN_SLIDES" && presentation ? (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={updating || state.slideIndex <= 0}
                  onClick={() =>
                    void updatePresentation({ slideIndex: state.slideIndex - 1 })
                  }
                  aria-label={t("previousSlide", "Slide trước")}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-20 text-center text-sm font-semibold text-zinc-700">
                  {t(
                    "slideProgress",
                    {
                      current: state.slideIndex + 1,
                      total: presentation.slideCount,
                    },
                    "Slide {current}/{total}",
                  )}
                </span>
                <button
                  type="button"
                  disabled={
                    updating || state.slideIndex >= presentation.slideCount - 1
                  }
                  onClick={() =>
                    void updatePresentation({ slideIndex: state.slideIndex + 1 })
                  }
                  aria-label={t("nextSlide", "Slide sau")}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-300 disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : null}
          </div>
          {updateError ? (
            <p className="mx-auto mt-2 max-w-[1600px] text-sm text-red-700">
              {t("updateFailed", "Không thể đồng bộ slide. Vui lòng thử lại.")}
            </p>
          ) : null}
        </div>
      ) : state.mode === "WEWIN_SLIDES" ? (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-wewin-navy">
          {t("followingTeacher", "Đang theo dõi slide của giáo viên")}
        </div>
      ) : null}

      <main
        className={`mx-auto grid max-w-[1600px] min-w-0 gap-4 p-3 sm:p-4 ${
          state.mode === "WEWIN_SLIDES"
            ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)]"
            : "grid-cols-1"
        }`}
      >
        {state.mode === "WEWIN_SLIDES" ? (
          <SlideViewer
            slide={slide}
            title={presentation?.title ?? t("slidePanel", "Slide bài giảng")}
            emptyLabel={t("noSlides", "Lớp học chưa có bộ slide.")}
          />
        ) : null}
        <ZoomMeetingPanel sessionId={session.id} />
      </main>
    </div>
  );
}
