import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { listPublicTests } from "@/lib/store/test-store";
import { normalizeExamType } from "@/lib/tests/exam-type";
import {
  assertClassAccess,
  ClassroomManageError,
  type ClassActor,
} from "@/lib/classroom/manage";
import { zonedWallTimeToUtc } from "@/lib/classroom/schedule-time";
import {
  computeHomeworkProgress,
  csvRow,
  type HomeworkAssignmentRef,
  type HomeworkAttempt,
  type HomeworkSkill,
} from "@/lib/classroom/homework-core";

export const MAX_ASSIGNMENTS_PER_REQUEST = 20;
/** Overdue homework older than this drops out of the learner popup. */
const LEARNER_OVERDUE_WINDOW_MS = 30 * 86_400_000;
const PROGRESS_CACHE_SECONDS = 60;

const assignmentSelect = {
  id: true,
  testId: true,
  testSlug: true,
  testTitle: true,
  skill: true,
  sectionOrders: true,
  wholeTest: true,
  partLabel: true,
  questionCount: true,
  deadlineAt: true,
  createdAt: true,
} as const;

type AssignmentRow = {
  id: string;
  testId: string;
  testSlug: string;
  testTitle: string;
  skill: HomeworkSkill;
  sectionOrders: number[];
  wholeTest: boolean;
  partLabel: string | null;
  questionCount: number;
  deadlineAt: Date;
  createdAt: Date;
};

export type ClassAssignmentView = {
  id: string;
  testSlug: string;
  testTitle: string;
  skill: HomeworkSkill;
  wholeTest: boolean;
  partLabel: string | null;
  questionCount: number;
  deadlineAt: string;
  createdAt: string;
};

