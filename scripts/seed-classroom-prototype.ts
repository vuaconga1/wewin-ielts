import "dotenv/config";
import { createHash } from "node:crypto";
import { encryptClassroomSecret } from "../src/lib/classroom/secret";
import { slideManifestSchema } from "../src/lib/classroom/types";
import { prisma } from "../src/lib/prisma";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function stableId(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function dateFromEnv(name: string, fallback: Date): Date {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) throw new Error(`${name} is not a valid date`);
  return value;
}

async function main() {
  const code = required("CLASSROOM_CODE");
  const teacherUsername = required("CLASSROOM_TEACHER_USERNAME");
  const meetingId = required("ZOOM_PROTOTYPE_MEETING_ID").replace(/\s|-/g, "");
  if (!/^\d{9,11}$/.test(meetingId)) {
    throw new Error("ZOOM_PROTOTYPE_MEETING_ID must contain 9-11 digits");
  }
  const teacher = await prisma.user.findUnique({
    where: { username: teacherUsername },
    select: { id: true, role: true },
  });
  if (!teacher || (teacher.role !== "TEACHER" && teacher.role !== "ADMIN")) {
    throw new Error("CLASSROOM_TEACHER_USERNAME must be a TEACHER or ADMIN");
  }

  const classroom = await prisma.classroom.upsert({
    where: { code },
    create: {
      code,
      name: process.env.CLASSROOM_NAME?.trim() || code,
    },
    update: {
      name: process.env.CLASSROOM_NAME?.trim() || code,
      status: "ACTIVE",
    },
  });
  if (teacher.role === "TEACHER") {
    await prisma.classTeacher.upsert({
      where: {
        classroomId_userId: { classroomId: classroom.id, userId: teacher.id },
      },
      create: { classroomId: classroom.id, userId: teacher.id, role: "HOST" },
      update: { role: "HOST" },
    });
  }

  const learners = await prisma.user.findMany({
    where: { role: { in: ["STUDENT", "VISITOR"] }, classCode: { not: null } },
    select: { id: true, classCode: true },
  });
  const enrolled = learners.filter((user) =>
    (user.classCode ?? "")
      .split(",")
      .map((item) => item.trim())
      .includes(code),
  );
  if (enrolled.length) {
    await prisma.classEnrollment.createMany({
      data: enrolled.map((user) => ({
        classroomId: classroom.id,
        userId: user.id,
        status: "ACTIVE" as const,
      })),
      skipDuplicates: true,
    });
  }

  const start = dateFromEnv("CLASSROOM_SESSION_START", new Date());
  const end = dateFromEnv(
    "CLASSROOM_SESSION_END",
    new Date(start.getTime() + 90 * 60_000),
  );
  const sessionId =
    process.env.CLASSROOM_SESSION_ID?.trim() ||
    stableId("live", `${classroom.id}:prototype`);
  const passcode = process.env.ZOOM_PROTOTYPE_MEETING_PASSCODE?.trim();
  const encryptedPasscode = passcode
    ? encryptClassroomSecret(passcode)
    : undefined;
  const liveSession = await prisma.liveSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      classroomId: classroom.id,
      hostUserId: teacher.id,
      title: process.env.CLASSROOM_SESSION_TITLE?.trim() || "IELTS live class",
      scheduledStart: start,
      scheduledEnd: end,
      zoomMeetingId: meetingId,
      zoomHostUserId: process.env.ZOOM_HOST_USER_ID?.trim() || null,
      zoomPasscodeCiphertext: encryptedPasscode ?? null,
    },
    update: {
      classroomId: classroom.id,
      hostUserId: teacher.id,
      title: process.env.CLASSROOM_SESSION_TITLE?.trim() || "IELTS live class",
      scheduledStart: start,
      scheduledEnd: end,
      status: "SCHEDULED",
      zoomMeetingId: meetingId,
      zoomHostUserId: process.env.ZOOM_HOST_USER_ID?.trim() || null,
      ...(encryptedPasscode
        ? { zoomPasscodeCiphertext: encryptedPasscode }
        : {}),
    },
  });

  let presentationId: string | null = null;
  const slidesJson = process.env.CLASSROOM_SLIDES_JSON?.trim();
  if (slidesJson) {
    const slides = slideManifestSchema.parse(JSON.parse(slidesJson));
    presentationId = stableId("prs", `${classroom.id}:prototype`);
    await prisma.presentation.upsert({
      where: { id: presentationId },
      create: {
        id: presentationId,
        classroomId: classroom.id,
        createdById: teacher.id,
        title: process.env.CLASSROOM_PRESENTATION_TITLE?.trim() || "WEWIN slides",
        slides,
        slideCount: slides.length,
      },
      update: {
        title: process.env.CLASSROOM_PRESENTATION_TITLE?.trim() || "WEWIN slides",
        slides,
        slideCount: slides.length,
      },
    });
  }
  await prisma.presentationState.upsert({
    where: { liveSessionId: liveSession.id },
    create: {
      liveSessionId: liveSession.id,
      presentationId,
      slideIndex: 0,
      version: 0,
      mode: presentationId ? "WEWIN_SLIDES" : "NONE",
      updatedById: teacher.id,
    },
    update: {
      presentationId,
      slideIndex: 0,
      version: { increment: 1 },
      mode: presentationId ? "WEWIN_SLIDES" : "NONE",
      updatedById: teacher.id,
    },
  });

  console.log(
    JSON.stringify(
      {
        classroomId: classroom.id,
        sessionId: liveSession.id,
        teacherId: teacher.id,
        enrolledLearners: enrolled.length,
        presentationId,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
