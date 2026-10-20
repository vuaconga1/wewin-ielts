"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoadingIndicator } from "@/components/layout/page-loading";
import { NAV_CANCEL_EVENT, NAV_START_EVENT } from "@/lib/client/nav-progress";

/** Fast navigations finish before the overlay appears, so they never flash. */
const OVERLAY_DELAY_MS = 200;
/** Safety net if a click never results in a navigation. */
const MAX_VISIBLE_MS = 20_000;

type Phase = "idle" | "bar" | "overlay";
type Inset = { top: number; left: number };

function isTrackedLinkClick(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const target = e.target;
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download") || anchor.dataset.noProgress != null) return false;
  const hrefAttr = anchor.getAttribute("href") ?? "";
  if (!hrefAttr || hrefAttr.startsWith("#")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href, location.href);
  } catch {
    return false;
  }
  if (url.origin !== location.origin) return false;
  return url.pathname !== location.pathname || url.search !== location.search;
}

/** Cover only the page content area: below the fixed header, right of the sidebar. */
function contentInset(): Inset {
  const inset = document.querySelector<HTMLElement>(".wewin-sidebar-inset");
  if (!inset) return { top: 0, left: 0 };
  const style = getComputedStyle(inset);
  return {
    top: parseFloat(style.paddingTop) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

function Progress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const [inset, setInset] = useState<Inset>({ top: 0, left: 0 });
  const timers = useRef<number[]>([]);

  const stop = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setPhase("idle");
  }, []);

  const start = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setInset(contentInset());
    setPhase("bar");
    timers.current = [
      window.setTimeout(() => setPhase("overlay"), OVERLAY_DELAY_MS),
      window.setTimeout(stop, MAX_VISIBLE_MS),
    ];
  }, [stop]);

  useEffect(() => {
    stop();
  }, [pathname, search, stop]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isTrackedLinkClick(e)) start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    window.addEventListener(NAV_CANCEL_EVENT, stop);
    window.addEventListener("pageshow", stop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
      window.removeEventListener(NAV_CANCEL_EVENT, stop);
      window.removeEventListener("pageshow", stop);
    };
  }, [start, stop]);

  if (phase === "idle") return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[130] h-[3px]" aria-hidden>
        <div className="wewin-nav-progress-bar h-full bg-wewin-gold shadow-[0_0_8px_var(--wewin-gold)]" />
      </div>
      {phase === "overlay" ? (
        <div
          className="fixed bottom-0 right-0 z-[100] flex items-center justify-center bg-wewin-bg/80 backdrop-blur-[1px]"
          style={{ top: inset.top, left: inset.left }}
          aria-busy="true"
        >
          <PageLoadingIndicator />
        </div>
      ) : null}
    </>
  );
}

/** Instant feedback for every in-app navigation, shown over the page content. */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  );
}