function toView(row: AssignmentRow): ClassAssignmentView {
  return {
    id: row.id,
    testSlug: row.testSlug,
    testTitle: row.testTitle,
    skill: row.skill,
    wholeTest: row.wholeTest,
    partLabel: row.partLabel,
    questionCount: row.questionCount,
    deadlineAt: row.deadlineAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toRef(row: AssignmentRow): HomeworkAssignmentRef {
  return {
    id: row.id,
    testId: row.testId,
    skill: row.skill,
    sectionOrders: row.sectionOrders,
    questionCount: row.questionCount,
    deadlineAt: row.deadlineAt,
    createdAt: row.createdAt,
  };
}

export function homeworkHref(row: { testSlug: string; wholeTest: boolean; sectionOrders: number[] }) {
  const base = `/tests/${encodeURIComponent(row.testSlug)}`;
  return row.wholeTest ? base : `${base}?parts=${row.sectionOrders.join(",")}`;
}

export function invalidateClassProgress(classroomId: string) {
  try {
    revalidateTag(`class-progress:${classroomId}`);
  } catch {
    /* outside request scope */
  }
}

// ---------- Catalog (assign picker) ----------

export type HomeworkCatalogTest = {
  slug: string;
  title: string;
  skill: HomeworkSkill;
  examType: string;
  parts: { order: number; title: string; questionCount: number }[];
};

export async function loadHomeworkCatalog(): Promise<HomeworkCatalogTest[]> {
  const tests = await listPublicTests();
  return tests
    .map((test) => ({
      slug: test.slug,
      title: test.title,
      skill: test.skill as HomeworkSkill,
      examType: normalizeExamType(test.examType),
      parts: [...test.parts]
        .sort((a, b) => a.order - b.order)
        .map((part) => ({
          order: part.order,
          title: part.title,
          questionCount: part.questions.length,
        })),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true }));
}

// ---------- CRUD ----------

const wallTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

const createSchema = z.object({
  assignments: z
    .array(
      z.object({
        testSlug: z.string().trim().min(1).max(200),
        /** Empty / omitted = whole test */
        sectionOrders: z.array(z.number().int().min(0)).max(20).optional(),
        deadlineWallTime: wallTime,
      }),
    )
    .min(1)
    .max(MAX_ASSIGNMENTS_PER_REQUEST),
});

const deadlineSchema = z.object({ deadlineWallTime: wallTime });

export async function listClassAssignments(actor: ClassActor, classroomId: string) {
  await assertClassAccess(actor, classroomId);
  const rows = await prisma.classAssignment.findMany({
    where: { classroomId },
    select: assignmentSelect,
    orderBy: [{ deadlineAt: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toView);
}

export async function createClassAssignments(actor: ClassActor, classroomId: string, raw: unknown) {
  const classroom = await assertClassAccess(actor, classroomId);
  if (classroom.status !== "ACTIVE") throw new ClassroomManageError("CLASS_ARCHIVED", 409);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");

  const slugs = [...new Set(parsed.data.assignments.map((item) => item.testSlug))];
  const tests = await prisma.test.findMany({
    where: { slug: { in: slugs }, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      slug: true,
      title: true,
      skill: true,
      sections: { select: { order: true, title: true, questionCount: true, _count: { select: { questions: true } } } },
    },
  });
  const bySlug = new Map(tests.map((test) => [test.slug, test]));

  const data = parsed.data.assignments.map((item) => {
    const test = bySlug.get(item.testSlug);
    if (!test) throw new ClassroomManageError("TEST_NOT_FOUND", 404);
    const sections = [...test.sections].sort((a, b) => a.order - b.order);
    if (!sections.length) throw new ClassroomManageError("TEST_NOT_FOUND", 404);
    const allOrders = sections.map((section) => section.order);
    const requested =
      test.skill === "SPEAKING" ? [] : [...new Set(item.sectionOrders ?? [])].sort((a, b) => a - b);
    if (requested.some((order) => !allOrders.includes(order))) {
      throw new ClassroomManageError("INVALID_PARTS");
    }
    const wholeTest = requested.length === 0 || requested.length === allOrders.length;
    const orders = wholeTest ? allOrders : requested;
    const picked = sections.filter((section) => orders.includes(section.order));
    const deadlineAt = zonedWallTimeToUtc(item.deadlineWallTime, classroom.timezone);
    if (!deadlineAt) throw new ClassroomManageError("INVALID_DEADLINE");
    return {
      classroomId,
      testId: test.id,
      testSlug: test.slug,
      testTitle: test.title,
      skill: test.skill,
      sectionOrders: orders,
      wholeTest,
      partLabel: wholeTest ? null : picked.map((section) => section.title).join(", "),
      questionCount: picked.reduce(
        (sum, section) => sum + (section._count.questions || section.questionCount),
        0,
      ),
      deadlineAt,
      createdById: actor.id,
    };
  });

  const created = await prisma.$transaction(
    data.map((row) => prisma.classAssignment.create({ data: row, select: assignmentSelect })),
  );
  invalidateClassProgress(classroomId);
  return { classroom, items: created.map(toView) };
}

async function loadOwnAssignment(classroomId: string, assignmentId: string) {
  const row = await prisma.classAssignment.findFirst({
    where: { id: assignmentId, classroomId },
    select: assignmentSelect,
  });
  if (!row) throw new ClassroomManageError("ASSIGNMENT_NOT_FOUND", 404);
  return row;
}

export async function updateAssignmentDeadline(
  actor: ClassActor,
  classroomId: string,
  assignmentId: string,
  raw: unknown,
) {
  const classroom = await assertClassAccess(actor, classroomId);
  const parsed = deadlineSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_DEADLINE");
  const deadlineAt = zonedWallTimeToUtc(parsed.data.deadlineWallTime, classroom.timezone);
  if (!deadlineAt) throw new ClassroomManageError("INVALID_DEADLINE");
  const before = await loadOwnAssignment(classroomId, assignmentId);
  const row = await prisma.classAssignment.update({
    where: { id: assignmentId },
    data: { deadlineAt },
    select: assignmentSelect,
  });
  invalidateClassProgress(classroomId);
  return { classroom, before: toView(before), item: toView(row) };
}

export async function deleteClassAssignment(actor: ClassActor, classroomId: string, assignmentId: string) {
  const classroom = await assertClassAccess(actor, classroomId);
  const row = await loadOwnAssignment(classroomId, assignmentId);
  await prisma.classAssignment.delete({ where: { id: assignmentId } });
  invalidateClassProgress(classroomId);
  return { classroom, item: toView(row) };
}

// ---------- Attempts → progress ----------

function numberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value.map(Number).filter((n) => Number.isFinite(n));
}

type RawAttemptRow = {
  id: string;
  userId: string;
  testId: string;
  sectionIds: unknown;
  finishedAt: Date | string;
  scoreRaw: number | null;
  scoreBand: number | null;
  total: string | null;
  questionNumbers: unknown;
  speakingPartKinds: unknown;
};

/** One query for every (learner × assigned test); payload JSON is read server-side only for the few fields needed. */
async function fetchHomeworkAttempts(
  userIds: string[],
  testIds: string[],
  since: Date,
): Promise<HomeworkAttempt[]> {
  if (!userIds.length || !testIds.length) return [];
  const rows = await prisma.$queryRaw<RawAttemptRow[]>`
    SELECT "id", "userId", "testId", "sectionIds", "finishedAt", "scoreRaw", "scoreBand",
      ("payload"::jsonb #>> '{score,total}') AS "total",
      ("payload"::jsonb -> 'questionNumbers') AS "questionNumbers",
      ("payload"::jsonb -> 'speakingPartKinds') AS "speakingPartKinds"
    FROM "Attempt"
    WHERE "userId" = ANY(${userIds}::text[])
      AND "testId" = ANY(${testIds}::text[])
      AND "finishedAt" IS NOT NULL
      AND "finishedAt" >= ${since}
    ORDER BY "finishedAt" ASC
    LIMIT 20000`;
  return rows.map((row) => {
    const total = row.total === null ? null : Number(row.total);
    const questionNumbers = numberArray(row.questionNumbers);
    return {
      id: row.id,
      userId: row.userId,
      testId: row.testId,
      sectionOrders: numberArray(row.sectionIds) ?? [],
      finishedAt: new Date(row.finishedAt),
      correct: row.scoreRaw,
      total: total !== null && Number.isFinite(total) ? total : null,
      aiBand: row.scoreBand,
      partial: Boolean(questionNumbers?.length),
      speakingPartKinds: numberArray(row.speakingPartKinds),
    };
  });
}

export type ProgressRow = {
  userId: string;
  name: string;
  username: string;
  status: "done" | "pending";
  correct: number | null;
  total: number | null;
  band: number | null;
  attemptCount: number;
  submittedAt: string | null;
  isLate: boolean | null;
  bestAttemptId: string | null;
};

export type ProgressAssignment = ClassAssignmentView & { rows: ProgressRow[] };

export type ClassProgress = {
  timezone: string;
  studentCount: number;
  assignments: ProgressAssignment[];
};

async function loadClassProgressUncached(classroomId: string): Promise<ClassProgress> {
  const [classroom, enrollments, assignments] = await Promise.all([
    prisma.classroom.findUnique({ where: { id: classroomId }, select: { timezone: true } }),
    prisma.classEnrollment.findMany({
      where: { classroomId, status: "ACTIVE" },
      select: { user: { select: { id: true, username: true, fullName: true } } },
    }),
    prisma.classAssignment.findMany({
      where: { classroomId },
      select: assignmentSelect,
      orderBy: [{ deadlineAt: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const students = enrollments
    .map(({ user }) => ({ ...user, name: user.fullName?.trim() || user.username }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const since = assignments.length
    ? new Date(Math.min(...assignments.map((row) => row.createdAt.getTime())))
    : new Date();
  const attempts = await fetchHomeworkAttempts(
    students.map((student) => student.id),
    [...new Set(assignments.map((row) => row.testId))],
    since,
  );
  const byUser = new Map<string, HomeworkAttempt[]>();
  for (const attempt of attempts) {
    const list = byUser.get(attempt.userId) ?? [];
    list.push(attempt);
    byUser.set(attempt.userId, list);
  }

  return {
    timezone: classroom?.timezone ?? "Asia/Ho_Chi_Minh",
    studentCount: students.length,
    assignments: assignments.map((row) => {
      const ref = toRef(row);
      return {
        ...toView(row),
        rows: students.map((student) => {
          const progress = computeHomeworkProgress(ref, byUser.get(student.id) ?? []);
          const base = { userId: student.id, name: student.name, username: student.username };
          if (progress.status === "pending") {
            return {
              ...base,
              status: "pending",
              correct: null,
              total: null,
              band: null,
              attemptCount: 0,
              submittedAt: null,
              isLate: null,
              bestAttemptId: null,
            } satisfies ProgressRow;
          }
          return {
            ...base,
            status: "done",
            correct: progress.correct,
            total: progress.total,
            band: progress.band,
            attemptCount: progress.attemptCount,
            submittedAt: progress.submittedAt.toISOString(),
            isLate: progress.isLate,
            bestAttemptId: progress.bestAttemptId,
          } satisfies ProgressRow;
        }),
      };
    }),
  };
}

/** Cached ~60 s; assignment/member changes drop the cache, new submissions show up within a minute. */
export async function loadClassProgress(actor: ClassActor, classroomId: string) {
  await assertClassAccess(actor, classroomId);
  return unstable_cache(
    () => loadClassProgressUncached(classroomId),
    ["class-progress-v1", classroomId],
    { revalidate: PROGRESS_CACHE_SECONDS, tags: [`class-progress:${classroomId}`] },
  )();
}

// ---------- CSV ----------

function formatInZone(iso: string | null, timeZone: string) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

export type CsvLabels = {
  headers: [string, string, string, string, string, string, string, string, string, string, string];
  done: string;
  pending: string;
  onTime: string;
  late: string;
  wholeTest: string;
};

export function buildProgressCsv(progress: ClassProgress, labels: CsvLabels): string {
  const lines = [csvRow(labels.headers)];
  for (const assignment of progress.assignments) {
    const deadline = formatInZone(assignment.deadlineAt, progress.timezone);
    for (const row of assignment.rows) {
      lines.push(
        csvRow([
          assignment.testTitle,
          assignment.partLabel ?? labels.wholeTest,
          deadline,
          row.name,
          row.username,
          row.status === "done" ? labels.done : labels.pending,
          row.correct !== null && row.total ? `${row.correct}/${row.total}` : "",
          row.band ?? "",
          row.attemptCount,
          formatInZone(row.submittedAt, progress.timezone),
          row.isLate === null ? "" : row.isLate ? labels.late : labels.onTime,
        ]),
      );
    }
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

// ---------- Learner popup ----------

export type IncompleteHomeworkItem = {
  assignmentId: string;
  classroomId: string;
  className: string;
  timezone: string;
  testTitle: string;
  partLabel: string | null;
  skill: HomeworkSkill;
  deadlineAt: string;
  isOverdue: boolean;
  isNew: boolean;
  href: string;
};

export async function listIncompleteHomework(userId: string): Promise<IncompleteHomeworkItem[]> {
  const now = Date.now();
  const rows = await prisma.classAssignment.findMany({
    where: {
      deadlineAt: { gte: new Date(now - LEARNER_OVERDUE_WINDOW_MS) },
      classroom: {
        status: "ACTIVE",
        enrollments: { some: { userId, status: "ACTIVE" } },
      },
    },
    select: {
      ...assignmentSelect,
      classroom: { select: { id: true, name: true, timezone: true } },
    },
    orderBy: { deadlineAt: "asc" },
    take: 200,
  });
  if (!rows.length) return [];

  const attempts = await fetchHomeworkAttempts(
    [userId],
    [...new Set(rows.map((row) => row.testId))],
    new Date(Math.min(...rows.map((row) => row.createdAt.getTime()))),
  );
  const items = rows
    .filter((row) => computeHomeworkProgress(toRef(row), attempts).status === "pending")
    .map((row) => ({
      assignmentId: row.id,
      classroomId: row.classroom.id,
      className: row.classroom.name,
      timezone: row.classroom.timezone,
      testTitle: row.testTitle,
      partLabel: row.partLabel,
      skill: row.skill,
      deadlineAt: row.deadlineAt.toISOString(),
      isOverdue: row.deadlineAt.getTime() < now,
      isNew: now - row.createdAt.getTime() < 86_400_000,
      href: homeworkHref(row),
    }));
  return [...items.filter((item) => item.isOverdue), ...items.filter((item) => !item.isOverdue)];
}
