"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { GripHorizontal, Minus, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";

const FASTBOTS_BOT_ID = "cm6t5x0pl1e32svk4sez4rwwq";
const CHAT_URL = `https://app.fastbots.ai/embed/${FASTBOTS_BOT_ID}`;
const MASCOT_SRC = "/branding/wewin-mascot-hero.png";

export const OPEN_CHAT_EVENT = "wewin:open-chat";

/** Never cover a running test, a live class, or auth screens. */
const HIDDEN_PATHS = ["/practice/", "/classroom", "/login"];

const POS_KEY = "wewin-chat-pos-v1";
const GREETING_KEY = "wewin-chat-greeting-dismissed";
const MARGIN = 8;
/** Fixed site header (64px) stays above the widget. */
const TOP_RESERVE = 72;
const MASCOT_W = 76;
const MASCOT_H = 94;
const PANEL_W = 380;
const PANEL_H = 600;
const DRAG_THRESHOLD = 5;

type Pos = { right: number; bottom: number };
const DEFAULT_POS: Pos = { right: 16, bottom: 16 };

/** Fire from anywhere (e.g. "Liên hệ tư vấn" buttons) to open the chat. */
export function openWewinChat() {
  window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
}

function clamp(pos: Pos, width: number, height: number): Pos {
  const maxRight = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const maxBottom = Math.max(MARGIN, window.innerHeight - height - TOP_RESERVE);
  return {
    right: Math.min(Math.max(MARGIN, pos.right), maxRight),
    bottom: Math.min(Math.max(MARGIN, pos.bottom), maxBottom),
  };
}

