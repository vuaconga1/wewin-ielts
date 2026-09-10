/**
 * Client-safe ranking types and pure helpers (no Prisma / Node imports).
 */

export type RankingPeriod = "day" | "week" | "month" | "all";

export type RankingEntry = {
  rank: number;
  userId: string;
  username: string;
  initials: string;
  points: number;
  attemptCount: number;
};

export type RankingResult = {
  period: RankingPeriod;
  year: number;
  month: number;
  day: number;
  rangeStart: string | null;
  rangeEnd: string | null;
  updatedAt: string;
  entries: RankingEntry[];
  currentUser: RankingEntry | null;
};

function parseYmd(ymd: string): { year: number; month: number; day: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function addDaysYmd(ymd: string, delta: number): string {
  const { year, month, day } = parseYmd(ymd);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

/** Shift month navigator; returns { year, month }. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return {
    year: Math.floor(idx / 12),
    month: (idx % 12) + 1,
  };
}

/** Shift day / week anchor by delta days. */
export function shiftDay(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return parseYmd(addDaysYmd(ymd, delta));
}

export function formatPoints(n: number, locale = "vi-VN"): string {
  return new Intl.NumberFormat(locale).format(n);
}
