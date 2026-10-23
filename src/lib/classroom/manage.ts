import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { AppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { syncClassroomFromClassCodes } from "@/lib/classroom/enrollment";
import {
  expandWeeklyWallTimes,
  isValidTimeZone,
  MAX_SERIES_OCCURRENCES,
  utcToZonedWallTime,
  zonedWallTimeToUtc,
} from "@/lib/classroom/schedule-time";
import { encryptClassroomSecret } from "@/lib/classroom/secret";
import {
  resolveZoomAccountById,
  resolveZoomAccountForCreate,
  ZoomAccountError,
} from "@/lib/zoom/accounts";
import { ZoomApiError } from "@/lib/zoom/host-auth";
import { zoomHostLinkFor } from "@/lib/zoom/teacher-host";
import {
  createZoomMeeting,
  deleteZoomMeeting,
  getZoomMeetingOccurrences,
  updateZoomMeeting,
} from "@/lib/zoom/meetings";

export type ClassActor = { id: string; role: AppRole };

export class ClassroomManageError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400,
    readonly detail?: string,
  ) {
    super(code);
  }
}

/** Zoom / account failures → stable codes the admin UI can translate. */
export function toManageError(error: unknown): ClassroomManageError | null {
  if (error instanceof ClassroomManageError) return error;
  if (error instanceof ZoomAccountError) {
    return new ClassroomManageError(error.code, error.status);
  }
  if (error instanceof ZoomApiError) {
    return new ClassroomManageError(error.code, 502, error.zoomMessage);
  }
  return null;
}

function isAdmin(actor: ClassActor) {
  return actor.role === "ADMIN";
}

function assertStaff(actor: ClassActor) {
  if (actor.role !== "ADMIN" && actor.role !== "TEACHER") {
    throw new ClassroomManageError("FORBIDDEN", 403);
  }
}

function assertAdmin(actor: ClassActor) {
  if (!isAdmin(actor)) throw new ClassroomManageError("FORBIDDEN", 403);
}

async function assertClassAccess(actor: ClassActor, classroomId: string) {
  assertStaff(actor);
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      ...(isAdmin(actor) ? {} : { teachers: { some: { userId: actor.id } } }),
    },
    select: {
      id: true,
      code: true,
      name: true,
      timezone: true,
      status: true,
      zoomAccountId: true,
    },
  });
  if (!classroom) throw new ClassroomManageError("NOT_FOUND", 404);
  return classroom;
}

// ---------- Classrooms ----------

export async function listManagedClassrooms(actor: ClassActor) {
  assertStaff(actor);
  const now = new Date();
  const rows = await prisma.classroom.findMany({
    where: isAdmin(actor) ? {} : { teachers: { some: { userId: actor.id } } },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      timezone: true,
      zoomAccount: { select: { name: true } },
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          teachers: true,
          liveSessions: {
            where: { scheduledStart: { gte: now }, status: { in: ["SCHEDULED", "LIVE"] } },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { code: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    timezone: row.timezone,
    zoomAccountName: row.zoomAccount?.name ?? null,
    studentCount: row._count.enrollments,
    teacherCount: row._count.teachers,
    upcomingCount: row._count.liveSessions,
  }));
}

export async function getManagedClassroom(actor: ClassActor, classroomId: string) {
  await assertClassAccess(actor, classroomId);
  const since = new Date(Date.now() - 30 * 86_400_000);
  const row = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      timezone: true,
      zoomAccountId: true,
      zoomAccount: { select: { name: true } },
      teachers: {
        select: {
          role: true,
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          user: {
            select: { id: true, username: true, fullName: true, classCode: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      liveSessions: {
        where: { scheduledStart: { gte: since } },
        select: {
          id: true,
          title: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          zoomMeetingId: true,
          zoomAccountId: true,
          zoomOccurrenceId: true,
          seriesId: true,
          host: { select: { id: true, username: true, fullName: true } },
          zoomAccount: { select: { name: true } },
        },
        orderBy: { scheduledStart: "asc" },
        take: 300,
      },
    },
  });
  if (!row) throw new ClassroomManageError("NOT_FOUND", 404);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    timezone: row.timezone,
    zoomAccountId: row.zoomAccountId,
    zoomAccountName: row.zoomAccount?.name ?? null,
    teachers: row.teachers.map((item) => ({ role: item.role, ...item.user })),
    students: row.enrollments.map((item) => item.user),
    sessions: row.liveSessions.map((session) => ({
      id: session.id,
      title: session.title,
      status: session.status,
      start: session.scheduledStart.toISOString(),
      startWallTime: utcToZonedWallTime(session.scheduledStart, row.timezone),
      durationMinutes: session.scheduledEnd
        ? Math.max(
            1,
            Math.round(
              (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60_000,
            ),
          )
        : 90,
      zoomMeetingId: session.zoomMeetingId,
      managed: Boolean(session.zoomAccountId),
      zoomAccountName: session.zoomAccount?.name ?? null,
      seriesId: session.seriesId,
      host: session.host,
    })),
  };
}

export type ManagedClassroomDetail = Awaited<ReturnType<typeof getManagedClassroom>>;

/** Candidates for the admin "add member" pickers. */
export async function listClassMemberCandidates() {
  const [teachers, students] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, username: true, fullName: true },
      orderBy: { username: "asc" },
      take: 500,
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, username: true, fullName: true, classCode: true },
      orderBy: { username: "asc" },
      take: 3000,
    }),
  ]);
  return { teachers, students };
}

const classCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{2,40}$/)
  .transform((value) => value.toUpperCase());

const classroomCreateSchema = z.object({
  code: classCodeSchema,
  name: z.string().trim().min(1).max(150),
  timezone: z.string().trim().refine(isValidTimeZone).default("Asia/Ho_Chi_Minh"),
  zoomAccountId: z.string().trim().min(1).nullable().optional(),
});

const classroomUpdateSchema = z.object({
  code: classCodeSchema.optional(),
  name: z.string().trim().min(1).max(150).optional(),
  timezone: z.string().trim().refine(isValidTimeZone).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  zoomAccountId: z.string().trim().min(1).nullable().optional(),
});

async function assertCodeFree(code: string, exceptId?: string) {
  const taken = await prisma.classroom.findFirst({
    where: {
      code: { equals: code, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (taken) throw new ClassroomManageError("CODE_TAKEN", 409);
}

async function assertZoomAccountExists(id: string | null | undefined) {
  if (!id) return;
  const found = await prisma.zoomAccount.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw new ClassroomManageError("ZOOM_ACCOUNT_NOT_FOUND", 404);
}

export async function createClassroom(actor: ClassActor, raw: unknown) {
  assertAdmin(actor);
  const parsed = classroomCreateSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const input = parsed.data;
  await assertCodeFree(input.code);
  await assertZoomAccountExists(input.zoomAccountId);
  const classroom = await prisma.classroom.create({
    data: {
      code: input.code,
      name: input.name,
      timezone: input.timezone,
      zoomAccountId: input.zoomAccountId ?? null,
    },
    select: { id: true, code: true },
  });
  const synced = await syncClassroomFromClassCodes(classroom.id);
  return { ...classroom, synced };
}

export async function updateClassroom(actor: ClassActor, classroomId: string, raw: unknown) {
  assertAdmin(actor);
  const parsed = classroomUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const input = parsed.data;
  await assertClassAccess(actor, classroomId);
  if (input.code) await assertCodeFree(input.code, classroomId);
  await assertZoomAccountExists(input.zoomAccountId);
  return prisma.classroom.update({
    where: { id: classroomId },
    data: {
      ...(input.code ? { code: input.code } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.timezone ? { timezone: input.timezone } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.zoomAccountId !== undefined ? { zoomAccountId: input.zoomAccountId } : {}),
    },
    select: { id: true, code: true },
  });
}

export async function syncClassroomMembers(actor: ClassActor, classroomId: string) {
  assertAdmin(actor);
  await assertClassAccess(actor, classroomId);
  return syncClassroomFromClassCodes(classroomId);
}

const memberSchema = z.object({
  kind: z.enum(["teacher", "student"]),
  userId: z.string().trim().min(1),
  role: z.enum(["HOST", "CO_HOST"]).optional(),
});

export async function addClassMember(actor: ClassActor, classroomId: string, raw: unknown) {
  assertAdmin(actor);
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const { kind, userId, role } = parsed.data;
  await assertClassAccess(actor, classroomId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) throw new ClassroomManageError("USER_NOT_FOUND", 404);
  if (kind === "teacher") {
    if (user.role !== "TEACHER") throw new ClassroomManageError("NOT_A_TEACHER");
    await prisma.classTeacher.upsert({
      where: { classroomId_userId: { classroomId, userId } },
      create: { classroomId, userId, role: role ?? "HOST" },
      update: { role: role ?? "HOST" },
    });
    return;
  }
  if (user.role !== "STUDENT" && user.role !== "VISITOR") {
    throw new ClassroomManageError("NOT_A_STUDENT");
  }
  await prisma.classEnrollment.upsert({
    where: { classroomId_userId: { classroomId, userId } },
    create: { classroomId, userId, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
}

export async function removeClassMember(actor: ClassActor, classroomId: string, raw: unknown) {
  assertAdmin(actor);
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const { kind, userId } = parsed.data;
  await assertClassAccess(actor, classroomId);
  if (kind === "teacher") {
    await prisma.classTeacher.deleteMany({ where: { classroomId, userId } });
    return;
  }
  // Keep the row as INACTIVE so classCode sync does not silently re-add the learner.
  await prisma.classEnrollment.updateMany({
    where: { classroomId, userId },
    data: { status: "INACTIVE" },
  });
}

// ---------- Sessions ----------

const wallTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

const sessionCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startWallTime: wallTime,
  durationMinutes: z.number().int().min(15).max(600),
  hostUserId: z.string().trim().min(1).nullable().optional(),
  zoomAccountId: z.string().trim().min(1).nullable().optional(),
  repeat: z
    .object({
      weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
      untilDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })
    .nullable()
    .optional(),
});

const sessionUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  startWallTime: wallTime.optional(),
  durationMinutes: z.number().int().min(15).max(600).optional(),
  hostUserId: z.string().trim().min(1).nullable().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "ENDED", "CANCELLED"]).optional(),
});

async function resolveSessionHost(
  actor: ClassActor,
  classroomId: string,
  requested: string | null | undefined,
): Promise<string | null> {
  if (requested) {
    const teacher = await prisma.classTeacher.findUnique({
      where: { classroomId_userId: { classroomId, userId: requested } },
      select: { role: true },
    });
    if (teacher?.role === "HOST") return requested;
    if (requested === actor.id && isAdmin(actor)) return requested;
    throw new ClassroomManageError("INVALID_HOST");
  }
  if (requested === null) return null;
  if (!isAdmin(actor)) return actor.id;
  const firstHost = await prisma.classTeacher.findFirst({
    where: { classroomId, role: "HOST" },
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  });
  return firstHost?.userId ?? null;
}

function newSeriesId() {
  return `ser_${randomBytes(12).toString("hex")}`;
}

export async function createClassSessions(
  actor: ClassActor,
  classroomId: string,
  raw: unknown,
) {
  const classroom = await assertClassAccess(actor, classroomId);
  if (classroom.status !== "ACTIVE") throw new ClassroomManageError("CLASS_ARCHIVED", 409);
  const parsed = sessionCreateSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const input = parsed.data;
  const tz = classroom.timezone;

  const firstStart = zonedWallTimeToUtc(input.startWallTime, tz);
  if (!firstStart) throw new ClassroomManageError("INVALID_START");
  if (firstStart.getTime() < Date.now() - 5 * 60_000) {
    throw new ClassroomManageError("START_IN_PAST");
  }

  let wallTimes = [input.startWallTime];
  let weekly: { weekdays: number[]; endDateTimeUtc: Date } | undefined;
  if (input.repeat) {
    wallTimes = expandWeeklyWallTimes({
      startWallTime: input.startWallTime,
      weekdays: input.repeat.weekdays,
      untilDate: input.repeat.untilDate,
    });
    if (!wallTimes.length) throw new ClassroomManageError("EMPTY_SERIES");
    if (wallTimes.length > MAX_SERIES_OCCURRENCES) {
      throw new ClassroomManageError("TOO_MANY_OCCURRENCES");
    }
    const endDateTimeUtc = zonedWallTimeToUtc(`${input.repeat.untilDate}T23:59`, tz);
    if (!endDateTimeUtc) throw new ClassroomManageError("INVALID_INPUT");
    weekly = { weekdays: input.repeat.weekdays, endDateTimeUtc };
  }

  const hostUserId = await resolveSessionHost(actor, classroomId, input.hostUserId);
  const explicitAccountId = isAdmin(actor) ? input.zoomAccountId : null;
  const hostLink = await zoomHostLinkFor(hostUserId);
  const zoom =
    hostLink && (!explicitAccountId || explicitAccountId === hostLink.zoomAccountId)
      ? {
          ...(await resolveZoomAccountById(hostLink.zoomAccountId)),
          hostUserId: hostLink.zoomUserId,
        }
      : await resolveZoomAccountForCreate(explicitAccountId || classroom.zoomAccountId);
  if (!zoom.oauth) throw new ClassroomManageError("ZOOM_ACCOUNT_REQUIRED", 409);

  const created = await createZoomMeeting(zoom.oauth, zoom.hostUserId, {
    topic: `${classroom.code} · ${input.title}`,
    startWallTime: wallTimes[0],
    timezone: tz,
    durationMinutes: input.durationMinutes,
    weekly,
  });

  try {
    let occurrences: { occurrenceId: string | null; start: Date; durationMinutes: number }[];
    if (weekly) {
      occurrences = created.occurrences.length
        ? created.occurrences
        : await getZoomMeetingOccurrences(zoom.oauth, created.meetingId, input.durationMinutes);
      if (!occurrences.length) throw new ClassroomManageError("ZOOM_API_FAILED", 502);
    } else {
      occurrences = [
        { occurrenceId: null, start: firstStart, durationMinutes: input.durationMinutes },
      ];
    }
    const seriesId = weekly ? newSeriesId() : null;
    const passcode = created.passcode ? encryptClassroomSecret(created.passcode) : null;
    await prisma.liveSession.createMany({
      data: occurrences.map((occurrence) => ({
        classroomId,
        hostUserId,
        title: input.title,
        scheduledStart: occurrence.start,
        scheduledEnd: new Date(occurrence.start.getTime() + occurrence.durationMinutes * 60_000),
        zoomMeetingId: created.meetingId,
        zoomHostUserId: zoom.hostUserId,
        zoomPasscodeCiphertext: passcode,
        zoomAccountId: zoom.id,
        zoomOccurrenceId: occurrence.occurrenceId,
        seriesId,
      })),
    });
    return { meetingId: created.meetingId, count: occurrences.length, seriesId };
  } catch (error) {
    await deleteZoomMeeting(zoom.oauth, created.meetingId).catch((cleanupError) =>
      console.error("[classroom] Could not roll back Zoom meeting", cleanupError),
    );
    throw error;
  }
}

async function loadSessionForManage(actor: ClassActor, sessionId: string) {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      classroomId: true,
      title: true,
      scheduledStart: true,
      scheduledEnd: true,
      zoomMeetingId: true,
      zoomAccountId: true,
      zoomOccurrenceId: true,
      seriesId: true,
    },
  });
  if (!session) throw new ClassroomManageError("NOT_FOUND", 404);
  const classroom = await assertClassAccess(actor, session.classroomId);
  return { session, classroom };
}

