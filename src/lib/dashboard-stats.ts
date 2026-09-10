import { practiceAttemptPath } from "@/lib/practice/paths";
import type { StoredAttempt, StoredTest } from "@/lib/store/test-store";

const VN_TZ = "Asia/Ho_Chi_Minh";

export const SKILL_ORDER = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
] as const;

export type IeltsSkill = (typeof SKILL_ORDER)[number];

export const SKILL_LABEL: Record<IeltsSkill, string> = {
  LISTENING: "Listening",
  READING: "Reading",
  WRITING: "Writing",
  SPEAKING: "Speaking",
};

export const SKILL_VI: Record<IeltsSkill, string> = {
  LISTENING: "Nghe",
  READING: "Đọc",
  WRITING: "Viết",
  SPEAKING: "Nói",
};

export function isIeltsSkill(value: string): value is IeltsSkill {
  return (SKILL_ORDER as readonly string[]).includes(value);
}

export function dateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function addDaysKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function mondayOffsetFromSunday(weekdaySun0: number): number {
  return weekdaySun0 === 0 ? 6 : weekdaySun0 - 1;
}

export function formatGreetingDate(
  now = new Date(),
  intlLocale = "vi-VN",
): string {
  const raw = new Intl.DateTimeFormat(intlLocale, {
    timeZone: VN_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export type GreetingKey = "morning" | "afternoon" | "evening";

export function greetingKey(now = new Date()): GreetingKey {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: VN_TZ,
      hour: "numeric",
      hour12: false,
    }).format(now),
  );
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** @deprecated Prefer greetingKey() + i18n */
export function greetingPhrase(now = new Date()): string {
  const key = greetingKey(now);
  if (key === "morning") return "Chào buổi sáng";
  if (key === "afternoon") return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function displayGivenName(username: string): string {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "bạn";
  const last = parts[parts.length - 1];
  if (last.includes("@")) return last.split("@")[0];
  return last;
}

export function initialsFromName(username: string): string {
  const parts = username
    .replace(/@.*$/, "")
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0] ?? "W").slice(0, 2).toUpperCase();
}

export function computeStreak(attempts: StoredAttempt[]): {
  days: number;
  weekActive: boolean[];
} {
  const keys = new Set(
    attempts.map((a) => dateKey(a.finishedAt ?? a.updatedAt ?? a.startedAt)),
  );

  const today = dateKey(new Date().toISOString());
  let cursor = keys.has(today) ? today : addDaysKey(today, -1);

  let days = 0;
  while (keys.has(cursor)) {
    days += 1;
    cursor = addDaysKey(cursor, -1);
  }

  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TZ,
    weekday: "short",
  }).format(new Date());
  const sun0 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekdayShort,
  );
  const mondayKey = addDaysKey(
    today,
    -mondayOffsetFromSunday(sun0 === -1 ? 1 : sun0),
  );
  const weekActive = Array.from({ length: 7 }, (_, i) =>
    keys.has(addDaysKey(mondayKey, i)),
  );

  return { days, weekActive };
}

export type HeroNext =
  | {
      kind: "resume";
      title: string;
      skill: IeltsSkill;
      minutes: number | null;
      href: string;
      eyebrow: string;
    }
  | {
      kind: "suggest";
      title: string;
      skill: IeltsSkill;
      minutes: number | null;
      href: string;
      eyebrow: string;
    }
  | { kind: "empty" };

