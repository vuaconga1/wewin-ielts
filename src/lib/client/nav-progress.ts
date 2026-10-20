/**
 * Page-transition indicator events (see NavigationProgress in the root layout).
 * Link clicks are detected automatically; call these around programmatic
 * `router.push` / `router.replace`, or when a click handler cancels navigation.
 */

export const NAV_START_EVENT = "wewin:nav-start";
export const NAV_CANCEL_EVENT = "wewin:nav-cancel";

export function startNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NAV_START_EVENT));
}

export function cancelNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(NAV_CANCEL_EVENT));
}
