const PREFIX = "wewin_tour_seen";

export function tourUserKey(username?: string | null): string {
  const raw = username?.trim();
  if (!raw) return "guest";
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 64) || "guest";
}

export function tourSeenStorageKey(userKey: string, tourId: string): string {
  return `${PREFIX}:${userKey}:${tourId}`;
}

export function hasSeenTour(userKey: string, tourId: string): boolean {
  try {
    return localStorage.getItem(tourSeenStorageKey(userKey, tourId)) === "1";
  } catch {
    return true;
  }
}

export function markTourSeen(userKey: string, tourId: string): void {
  try {
    localStorage.setItem(tourSeenStorageKey(userKey, tourId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}