export function pickHero(
  tests: StoredTest[],
  attempts: StoredAttempt[],
): HeroNext {
  const unfinished = attempts.find((a) => !a.finishedAt);
  if (unfinished) {
    const test = tests.find((t) => t.slug === unfinished.testSlug);
    const skill = isIeltsSkill(test?.skill ?? "")
      ? test!.skill
      : "LISTENING";
    return {
      kind: "resume",
      title: test?.title ?? unfinished.testSlug,
      skill,
      minutes: test?.timeLimitMinutes ?? unfinished.timeLimitMinutes,
      href: practiceAttemptPath(unfinished.testSlug, unfinished.id),
      /** i18n key: home.resumeEyebrow — kept for type compat */
      eyebrow: "resume",
    };
  }

  const finishedSlugs = new Set(
    attempts.filter((a) => a.finishedAt).map((a) => a.testSlug),
  );
  const ranked = [...tests].sort((a, b) => {
    const ai = SKILL_ORDER.indexOf(a.skill as IeltsSkill);
    const bi = SKILL_ORDER.indexOf(b.skill as IeltsSkill);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const next =
    ranked.find((t) => !finishedSlugs.has(t.slug)) ?? ranked[0] ?? null;
  if (!next || !isIeltsSkill(next.skill)) return { kind: "empty" };

  return {
    kind: "suggest",
    title: next.title,
    skill: next.skill,
    minutes: next.timeLimitMinutes ?? null,
    href: `/tests/${next.slug}`,
    /** i18n key: home.suggestEyebrow */
    eyebrow: "suggest",
  };
}

export type SkillStatus =
  | "proven"
  | "proficient"
  | "familiar"
  | "tried"
  | "none";

export function skillStatusLabel(status: SkillStatus): string {
  switch (status) {
    case "proven":
      return "Đã chứng minh";
    case "proficient":
      return "Thành thạo";
    case "familiar":
      return "Quen thuộc";
    case "tried":
      return "Đã thử";
    default:
      return "Chưa thử";
  }
}

export function computeSkillStatuses(
  tests: StoredTest[],
  attempts: StoredAttempt[],
): { skill: IeltsSkill; status: SkillStatus; testCount: number }[] {
  return SKILL_ORDER.map((skill) => {
    const testCount = tests.filter((t) => t.skill === skill).length;
    const related = attempts.filter((a) => {
      const t = tests.find((x) => x.slug === a.testSlug);
      return t?.skill === skill;
    });
    if (related.length === 0) return { skill, status: "none" as const, testCount };

    const scored = related.filter((a) => a.score && a.finishedAt);
    if (scored.length === 0) {
      return { skill, status: "tried" as const, testCount };
    }
    const avg =
      scored.reduce((s, a) => s + (a.score?.percent ?? 0), 0) / scored.length;
    let status: SkillStatus = "familiar";
    if (avg >= 80) status = "proven";
    else if (avg >= 65) status = "proficient";
    return { skill, status, testCount };
  });
}

export type PlanItem = {
  skill: IeltsSkill;
  title: string;
  minutes: number | null;
  href: string;
  state: "done" | "current" | "locked";
};

export function buildWeekPlan(
  tests: StoredTest[],
  attempts: StoredAttempt[],
): PlanItem[] {
  const planSkills: IeltsSkill[] = ["LISTENING", "READING", "WRITING"];
  const finishedBySkill = new Set(
    attempts
      .filter((a) => a.finishedAt)
      .map((a) => tests.find((t) => t.slug === a.testSlug)?.skill)
      .filter((s): s is IeltsSkill => !!s && isIeltsSkill(s)),
  );

  let currentAssigned = false;
  return planSkills.map((skill) => {
    const test = tests.find((t) => t.skill === skill);
    const done = finishedBySkill.has(skill);
    let state: PlanItem["state"] = "locked";
    if (done) state = "done";
    else if (test && !currentAssigned) {
      state = "current";
      currentAssigned = true;
    } else if (test && currentAssigned) {
      state = "locked";
    }

    return {
      skill,
      /** Display via i18n `home.planItem` in DashboardHome */
      title: SKILL_LABEL[skill],
      minutes: test?.timeLimitMinutes ?? null,
      href: test ? `/tests/${test.slug}` : `/tests?skill=${skill}`,
      state,
    };
  });
}

export function computeProgress(
  tests: StoredTest[],
  attempts: StoredAttempt[],
): {
  percent: number;
  finishedTests: number;
  totalTests: number;
  finishedAttempts: number;
  skillsTried: number;
  avgPercent: number | null;
} {
  const finished = attempts.filter((a) => a.finishedAt);
  const finishedSlugs = new Set(finished.map((a) => a.testSlug));
  const totalTests = tests.length;
  const finishedTests = [...finishedSlugs].filter((slug) =>
    tests.some((t) => t.slug === slug),
  ).length;
  const percent =
    totalTests === 0 ? 0 : Math.round((finishedTests / totalTests) * 100);

  const skillsTried = new Set(
    attempts
      .map((a) => tests.find((t) => t.slug === a.testSlug)?.skill)
      .filter(Boolean),
  ).size;

  const scored = finished.filter((a) => a.score);
  const avgPercent =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((s, a) => s + (a.score?.percent ?? 0), 0) /
            scored.length,
        );

  return {
    percent,
    finishedTests,
    totalTests,
    finishedAttempts: finished.length,
    skillsTried,
    avgPercent,
  };
}

export type RecommendedTest = {
  slug: string;
  title: string;
  skill: IeltsSkill;
  minutes: number | null;
};

/** Prefer unfinished skills / variety; fill up to `limit` from catalog. */
export function pickRecommendedTests(
  tests: StoredTest[],
  attempts: StoredAttempt[],
  limit = 4,
): RecommendedTest[] {
  const finishedSlugs = new Set(
    attempts.filter((a) => a.finishedAt).map((a) => a.testSlug),
  );
  const ranked = [...tests]
    .filter((t) => isIeltsSkill(t.skill))
    .sort((a, b) => {
      const aDone = finishedSlugs.has(a.slug) ? 1 : 0;
      const bDone = finishedSlugs.has(b.slug) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const ai = SKILL_ORDER.indexOf(a.skill as IeltsSkill);
      const bi = SKILL_ORDER.indexOf(b.skill as IeltsSkill);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const picked: RecommendedTest[] = [];
  const usedSkills = new Set<string>();
  for (const t of ranked) {
    if (picked.length >= limit) break;
    if (usedSkills.has(t.skill) && picked.length < Math.min(limit, SKILL_ORDER.length)) {
      continue;
    }
    usedSkills.add(t.skill);
    picked.push({
      slug: t.slug,
      title: t.title,
      skill: t.skill as IeltsSkill,
      minutes: t.timeLimitMinutes ?? null,
    });
  }
  if (picked.length < limit) {
    for (const t of ranked) {
      if (picked.length >= limit) break;
      if (picked.some((p) => p.slug === t.slug)) continue;
      picked.push({
        slug: t.slug,
        title: t.title,
        skill: t.skill as IeltsSkill,
        minutes: t.timeLimitMinutes ?? null,
      });
    }
  }
  return picked;
}
