/**
 * Fire-and-forget visit beacon — at most once per tab session; the server
 * also dedupes per visitor within 30 minutes.
 */

const VISITOR_KEY = "wewin_visitor_id";
const SESSION_KEY = "wewin_visit_sent_v1";

let sent = false;

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().replace(/-/g, "")
          : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function trackVisit(): void {
  if (sent || typeof window === "undefined") return;
  sent = true;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode: rely on in-memory flag */
  }
  const id = visitorId();
  if (!id) return;
  const body = JSON.stringify({ visitorId: id });
  try {
    if (navigator.sendBeacon?.("/api/track/visit", new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch("/api/track/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
