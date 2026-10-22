import { listAdminUsers, type AdminUserPublic } from "@/lib/admin/users";
import { isLearnerRole } from "@/lib/auth/permissions";
import { listAttempts, listTests, type StoredAttempt, type StoredTest } from "@/lib/store/test-store";

export type ReportSkill = "LISTENING" | "READING" | "WRITING" | "SPEAKING";
export type PartProgress = {
  key: string;
  label: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "WEAK";
  average: number | null;
  attempts: number;
};
export type SkillProgress = {
  skill: ReportSkill;
  completedParts: number;
  totalParts: number;
  average: number | null;
  weak: boolean;
  parts: PartProgress[];
};
export type UserReportRow = {
  user: AdminUserPublic;
  lastActivityAt: string | null;
  finishedAttempts: number;
  unfinishedAttempts: number;
  skills: SkillProgress[];
  weakSkills: ReportSkill[];
};

const SKILLS: ReportSkill[] = ["LISTENING", "READING", "WRITING", "SPEAKING"];

function partKeys(test: StoredTest, attempt?: StoredAttempt): Array<{ key: string; label: string }> {
  if (test.skill === "SPEAKING") {
    const kinds = attempt?.speakingPartKinds?.length ? attempt.speakingPartKinds : [1, 2, 3];
    return kinds.map((kind) => ({ key: `${test.slug}:speaking:${kind}`, label: `${test.title} · Part ${kind}` }));
  }
  const allowed = attempt ? new Set(attempt.sectionOrders) : null;
  return test.parts
    .filter((part) => !allowed || allowed.has(part.order))
    .map((part) => ({ key: `${test.slug}:${part.order}`, label: `${test.title} · ${part.title || `Part ${part.order}`}` }));
}

function metric(skill: ReportSkill, attempt: StoredAttempt): number | null {
  if (skill === "LISTENING" || skill === "READING") return attempt.score?.percent ?? null;
  return attempt.aiScore?.overallBand ?? null;
}

function averageLatestThree(values: Array<{ at: string; value: number }>): number | null {
  const latest = values.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3);
  if (!latest.length) return null;
  return Math.round((latest.reduce((sum, item) => sum + item.value, 0) / latest.length) * 10) / 10;
}

function isWeak(skill: ReportSkill, average: number | null): boolean {
  if (average == null) return false;
  return skill === "LISTENING" || skill === "READING" ? average < 50 : average < 5;
}

export async function buildAdminReports(): Promise<UserReportRow[]> {
  const [users, attempts, tests] = await Promise.all([listAdminUsers(), listAttempts(), listTests()]);
  const testBySlug = new Map(tests.map((test) => [test.slug, test]));
  const catalogBySkill = new Map<ReportSkill, Array<{ key: string; label: string }>>();
  for (const skill of SKILLS) catalogBySkill.set(skill, []);
  for (const test of tests) {
    if (!SKILLS.includes(test.skill as ReportSkill)) continue;
    catalogBySkill.get(test.skill as ReportSkill)!.push(...partKeys(test));
  }

  return users.filter((user) => isLearnerRole(user.role)).map((user) => {
    const userAttempts = attempts.filter((attempt) => attempt.userId === user.id);
    const skills = SKILLS.map((skill): SkillProgress => {
      const skillAttempts = userAttempts.filter((attempt) => testBySlug.get(attempt.testSlug)?.skill === skill);
      const values = skillAttempts.flatMap((attempt) => {
        const value = attempt.finishedAt ? metric(skill, attempt) : null;
        return value == null ? [] : [{ at: attempt.finishedAt!, value }];
      });
      const average = averageLatestThree(values);
      const parts = (catalogBySkill.get(skill) ?? []).map((part): PartProgress => {
        const related = skillAttempts.filter((attempt) => {
          const test = testBySlug.get(attempt.testSlug);
          return Boolean(test && partKeys(test, attempt).some((item) => item.key === part.key));
        });
        const partAverage = averageLatestThree(related.flatMap((attempt) => {
          const value = attempt.finishedAt ? metric(skill, attempt) : null;
          return value == null ? [] : [{ at: attempt.finishedAt!, value }];
        }));
        const finished = related.filter((attempt) => attempt.finishedAt).length;
        const status = finished
          ? isWeak(skill, partAverage) ? "WEAK" as const : "COMPLETED" as const
          : related.length ? "IN_PROGRESS" as const : "NOT_STARTED" as const;
        return { ...part, status, average: partAverage, attempts: finished };
      });
      return {
        skill,
        completedParts: parts.filter((part) => part.status === "COMPLETED" || part.status === "WEAK").length,
        totalParts: parts.length,
        average,
        weak: isWeak(skill, average),
        parts,
      };
    });
    return {
      user,
      lastActivityAt: userAttempts[0]?.updatedAt ?? userAttempts[0]?.startedAt ?? null,
      finishedAttempts: userAttempts.filter((attempt) => attempt.finishedAt).length,
      unfinishedAttempts: userAttempts.filter((attempt) => !attempt.finishedAt).length,
      skills,
      weakSkills: skills.filter((skill) => skill.weak).map((skill) => skill.skill),
    };
  });
}

export async function getAdminUserReport(userId: string) {
  return (await buildAdminReports()).find((row) => row.user.id === userId) ?? null;
}
