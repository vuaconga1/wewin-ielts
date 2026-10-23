/** Wall-clock helpers for class timezones (client-safe, no dependencies). */

export const CLASS_TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
] as const;

export const MAX_SERIES_OCCURRENCES = 50;

const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

/** "2026-10-26T19:00" in `timeZone` → UTC instant. */
export function zonedWallTimeToUtc(wallTime: string, timeZone: string): Date | null {
  const match = WALL_TIME.exec(wallTime);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - offsetMs(new Date(guess), timeZone);
  const second = guess - offsetMs(new Date(first), timeZone);
  const result = new Date(second);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** UTC instant → "2026-10-26T19:00" in `timeZone` (for datetime-local inputs). */
export function utcToZonedWallTime(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** JS weekday (0 = Sunday … 6 = Saturday) of a wall-clock date string. */
export function wallTimeWeekday(wallTime: string): number | null {
  const match = WALL_TIME.exec(wallTime) ?? DATE_ONLY.exec(wallTime);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/**
 * Weekly occurrences (wall-clock strings) from the first session's date through
 * `untilDate` inclusive, on the given JS weekdays. Capped at `limit + 1` so the
 * caller can detect an over-long series.
 */
export function expandWeeklyWallTimes(input: {
  startWallTime: string;
  weekdays: number[];
  untilDate: string;
  limit?: number;
}): string[] {
  const start = WALL_TIME.exec(input.startWallTime);
  const until = DATE_ONLY.exec(input.untilDate);
  if (!start || !until) return [];
  const limit = input.limit ?? MAX_SERIES_OCCURRENCES;
  const [, y, mo, d] = start.map(Number);
  const time = input.startWallTime.slice(11);
  const [, uy, umo, ud] = until.map(Number);
  const untilMs = Date.UTC(uy, umo - 1, ud);
  const days = new Set(input.weekdays);
  const out: string[] = [];
  for (
    let cursor = Date.UTC(y, mo - 1, d);
    cursor <= untilMs && out.length <= limit;
    cursor += 86_400_000
  ) {
    const day = new Date(cursor);
    if (!days.has(day.getUTCDay())) continue;
    out.push(`${day.toISOString().slice(0, 10)}T${time}`);
  }
  return out;
}
