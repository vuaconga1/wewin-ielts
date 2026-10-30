"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { GripHorizontal, Minus, X } from "lucide-react";

/**
 * ============================================================================
 * FASTBOT CHAT WIDGET - REFERENCE TEMPLATE
 * ============================================================================
 * Cách dùng:
 * 1. Thay FASTBOTS_BOT_ID bằng Bot ID của bạn từ https://fastbots.ai
 * 2. Thay MASCOT_SRC bằng ảnh linh vật / avatar chatbot của bạn (đặt trong public/)
 * 3. Đặt component <FastBotChatWidget /> vào layout chính (ví dụ: app/layout.tsx)
 * 4. Để mở chat từ bất kỳ đâu (ví dụ: nút 'Tư vấn ngay'):
 *    import { openChatWidget } from './fastbot-chat-widget';
 *    <button onClick={openChatWidget}>Chat ngay</button>
 * ============================================================================
 */

// 1. Cấu hình Bot ID và tài nguyên
export const FASTBOTS_BOT_ID = "cm6t5x0pl1e32svk4sez4rwwq"; // <-- THAY BOT ID CỦA BẠN TẠI ĐÂY
const CHAT_URL = `https://app.fastbots.ai/embed/${FASTBOTS_BOT_ID}`;
const MASCOT_SRC = "/branding/wewin-mascot-hero.png"; // <-- THAY ĐƯỜNG DẪN ẢNH MASCOT

export const OPEN_CHAT_EVENT = "app:open-chat";

// Danh sách các đường dẫn không hiển thị chatbot (để tránh che khuất giao diện thi / học)
const HIDDEN_PATH_PREFIXES = ["/practice/", "/classroom", "/exam"];

const POS_STORAGE_KEY = "chat-widget-pos-v1";
const GREETING_STORAGE_KEY = "chat-widget-greeting-dismissed";
const SCREEN_MARGIN = 8;
const TOP_RESERVE = 72; // Khoảng cách chừa cho thanh header cố định
const MASCOT_W = 76;
const MASCOT_H = 94;
const PANEL_W = 380;
const PANEL_H = 600;
const DRAG_THRESHOLD = 5;

type Position = { right: number; bottom: number };
const DEFAULT_POS: Position = { right: 16, bottom: 16 };

/**
 * Hàm mở chatbot từ bất cứ component nào trong ứng dụng
 */
export function openChatWidget() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
  }
}

function clamp(pos: Position, width: number, height: number): Position {
  if (typeof window === "undefined") return pos;
  const maxRight = Math.max(SCREEN_MARGIN, window.innerWidth - width - SCREEN_MARGIN);
  const maxBottom = Math.max(SCREEN_MARGIN, window.innerHeight - height - TOP_RESERVE);
  return {
    right: Math.min(Math.max(SCREEN_MARGIN, pos.right), maxRight),
    bottom: Math.min(Math.max(SCREEN_MARGIN, pos.bottom), maxBottom),
  };
}

function readStoredPos(): Position {
  if (typeof window === "undefined") return DEFAULT_POS;
  try {
    const raw = JSON.parse(localStorage.getItem(POS_STORAGE_KEY) ?? "null");
    if (raw && Number.isFinite(raw.right) && Number.isFinite(raw.bottom)) return raw;
  } catch {
    /* bỏ qua */
  }
  return DEFAULT_POS;
}

