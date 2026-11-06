"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ClipboardList, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import type { IncompleteHomeworkItem } from "@/lib/classroom/homework";

type Payload = { displayName: string; items: IncompleteHomeworkItem[] };
type State = { data: Payload | null; open: boolean };

const CACHE_TTL_MS = 60_000;
const DISMISS_PREFIX = "wewin-homework-dismissed:";
/** Never interrupt a running test, a live class session, or auth screens. */
const HIDDEN_PATHS = ["/practice/", "/classroom/", "/login"];

let state: State = { data: null, open: false };
const SERVER_STATE: State = { data: null, open: false };
const listeners = new Set<() => void>();
let fetchedAt = 0;
let inflight: Promise<Payload | null> | null = null;
/** Auto-open at most once per full page load; the header button can still reopen it. */
let autoOpenedThisLoad = false;

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useHomeworkState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

function isHiddenPath(pathname: string) {
  return HIDDEN_PATHS.some((prefix) => pathname.startsWith(prefix));
}

function todayKey() {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${DISMISS_PREFIX}${day}`;
}

function dismissedToday() {
  try {
    return localStorage.getItem(todayKey()) === "1";
  } catch {
    return false;
  }
}

function dismissForToday() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(DISMISS_PREFIX)) localStorage.removeItem(key);
    }
    localStorage.setItem(todayKey(), "1");
  } catch {
    /* private mode */
  }
}

function loadIncomplete(): Promise<Payload | null> {
  if (state.data && Date.now() - fetchedAt < CACHE_TTL_MS) return Promise.resolve(state.data);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/homework/incomplete");
      if (!res.ok) return null;
      const data = (await res.json()) as Payload;
      fetchedAt = Date.now();
      setState({ data });
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Header entry point: unfinished-homework count; opens the popup even after "hide for today". */
export function HomeworkBell() {
  const { t } = useTranslations("homework");
  const pathname = usePathname() ?? "";
  const hiddenHere = isHiddenPath(pathname);
  const { data } = useHomeworkState();

  useEffect(() => {
    if (!hiddenHere) void loadIncomplete();
  }, [hiddenHere, pathname]);

  const count = data?.items.length ?? 0;
  if (hiddenHere || count === 0) return null;
  const label = t("bell", { n: count }, "Bài tập chưa làm ({n})");

  return (
    <button
      type="button"
      onClick={() => setState({ open: true })}
      className="relative flex min-w-0 shrink-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wewin-gold/70 sm:px-2"
      aria-label={label}
      title={label}
    >
      <span className="relative">
        <ClipboardList className="h-5 w-5 shrink-0 text-wewin-gold" strokeWidth={1.75} aria-hidden />
        <span className="absolute -right-2 -top-1.5 min-w-[1.1rem] rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-[1.1rem] text-white">
          {count > 99 ? "99+" : count}
        </span>
      </span>
      <span className="hidden text-center text-[11px] font-medium leading-tight text-white sm:block">
        {t("bellShort", "Bài tập")}
      </span>
    </button>
  );
}

export function HomeworkPopup() {
  const { t, locale } = useTranslations("homework");
  const pathname = usePathname() ?? "";
  const hiddenHere = isHiddenPath(pathname);
  const { data, open } = useHomeworkState();

  useEffect(() => {
    if (hiddenHere || autoOpenedThisLoad || dismissedToday()) return;
    let alive = true;
    void loadIncomplete().then((payload) => {
      if (!alive || autoOpenedThisLoad || !payload?.items.length) return;
      autoOpenedThisLoad = true;
      setState({ open: true });
    });
    return () => {
      alive = false;
    };
  }, [hiddenHere]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setState({ open: false });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const formatters = useMemo(() => new Map<string, Intl.DateTimeFormat>(), []);
  function fmt(iso: string, timeZone: string) {
    const key = `${locale}|${timeZone}`;
    let formatter = formatters.get(key);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      formatters.set(key, formatter);
    }
    return formatter.format(new Date(iso));
  }

  if (!open || !data?.items.length || hiddenHere || typeof document === "undefined") return null;
  const overdue = data.items.filter((item) => item.isOverdue);
  const upcoming = data.items.filter((item) => !item.isOverdue);

  function close() {
    dismissForToday();
    setState({ open: false });
  }

  function renderItem(item: IncompleteHomeworkItem) {
    return (
      <li
        key={item.assignmentId}
        className={`flex min-w-0 flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between ${
          item.isOverdue ? "border-rose-200 bg-rose-50" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-zinc-900">
            {item.testTitle}
            {item.partLabel ? <span className="font-normal text-zinc-600"> · {item.partLabel}</span> : null}
            {item.isNew ? (
              <span className="ml-2 inline-block rounded-full bg-wewin-navy px-2 py-0.5 align-middle text-[10px] font-bold uppercase text-white">
                {t("new", "Mới")}
              </span>
            ) : null}
          </p>
          <p className={`mt-0.5 break-words text-xs ${item.isOverdue ? "text-rose-700" : "text-zinc-500"}`}>
            {t("deadline", { at: fmt(item.deadlineAt, item.timezone) }, "Hạn: {at}")} · {item.className}
          </p>
        </div>
        <Link
          href={item.href}
          onClick={() => setState({ open: false })}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("start", "Làm bài")}
        </Link>
      </li>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homework-popup-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) setState({ open: false });
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 sm:px-5">
          <h2 id="homework-popup-title" className="flex min-w-0 items-start gap-2 text-base font-bold text-wewin-navy">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <span className="break-words">
              {t(
                "title",
                { name: data.displayName, n: data.items.length },
                "Chào {name}, bạn có {n} bài tập chưa hoàn thành",
              )}
            </span>
          </h2>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label={t("closeToday", "Ẩn đến hết hôm nay")}
            title={t("closeToday", "Ẩn đến hết hôm nay")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-w-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {overdue.length ? (
            <div className="min-w-0 space-y-2">
              <h3 className="text-sm font-bold text-rose-700">
                {t("overdue", { n: overdue.length }, "Đã quá hạn ({n})")}
              </h3>
              <ul className="min-w-0 space-y-2">{overdue.map(renderItem)}</ul>
            </div>
          ) : null}
          {upcoming.length ? (
            <div className="min-w-0 space-y-2">
              <h3 className="text-sm font-bold text-zinc-800">
                {t("upcoming", { n: upcoming.length }, "Sắp đến hạn ({n})")}
              </h3>
              <ul className="min-w-0 space-y-2">{upcoming.map(renderItem)}</ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
