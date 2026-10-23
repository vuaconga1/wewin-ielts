"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  GripVertical,
  X,
} from "lucide-react";
import { useTranslations } from "@/i18n/provider";

const STORAGE_KEY = "wewin_classroom_split_v1";
const HOME_PATH = "/learn";
const MIN_PERCENT = 25;
const MAX_PERCENT = 75;
const PRESETS = { zoomLarge: 70, even: 50, webLarge: 30 } as const;

type Stored = { leftPercent: number; url: string };

function clampPercent(value: number): number {
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(value)));
}

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>;
      return {
        leftPercent: clampPercent(Number(parsed.leftPercent) || PRESETS.even),
        url:
          typeof parsed.url === "string" && parsed.url ? parsed.url : HOME_PATH,
      };
    }
  } catch {
    /* private mode / bad JSON */
  }
  return { leftPercent: PRESETS.even, url: HOME_PATH };
}

/**
 * Same-origin paths and Google Slides links only — other sites refuse to be framed.
 * Live classroom pages are refused: a second embedded Zoom client would kick the first.
 */
export function normalizeWebPanelUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value, window.location.origin);
  } catch {
    return null;
  }
  if (url.origin === window.location.origin) {
    if (/^\/classroom\/[^/]+/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  const slides =
    url.hostname === "docs.google.com" &&
    url.pathname.match(/^\/presentation\/(?:u\/\d+\/)?d\/([^/]+)/);
  if (slides) {
    return `https://docs.google.com/presentation/d/${slides[1]}/embed?start=false&loop=false`;
  }
  return null;
}

type Props = {
  /** Zoom + slides; always rendered in the same tree slot so the meeting iframe never remounts. */
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
};

export function ClassroomSplitView({ children, open, onClose }: Props) {
  const { t } = useTranslations("classroom");
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [leftPercent, setLeftPercent] = useState<number>(PRESETS.even);
  const [src, setSrc] = useState(HOME_PATH);
  const [address, setAddress] = useState(HOME_PATH);
  const [invalid, setInvalid] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const stored = readStored();
    setLeftPercent(stored.leftPercent);
    setSrc(stored.url);
    setAddress(stored.url);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ leftPercent, url: src }),
      );
    } catch {
      /* ignore */
    }
  }, [leftPercent, loaded, src]);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setLeftPercent(clampPercent(((clientX - rect.left) / rect.width) * 100));
  }, []);

  function onDividerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onDividerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") setLeftPercent((p) => clampPercent(p - 5));
    else if (event.key === "ArrowRight")
      setLeftPercent((p) => clampPercent(p + 5));
    else if (event.key === "Home") setLeftPercent(MIN_PERCENT);
    else if (event.key === "End") setLeftPercent(MAX_PERCENT);
    else return;
    event.preventDefault();
  }

  function navigate(target: string) {
    const normalized = normalizeWebPanelUrl(target);
    if (!normalized) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setAddress(normalized);
    if (normalized === src) setReloadKey((key) => key + 1);
    else setSrc(normalized);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(address);
  }

  function goBack() {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      /* cross-origin frame (Google Slides) */
    }
  }

  function reload() {
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      setReloadKey((key) => key + 1);
    }
  }

  /** Keep the address bar in sync with in-frame link clicks (same-origin only). */
  function onFrameLoad() {
    try {
      const loc = iframeRef.current?.contentWindow?.location;
      if (!loc || loc.origin !== window.location.origin) return;
      const path = `${loc.pathname}${loc.search}${loc.hash}`;
      setAddress(path);
      setInvalid(false);
    } catch {
      /* cross-origin */
    }
  }

  const openHref = src.startsWith("/") ? src : src.replace("/embed?", "/edit?");
  return (
    <div
      ref={containerRef}
      className={
        open
          ? `flex h-[calc(100dvh-8.5rem)] min-h-[560px] min-w-0 ${
              dragging ? "cursor-col-resize select-none" : ""
            }`
          : "min-w-0"
      }
    >
      <div
        className={
          open
            ? `min-w-0 overflow-auto pr-1 ${dragging ? "pointer-events-none" : ""}`
            : "min-w-0"
        }
        style={
          open
            ? { flexBasis: `${leftPercent}%`, flexGrow: 0, flexShrink: 0 }
            : undefined
        }
      >
        {children}
      </div>

      {open ? (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t(
              "resizeHandle",
              "Kéo để chỉnh kích thước hai màn hình",
            )}
            aria-valuemin={MIN_PERCENT}
            aria-valuemax={MAX_PERCENT}
            aria-valuenow={leftPercent}
            tabIndex={0}
            onPointerDown={onDividerPointerDown}
            onPointerMove={(event) => {
              if (dragging) updateFromPointer(event.clientX);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onDoubleClick={() => setLeftPercent(PRESETS.even)}
            onKeyDown={onDividerKeyDown}
            className="group flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-wewin-blue"
          >
            <span
              className={`flex h-16 w-1.5 items-center justify-center rounded-full transition ${
                dragging
                  ? "bg-wewin-navy"
                  : "bg-zinc-300 group-hover:bg-wewin-navy"
              }`}
            >
              <GripVertical className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
            </span>
          </div>

          <section
            className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-wewin-border bg-white shadow-sm ${
              dragging ? "pointer-events-none" : ""
            }`}
          >
            {/* Navigation toolbar hidden — panel shows iframe directly */}
            <p className="border-b border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-wewin-navy">
              {t(
                "webPrivateHint",
                "Chỉ giáo viên thấy khung này. Khi chia sẻ màn hình Zoom, tab lớp học không có trong danh sách chọn nên khung này không bị chia sẻ.",
              )}
            </p>
            {loaded ? (
              <iframe
                key={reloadKey}
                ref={iframeRef}
                src={src}
                onLoad={onFrameLoad}
                title={t("webPanel", "Trang web")}
                allow="fullscreen"
                className="min-h-0 w-full flex-1 border-0 bg-white"
              />
            ) : (
              <div className="flex-1" />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
