import "server-only";
import { accessStatus } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { resolveClassroomPrivileges } from "./authorization";
import { parseSlideManifest, type ClassroomPresentation } from "./types";

export type ClassroomAccess = {
  actor: {
    id: string;
    username: string;
    fullName: string | null;
    email: string | null;
    role: "ADMIN" | "TEACHER" | "STUDENT" | "VISITOR";
  };
  session: {
    id: string;
    title: string;
    status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
    scheduledStart: Date;
    scheduledEnd: Date | null;
    classroom: { id: string; code: string; name: string; timezone: string };
    presentationState: {
      liveSessionId: string;
      presentationId: string | null;
      slideIndex: number;
      version: number;
      mode: "NONE" | "WEWIN_SLIDES" | "ZOOM_SCREEN_SHARE";
      updatedAt: Date;
    };
    presentations: ClassroomPresentation[];
  };
  canControl: boolean;
  canHost: boolean;
};

export async function getClassroomAccess(
  liveSessionId: string,
  userId: string,
): Promise<ClassroomAccess | null> {
  const [actor, liveSession] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        accessPlan: true,
        accessExpiresAt: true,
      },
    }),
    prisma.liveSession.findUnique({
      where: { id: liveSessionId },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        hostUserId: true,
        classroom: {
          select: {
            id: true,
            code: true,
            name: true,
            timezone: true,
            status: true,
            enrollments: {
              where: { userId, status: "ACTIVE" },
              select: { id: true },
              take: 1,
            },
            teachers: {
              where: { userId },
              select: { role: true },
              take: 1,
            },
            presentations: {
              select: { id: true, title: true, slides: true, slideCount: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        presentationState: {
          select: {
            liveSessionId: true,
            presentationId: true,
            slideIndex: true,
            version: true,
            mode: true,
            updatedAt: true,
          },
        },
        updatedAt: true,
      },
    }),
  ]);
  if (!actor || !liveSession || liveSession.classroom.status !== "ACTIVE") {
    return null;
  }

  const privileges = resolveClassroomPrivileges({
    actorId: actor.id,
    role: actor.role,
    learnerAccessExpired:
      accessStatus(actor.accessPlan, actor.accessExpiresAt) === "EXPIRED",
    enrolled: liveSession.classroom.enrollments.length > 0,
    teacherRole: liveSession.classroom.teachers[0]?.role ?? null,
    sessionHostUserId: liveSession.hostUserId,
  });
  if (!privileges.allowed) return null;
  const presentations = liveSession.classroom.presentations
    .map((presentation) => ({
      id: presentation.id,
      title: presentation.title,
      slides: parseSlideManifest(presentation.slides),
      slideCount: presentation.slideCount,
    }))
    .filter((presentation) => presentation.slides.length > 0);
  const state = liveSession.presentationState ?? {
    liveSessionId: liveSession.id,
    presentationId: presentations[0]?.id ?? null,
    slideIndex: 0,
    version: 0,
    mode: "NONE" as const,
    updatedAt: liveSession.updatedAt,
  };

  return {
    actor: {
      id: actor.id,
      username: actor.username,
      fullName: actor.fullName,
      email: actor.email,
      role: actor.role,
    },
    session: {
      id: liveSession.id,
      title: liveSession.title,
      status: liveSession.status,
      scheduledStart: liveSession.scheduledStart,
      scheduledEnd: liveSession.scheduledEnd,
      classroom: {
        id: liveSession.classroom.id,
        code: liveSession.classroom.code,
        name: liveSession.classroom.name,
        timezone: liveSession.classroom.timezone,
      },
      presentationState: state,
      presentations,
    },
    canControl: privileges.canControl,
    canHost: privileges.canHost,
  };
}

export async function listClassroomSessionsForUser(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      accessPlan: true,
      accessExpiresAt: true,
    },
  });
  if (!actor || actor.role === "VISITOR") return [];
  if (
    actor.role === "STUDENT" &&
    accessStatus(actor.accessPlan, actor.accessExpiresAt) === "EXPIRED"
  ) {
    return [];
  }

  const where =
    actor.role === "ADMIN"
      ? {}
      : actor.role === "TEACHER"
        ? { classroom: { teachers: { some: { userId } } } }
        : {
            classroom: {
              enrollments: { some: { userId, status: "ACTIVE" as const } },
            },
          };
  return prisma.liveSession.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      scheduledStart: true,
      scheduledEnd: true,
      classroom: { select: { code: true, name: true, timezone: true } },
    },
    orderBy: { scheduledStart: "desc" },
    take: 50,
  });
}
