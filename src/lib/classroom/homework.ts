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
  exerciseType: true,
  exerciseId: true,
  sectionOrders: true,
  wholeTest: true,
  partLabel: true,
  questionCount: true,
  deadlineAt: true,
  createdAt: true,
} as const;

type AssignmentRow = {
  id: string;
  testId: string | null;
  testSlug: string;
  testTitle: string;
  skill: HomeworkSkill;
  exerciseType?: string | null;
  exerciseId?: string | null;
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
    testId: row.testId || row.exerciseId || row.testSlug,
    skill: row.skill,
    sectionOrders: row.sectionOrders?.length ? row.sectionOrders : [1],
    questionCount: row.questionCount,
    deadlineAt: row.deadlineAt,
    createdAt: row.createdAt,
  };
}

export function homeworkHref(row: { testSlug: string; wholeTest: boolean; sectionOrders: number[] }) {
  if (
    row.testSlug.startsWith("shadowing/") ||
    row.testSlug.startsWith("dictation/") ||
    row.testSlug.startsWith("fill-blank/") ||
    row.testSlug.startsWith("listen-answer/")
  ) {
    return `/learn/${row.testSlug}`;
  }
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
  const [tests, shadowing, dictation] = await Promise.all([
    listPublicTests(),
    prisma.shadowingExercise.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, level: true },
      orderBy: { order: "asc" },
    }),
    prisma.dictationExercise.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, slug: true, title: true, level: true, mode: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const testItems: HomeworkCatalogTest[] = tests.map((test) => ({
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
  }));

  const shadowingItems: HomeworkCatalogTest[] = shadowing.map((item) => ({
    slug: `shadowing/${item.slug}`,
    title: `${item.title}${item.level ? ` · ${item.level}` : ""}`,
    skill: "SPEAKING",
    examType: "SHADOWING",
    parts: [{ order: 1, title: "Luyện nói Shadowing", questionCount: 1 }],
  }));

  const dictationItems: HomeworkCatalogTest[] = dictation.map((item) => {
    let prefix = "dictation";
    let examType = "DICTATION";
    let label = "Nghe chép chính tả";
    if (item.mode === "FILL_BLANK") {
      prefix = "fill-blank";
      examType = "FILL_BLANK";
      label = "Nghe điền từ";
    } else if (item.mode === "QUESTION_ANSWER") {
      prefix = "listen-answer";
      examType = "LISTEN_ANSWER";
      label = "Nghe & trả lời";
    }
    return {
      slug: `${prefix}/${item.slug}`,
      title: `${item.title}${item.level ? ` · ${item.level}` : ""}`,
      skill: "LISTENING",
      examType,
      parts: [{ order: 1, title: label, questionCount: 1 }],
    };
  });

  return [
    ...testItems.sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true })),
    ...shadowingItems,
    ...dictationItems,
  ];
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
  const standardSlugs = slugs.filter((s) => !s.includes("/"));
  const skillSlugs = slugs.filter((s) => s.includes("/"));

  // Standard tests
  const tests = standardSlugs.length
    ? await prisma.test.findMany({
        where: { slug: { in: standardSlugs }, status: { not: "ARCHIVED" } },
        select: {
          id: true,
          slug: true,
          title: true,
          skill: true,
          sections: {
            select: {
              order: true,
              title: true,
              questionCount: true,
              _count: { select: { questions: true } },
            },
          },
        },
      })
    : [];
  const testBySlug = new Map(tests.map((test) => [test.slug, test]));

  // Shadowing exercises
  const shadowSlugs = skillSlugs
    .filter((s) => s.startsWith("shadowing/"))
    .map((s) => s.replace(/^shadowing\//, ""));
  const shadowExercises = shadowSlugs.length
    ? await prisma.shadowingExercise.findMany({
        where: { slug: { in: shadowSlugs } },
        select: { id: true, slug: true, title: true, level: true },
      })
    : [];
  const shadowBySlug = new Map(shadowExercises.map((e) => [e.slug, e]));

  // Dictation exercises
  const dictSlugs = skillSlugs
    .filter(
      (s) =>
        s.startsWith("dictation/") ||
        s.startsWith("fill-blank/") ||
        s.startsWith("listen-answer/"),
    )
    .map((s) => s.split("/")[1]);
  const dictExercises = dictSlugs.length
    ? await prisma.dictationExercise.findMany({
        where: { slug: { in: dictSlugs } },
        select: { id: true, slug: true, title: true, level: true, mode: true },
      })
    : [];
  const dictBySlug = new Map(dictExercises.map((e) => [e.slug, e]));

  const data = parsed.data.assignments.map((item) => {
    const deadlineAt = zonedWallTimeToUtc(item.deadlineWallTime, classroom.timezone);
    if (!deadlineAt) throw new ClassroomManageError("INVALID_DEADLINE");

    // Case 1: Shadowing
    if (item.testSlug.startsWith("shadowing/")) {
      const slug = item.testSlug.replace(/^shadowing\//, "");
      const ex = shadowBySlug.get(slug);
      if (!ex) throw new ClassroomManageError("TEST_NOT_FOUND", 404);
      return {
        classroomId,
        testId: null,
        exerciseType: "SHADOWING",
        exerciseId: ex.id,
        testSlug: item.testSlug,
        testTitle: ex.title,
        skill: "SPEAKING" as const,
        sectionOrders: [1],
        wholeTest: true,
        partLabel: ex.level ? `Shadowing (${ex.level})` : "Shadowing",
        questionCount: 1,
        deadlineAt,
        createdById: actor.id,
      };
    }

    // Case 2: Dictation / Fill Blank / Listen Answer
    if (
      item.testSlug.startsWith("dictation/") ||
      item.testSlug.startsWith("fill-blank/") ||
      item.testSlug.startsWith("listen-answer/")
    ) {
      const parts = item.testSlug.split("/");
      const prefix = parts[0];
      const slug = parts[1];
      const ex = dictBySlug.get(slug);
      if (!ex) throw new ClassroomManageError("TEST_NOT_FOUND", 404);
      const label =
        prefix === "dictation"
          ? "Chép chính tả"
          : prefix === "fill-blank"
            ? "Nghe điền từ"
            : "Nghe & trả lời";
      return {
        classroomId,
        testId: null,
        exerciseType: ex.mode,
        exerciseId: ex.id,
        testSlug: item.testSlug,
        testTitle: ex.title,
        skill: "LISTENING" as const,
        sectionOrders: [1],
        wholeTest: true,
        partLabel: ex.level ? `${label} (${ex.level})` : label,
        questionCount: 1,
        deadlineAt,
        createdById: actor.id,
      };
    }

    // Case 3: Standard test
    const test = testBySlug.get(item.testSlug);
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
    return {
      classroomId,
      testId: test.id,
      exerciseType: "TEST",
      exerciseId: null,
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

/** Fetch attempts across standard tests, shadowing, and dictation/fill-blank/listen-answer exercises. */
async function fetchHomeworkAttempts(
  userIds: string[],
  assignments: {
    testId: string | null;
    exerciseId?: string | null;
    exerciseType?: string | null;
    testSlug: string;
  }[],
  since: Date,
): Promise<HomeworkAttempt[]> {
  if (!userIds.length || !assignments.length) return [];

  const standardTestIds = [
    ...new Set(
      assignments.map((a) => a.testId).filter((id): id is string => Boolean(id)),
    ),
  ];

  const shadowingExerciseIds = [
    ...new Set(
      assignments
        .filter(
          (a) =>
            a.exerciseType === "SHADOWING" ||
            a.testSlug.startsWith("shadowing/"),
        )
        .map((a) => a.exerciseId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const dictationExerciseIds = [
    ...new Set(
      assignments
        .filter(
          (a) =>
            (a.exerciseType && a.exerciseType !== "SHADOWING") ||
            a.testSlug.startsWith("dictation/") ||
            a.testSlug.startsWith("fill-blank/") ||
            a.testSlug.startsWith("listen-answer/"),
        )
        .map((a) => a.exerciseId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let standardAttempts: HomeworkAttempt[] = [];
  if (standardTestIds.length) {
    const rows = await prisma.$queryRaw<RawAttemptRow[]>`
      SELECT "id", "userId", "testId", "sectionIds", "finishedAt", "scoreRaw", "scoreBand",
        ("payload"::jsonb #>> '{score,total}') AS "total",
        ("payload"::jsonb -> 'questionNumbers') AS "questionNumbers",
        ("payload"::jsonb -> 'speakingPartKinds') AS "speakingPartKinds"
      FROM "Attempt"
      WHERE "userId" = ANY(${userIds}::text[])
        AND "testId" = ANY(${standardTestIds}::text[])
        AND "finishedAt" IS NOT NULL
        AND "finishedAt" >= ${since}
      ORDER BY "finishedAt" ASC
      LIMIT 20000`;
    standardAttempts = rows.map((row) => {
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

  let shadowingAttempts: HomeworkAttempt[] = [];
  if (shadowingExerciseIds.length) {
    const rows = await prisma.shadowingAttempt.findMany({
      where: {
        userId: { in: userIds },
        exerciseId: { in: shadowingExerciseIds },
        createdAt: { gte: since },
      },
      select: {
        id: true,
        userId: true,
        exerciseId: true,
        score: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    shadowingAttempts = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      testId: row.exerciseId,
      sectionOrders: [1],
      finishedAt: row.createdAt,
      correct: row.score,
      total: 100,
      aiBand: null,
      partial: false,
      speakingPartKinds: null,
    }));
  }

  let dictationAttempts: HomeworkAttempt[] = [];
  if (dictationExerciseIds.length) {
    const rows = await prisma.dictationAttempt.findMany({
      where: {
        userId: { in: userIds },
        exerciseId: { in: dictationExerciseIds },
        completedAt: { not: null, gte: since },
      },
      select: {
        id: true,
        userId: true,
        exerciseId: true,
        score: true,
        totalWords: true,
        correctCount: true,
        completedAt: true,
        startedAt: true,
      },
      orderBy: { completedAt: "asc" },
    });
    dictationAttempts = rows.map((row) => ({
      id: row.id,
      userId: row.userId!,
      testId: row.exerciseId,
      sectionOrders: [1],
      finishedAt: row.completedAt || row.startedAt,
      correct: row.score ?? row.correctCount,
      total: row.totalWords ?? 100,
      aiBand: null,
      partial: false,
      speakingPartKinds: null,
    }));
  }

  return [...standardAttempts, ...shadowingAttempts, ...dictationAttempts];
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
    assignments,
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
    rows,
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
