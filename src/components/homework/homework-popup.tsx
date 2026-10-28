"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ClipboardList, X } from "lucide-react";
import { useTranslations } from "@/i18n/provider";
import type { IncompleteHomeworkItem } from "@/lib/classroom/homework";

type Payload = { displayName: string; items: IncompleteHomeworkItem[] };

const CACHE_TTL_MS = 60_000;
const DISMISS_PREFIX = "wewin-homework-dismissed:";
/** Never interrupt a running test, a live class, or auth screens. */
const HIDDEN_PATHS = ["/practice/", "/classroom", "/login"];

let cache: { data: Payload; fetchedAt: number } | null = null;
let inflight: Promise<Payload | null> | null = null;
/** "Làm bài" hides the popup until the next full page load. */
let hiddenThisLoad = false;

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
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/homework/incomplete");
      if (!res.ok) return null;
      const data = (await res.json()) as Payload;
      cache = { data, fetchedAt: Date.now() };
      return data;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function HomeworkPopup() {
  const { t, locale } = useTranslations("homework");
  const pathname = usePathname() ?? "";
  const hiddenHere = HIDDEN_PATHS.some((prefix) => pathname.startsWith(prefix));
  const [data, setData] = useState<Payload | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hiddenHere || hiddenThisLoad || dismissedToday()) return;
    let alive = true;
    void loadIncomplete().then((payload) => {
      if (!alive || !payload?.items.length) return;
      setData(payload);
      setOpen(true);
    });
    return () => {
      alive = false;
    };
  }, [hiddenHere]);

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

  if (!open || !data || hiddenHere) return null;
  const overdue = data.items.filter((item) => item.isOverdue);
  const upcoming = data.items.filter((item) => !item.isOverdue);

  function close() {
    dismissForToday();
    setOpen(false);
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
          onClick={() => {
            hiddenThisLoad = true;
            setOpen(false);
          }}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-wewin-navy px-4 py-2 text-sm font-semibold text-white hover:bg-wewin-navy-hover"
        >
          {t("start", "Làm bài")}
        </Link>
      </li>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homework-popup-title"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        hiddenThisLoad = true;
        setOpen(false);
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
    </div>
  );
}
