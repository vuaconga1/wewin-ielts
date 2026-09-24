/**
 * Client-only daily challenge: "Learn 1 skill" (vocab/grammar hub card click).
 * Resets each calendar day in Asia/Ho_Chi_Minh — no DB / nav cost.
 */

const STORAGE_KEY = "wewin_daily_challenge_skill_v1";
const VN_TZ = "Asia/Ho_Chi_Minh";

function todayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isSkillChallengeDoneToday(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === todayKey();
  } catch {
    return false;
  }
}

export function markSkillChallengeDoneToday(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, todayKey());
  } catch {
    /* quota / private mode */
  }
}