function readPos(): Pos {
  try {
    const raw = JSON.parse(localStorage.getItem(POS_KEY) ?? "null") as Pos | null;
    if (raw && Number.isFinite(raw.right) && Number.isFinite(raw.bottom)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_POS;
}

export function WewinChatWidget() {
  const { t } = useTranslations("chatWidget");
  const pathname = usePathname() ?? "";
  const hiddenHere = HIDDEN_PATHS.some((prefix) => pathname.startsWith(prefix));

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  /** Iframe stays mounted after first open so minimizing keeps the conversation. */
  const [loaded, setLoaded] = useState(false);
  const [pos, setPos] = useState<Pos>(DEFAULT_POS);
  const [isMobile, setIsMobile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const drag = useRef<{ x: number; y: number; start: Pos; last: Pos; moved: boolean; w: number; h: number } | null>(
    null,
  );

  const panelSize = useCallback(
    () => ({
      w: Math.min(PANEL_W, window.innerWidth - MARGIN * 2),
      h: Math.min(PANEL_H, window.innerHeight - TOP_RESERVE - MARGIN),
    }),
    [],
  );

  useEffect(() => {
    setMounted(true);
    setPos(clamp(readPos(), MASCOT_W, MASCOT_H));
    try {
      setShowGreeting(localStorage.getItem(GREETING_KEY) !== "1");
    } catch {
      setShowGreeting(true);
    }
    const media = window.matchMedia("(max-width: 639px)");
    const syncMobile = () => setIsMobile(media.matches);
    syncMobile();
    media.addEventListener("change", syncMobile);
    const onResize = () => setPos((prev) => clamp(prev, MASCOT_W, MASCOT_H));
    window.addEventListener("resize", onResize);
    return () => {
      media.removeEventListener("change", syncMobile);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const openChat = useCallback(() => {
    setLoaded(true);
    setOpen(true);
    setShowGreeting(false);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, [openChat]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function startDrag(e: React.PointerEvent, w: number, h: number) {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, start: pos, last: pos, moved: false, w, h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    d.last = clamp({ right: d.start.right - dx, bottom: d.start.bottom - dy }, d.w, d.h);
    setPos(d.last);
  }

  /** Returns true when the pointer actually dragged (so the click should be ignored). */
  function endDrag(): boolean {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d?.moved) return false;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(d.last));
    } catch {
      /* ignore */
    }
    return true;
  }

  function dismissGreeting() {
    setShowGreeting(false);
    try {
      localStorage.setItem(GREETING_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!mounted || hiddenHere) return null;

  const { w: panelW, h: panelH } = panelSize();
  const panelPos = clamp(pos, panelW, panelH);
  const panelStyle: React.CSSProperties = isMobile
    ? { left: MARGIN, right: MARGIN, bottom: MARGIN, top: TOP_RESERVE }
    : { right: panelPos.right, bottom: panelPos.bottom, width: panelW, height: panelH };
  const greetingOnLeft = pos.right < window.innerWidth / 2;

  return (
    <>
      {/* Mascot launcher (bubble) */}
      {!open ? (
        <div
          className="fixed z-[60] select-none"
          style={{ right: pos.right, bottom: pos.bottom, width: MASCOT_W, height: MASCOT_H }}
        >
          {showGreeting ? (
            <div
              className={`absolute bottom-[70%] w-52 rounded-2xl border border-wewin-border bg-white px-3 py-2.5 pr-7 text-xs text-zinc-700 shadow-lg ${
                greetingOnLeft ? "right-[90%]" : "left-[90%]"
              }`}
              role="status"
            >
              <button type="button" onClick={openChat} className="text-left">
                <span className="block font-bold text-wewin-navy">{t("greetingTitle", "Chào bạn! 👋")}</span>
                <span className="mt-0.5 block break-words">
                  {t("greetingBody", "Chưa biết nên bắt đầu từ đâu? Chat với WEWIN để được tư vấn lộ trình.")}
                </span>
              </button>
              <button
                type="button"
                onClick={dismissGreeting}
                className="absolute right-1.5 top-1.5 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label={t("hideGreeting", "Ẩn lời chào")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onPointerDown={(e) => startDrag(e, MASCOT_W, MASCOT_H)}
            onPointerMove={onDragMove}
            onPointerUp={() => {
              if (!endDrag()) openChat();
            }}
            onPointerCancel={() => endDrag()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openChat();
              }
            }}
            className={`group relative block h-full w-full touch-none rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-wewin-accent-blue-bg ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            aria-label={t("open", "Mở chat tư vấn WEWIN")}
            title={t("openHint", "Bấm để chat · Kéo để di chuyển")}
          >
            <span className="absolute inset-x-1 bottom-0 h-3 rounded-full bg-black/15 blur-sm" aria-hidden />
            <Image
              src={MASCOT_SRC}
              alt=""
              width={MASCOT_W}
              height={MASCOT_H}
              draggable={false}
              priority={false}
              className={`relative h-full w-full object-contain drop-shadow-lg transition-transform ${
                dragging ? "scale-105" : "group-hover:-translate-y-1"
              }`}
            />
            <span className="absolute right-0 top-1 flex h-3.5 w-3.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </button>
        </div>
      ) : null}

      {/* Chat panel — hidden (not unmounted) when minimized */}
      {loaded ? (
        <section
          className={`fixed z-[60] flex min-w-0 flex-col overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-2xl ${
            open ? "" : "hidden"
          }`}
          style={panelStyle}
          aria-label={t("panelTitle", "Tư vấn WEWIN")}
        >
          <header
            onPointerDown={isMobile ? undefined : (e) => startDrag(e, panelW, panelH)}
            onPointerMove={isMobile ? undefined : onDragMove}
            onPointerUp={isMobile ? undefined : () => void endDrag()}
            onPointerCancel={isMobile ? undefined : () => void endDrag()}
            className={`flex shrink-0 items-center gap-2 bg-wewin-navy px-3 py-2 text-white ${
              isMobile ? "" : dragging ? "cursor-grabbing touch-none" : "cursor-grab touch-none"
            }`}
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/15">
              <Image src={MASCOT_SRC} alt="" width={36} height={45} className="h-full w-full object-cover object-top" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{t("panelTitle", "Tư vấn WEWIN")}</p>
              <p className="flex items-center gap-1 truncate text-[11px] text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                {t("panelSubtitle", "Thường trả lời ngay")}
              </p>
            </div>
            {!isMobile ? <GripHorizontal className="h-4 w-4 shrink-0 text-white/50" aria-hidden /> : null}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={t("minimize", "Thu nhỏ")}
              title={t("minimize", "Thu nhỏ")}
            >
              <Minus className="h-4 w-4" />
            </button>
          </header>
          <iframe
            src={CHAT_URL}
            title={t("panelTitle", "Tư vấn WEWIN")}
            allow="clipboard-write"
            className={`min-h-0 w-full flex-1 border-0 bg-white ${dragging ? "pointer-events-none" : ""}`}
          />
        </section>
      ) : null}
    </>
  );
}