export function FastBotChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  // Giữ iframe trong DOM sau lần mở đầu tiên để cuộc hội thoại không bị tải lại khi thu nhỏ
  const [loaded, setLoaded] = useState(false);
  const [pos, setPos] = useState<Position>(DEFAULT_POS);
  const [isMobile, setIsMobile] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const dragRef = useRef<{
    x: number;
    y: number;
    start: Position;
    last: Position;
    moved: boolean;
    w: number;
    h: number;
  } | null>(null);

  // Kiểm tra đường dẫn ẩn widget (nếu dùng Next.js navigation)
  const isHiddenPath = false; 

  const panelSize = useCallback(() => {
    if (typeof window === "undefined") return { w: PANEL_W, h: PANEL_H };
    return {
      w: Math.min(PANEL_W, window.innerWidth - SCREEN_MARGIN * 2),
      h: Math.min(PANEL_H, window.innerHeight - TOP_RESERVE - SCREEN_MARGIN),
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    setPos(clamp(readStoredPos(), MASCOT_W, MASCOT_H));
    try {
      setShowGreeting(localStorage.getItem(GREETING_STORAGE_KEY) !== "1");
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

  const handleOpenChat = useCallback(() => {
    setLoaded(true);
    setOpen(true);
    setShowGreeting(false);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_CHAT_EVENT, handleOpenChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handleOpenChat);
  }, [handleOpenChat]);

  // Nhấn ESC để đóng chatbot
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
    dragRef.current = { x: e.clientX, y: e.clientY, start: pos, last: pos, moved: false, w, h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
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

  function endDrag(): boolean {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (!d?.moved) return false;
    try {
      localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(d.last));
    } catch {
      /* ignore */
    }
    return true; // đã kéo di chuyển, không kích hoạt click mở chat
  }

  function dismissGreeting() {
    setShowGreeting(false);
    try {
      localStorage.setItem(GREETING_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!mounted || isHiddenPath) return null;

  const { w: panelW, h: panelH } = panelSize();
  const panelPos = clamp(pos, panelW, panelH);
  const panelStyle: React.CSSProperties = isMobile
    ? { left: SCREEN_MARGIN, right: SCREEN_MARGIN, bottom: SCREEN_MARGIN, top: TOP_RESERVE }
    : { right: panelPos.right, bottom: panelPos.bottom, width: panelW, height: panelH };
  const greetingOnLeft = typeof window !== "undefined" && pos.right < window.innerWidth / 2;

  return (
    <>
      {/* 1. NÚT LAUNCHER BUBBLE / LINH VẬT NỔI (CÓ THỂ KÉO THẢ) */}
      {!open ? (
        <div
          className="fixed z-[60] select-none"
          style={{ right: pos.right, bottom: pos.bottom, width: MASCOT_W, height: MASCOT_H }}
        >
          {/* Tooltip lời chào mời chat */}
          {showGreeting ? (
            <div
              className={`absolute bottom-[70%] w-52 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-7 text-xs text-zinc-700 shadow-xl ${
                greetingOnLeft ? "right-[90%]" : "left-[90%]"
              }`}
              role="status"
            >
              <button type="button" onClick={handleOpenChat} className="text-left w-full">
                <span className="block font-bold text-[#001233]">Chào bạn! 👋</span>
                <span className="mt-0.5 block break-words text-zinc-600">
                  Bạn cần tư vấn thông tin hoặc lộ trình học? Chat ngay với chúng tôi!
                </span>
              </button>
              <button
                type="button"
                onClick={dismissGreeting}
                className="absolute right-1.5 top-1.5 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Ẩn lời chào"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {/* Nút bấm hình Mascot */}
          <button
            type="button"
            onPointerDown={(e) => startDrag(e, MASCOT_W, MASCOT_H)}
            onPointerMove={onDragMove}
            onPointerUp={() => {
              if (!endDrag()) handleOpenChat();
            }}
            onPointerCancel={() => endDrag()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenChat();
              }
            }}
            className={`group relative block h-full w-full touch-none rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
              dragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            aria-label="Mở khung chat tư vấn"
            title="Bấm để chat · Kéo để di chuyển vị trí"
          >
            <span className="absolute inset-x-1 bottom-0 h-3 rounded-full bg-black/15 blur-sm" aria-hidden />
            <Image
              src={MASCOT_SRC}
              alt="AI Assistant"
              width={MASCOT_W}
              height={MASCOT_H}
              draggable={false}
              priority={false}
              className={`relative h-full w-full object-contain drop-shadow-lg transition-transform ${
                dragging ? "scale-105" : "group-hover:-translate-y-1"
              }`}
            />
            {/* Chấm xanh trạng thái trực tuyến (online pulse) */}
            <span className="absolute right-0 top-1 flex h-3.5 w-3.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </button>
        </div>
      ) : null}

      {/* 2. CỬA SỔ CHAT FASTBOTS (NHÚNG IFRAME) */}
      {loaded ? (
        <section
          className={`fixed z-[60] flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
            open ? "" : "hidden"
          }`}
          style={panelStyle}
          aria-label="Cửa sổ tư vấn trực tuyến"
        >
          {/* Header thanh kéo và nút thu nhỏ */}
          <header
            onPointerDown={isMobile ? undefined : (e) => startDrag(e, panelW, panelH)}
            onPointerMove={isMobile ? undefined : onDragMove}
            onPointerUp={isMobile ? undefined : () => void endDrag()}
            onPointerCancel={isMobile ? undefined : () => void endDrag()}
            className={`flex shrink-0 items-center gap-2 bg-[#001233] px-3.5 py-2.5 text-white ${
              isMobile ? "" : dragging ? "cursor-grabbing touch-none" : "cursor-grab touch-none"
            }`}
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/15">
              <Image src={MASCOT_SRC} alt="Avatar" width={36} height={45} className="h-full w-full object-cover object-top" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">Trợ lý AI Thông Minh</p>
              <p className="flex items-center gap-1.5 truncate text-[11px] text-emerald-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                Đang trực tuyến (Phản hồi ngay)
              </p>
            </div>
            {!isMobile ? <GripHorizontal className="h-4 w-4 shrink-0 text-white/50" aria-hidden /> : null}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Thu nhỏ chat"
              title="Thu nhỏ"
            >
              <Minus className="h-4 w-4" />
            </button>
          </header>

          {/* Iframe Fastbots.ai */}
          <iframe
            src={CHAT_URL}
            title="FastBots AI Chat"
            allow="clipboard-write"
            className={`min-h-0 w-full flex-1 border-0 bg-white ${dragging ? "pointer-events-none" : ""}`}
          />
        </section>
      ) : null}
    </>
  );
}
