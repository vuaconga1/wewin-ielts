"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { ClassroomSplitView } from "@/components/classroom/classroom-split-view";
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
  subscribe(
    name: string,
    listener: (message: AblyMessage) => void,
  ): Promise<void>;
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

const WEB_PANEL_KEY = "wewin_classroom_web_panel";


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

  const [wideScreen, setWideScreen] = useState(false);
  const [webPanelOpen, setWebPanelOpen] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setWideScreen(media.matches);
    update();
    media.addEventListener("change", update);
    try {
      if (localStorage.getItem(WEB_PANEL_KEY) === "closed")
        setWebPanelOpen(false);
    } catch {
      /* ignore */
    }
    return () => media.removeEventListener("change", update);
  }, []);

  function setWebPanel(open: boolean) {
    setWebPanelOpen(open);
    try {
      localStorage.setItem(WEB_PANEL_KEY, open ? "open" : "closed");
    } catch {
      /* ignore */
    }
  }

  const splitActive = canControl && wideScreen && webPanelOpen;

  async function updatePresentation(
    patch: Partial<
      Pick<PublicPresentationState, "mode" | "presentationId" | "slideIndex">
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
                ? (state.presentationId ?? presentation?.id ?? null)
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
          {canControl && wideScreen ? (
            <button
              type="button"
              onClick={() => setWebPanel(!webPanelOpen)}
              aria-pressed={webPanelOpen}
              className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold ${
                webPanelOpen
                  ? "border-white/40 bg-white/20 text-white"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {webPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              {t("webPanelToggle", "Trang web bên cạnh")}
            </button>
          ) : null}
        </div>
      </header>

      {state.mode === "WEWIN_SLIDES" && !canControl ? (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-wewin-navy">
          {t("followingTeacher", "Đang theo dõi slide của giáo viên")}
        </div>
      ) : null}

      <main
        className={`min-w-0 p-3 sm:p-4 ${splitActive ? "" : "mx-auto max-w-[1600px]"}`}
      >
        <ClassroomSplitView
          open={splitActive}
          onClose={() => setWebPanel(false)}
        >
          <div
            className={`grid min-w-0 gap-4 ${
              state.mode === "WEWIN_SLIDES" && !splitActive
                ? "xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)]"
                : "grid-cols-1"
            }`}
          >
            {state.mode === "WEWIN_SLIDES" ? (
              <SlideViewer
                slide={slide}
                title={
                  presentation?.title ?? t("slidePanel", "Slide bài giảng")
                }
                emptyLabel={t("noSlides", "Lớp học chưa có bộ slide.")}
              />
            ) : null}
            <ZoomMeetingPanel sessionId={session.id} />
          </div>
        </ClassroomSplitView>
      </main>
    </div>
  );
}