export async function updateClassSession(actor: ClassActor, sessionId: string, raw: unknown) {
  const parsed = sessionUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new ClassroomManageError("INVALID_INPUT");
  const input = parsed.data;
  const { session, classroom } = await loadSessionForManage(actor, sessionId);
  const tz = classroom.timezone;

  const currentDuration = session.scheduledEnd
    ? Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60_000)
    : 90;
  const start = input.startWallTime ? zonedWallTimeToUtc(input.startWallTime, tz) : session.scheduledStart;
  if (!start) throw new ClassroomManageError("INVALID_START");
  const duration = input.durationMinutes ?? currentDuration;
  const timeChanged =
    start.getTime() !== session.scheduledStart.getTime() || duration !== currentDuration;
  const titleChanged = input.title !== undefined && input.title !== session.title;
  if (input.startWallTime && timeChanged && start.getTime() < Date.now() - 5 * 60_000) {
    throw new ClassroomManageError("START_IN_PAST");
  }

  const hostUserId =
    input.hostUserId !== undefined
      ? await resolveSessionHost(actor, classroom.id, input.hostUserId)
      : undefined;

  if (session.zoomAccountId && (timeChanged || (titleChanged && !session.zoomOccurrenceId))) {
    const zoom = await resolveZoomAccountById(session.zoomAccountId);
    if (!zoom.oauth) throw new ClassroomManageError("ZOOM_ACCOUNT_REQUIRED", 409);
    await updateZoomMeeting(zoom.oauth, session.zoomMeetingId, {
      topic: titleChanged ? `${classroom.code} · ${input.title}` : undefined,
      startWallTime: timeChanged ? utcToZonedWallTime(start, tz) : undefined,
      durationMinutes: timeChanged ? duration : undefined,
      timezone: tz,
      occurrenceId: session.zoomOccurrenceId,
    });
  }

  await prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      ...(titleChanged ? { title: input.title } : {}),
      ...(timeChanged
        ? { scheduledStart: start, scheduledEnd: new Date(start.getTime() + duration * 60_000) }
        : {}),
      ...(hostUserId !== undefined ? { hostUserId } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  });
}

export async function deleteClassSession(
  actor: ClassActor,
  sessionId: string,
  scope: "one" | "series",
) {
  const { session } = await loadSessionForManage(actor, sessionId);
  const zoom = session.zoomAccountId
    ? await resolveZoomAccountById(session.zoomAccountId)
    : null;

  if (scope === "series" && session.seriesId) {
    if (zoom?.oauth) await deleteZoomMeeting(zoom.oauth, session.zoomMeetingId);
    const result = await prisma.liveSession.deleteMany({
      where: { seriesId: session.seriesId, classroomId: session.classroomId },
    });
    return { deleted: result.count };
  }

  if (zoom?.oauth) {
    const siblings = session.seriesId
      ? await prisma.liveSession.count({
          where: { seriesId: session.seriesId, id: { not: session.id } },
        })
      : 0;
    await deleteZoomMeeting(
      zoom.oauth,
      session.zoomMeetingId,
      siblings > 0 ? session.zoomOccurrenceId : null,
    );
  }
  await prisma.liveSession.delete({ where: { id: session.id } });
  return { deleted: 1 };
}
