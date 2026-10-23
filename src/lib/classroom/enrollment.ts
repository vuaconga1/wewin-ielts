import { prisma } from "@/lib/prisma";

export function splitClassCodes(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Adds learners/teachers whose `User.classCode` lists this class. Never
 * re-activates rows a staff member deactivated on purpose.
 */
export async function syncClassroomFromClassCodes(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, code: true },
  });
  if (!classroom) return { students: 0, teachers: 0 };
  const code = classroom.code.trim().toUpperCase();
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["STUDENT", "VISITOR", "TEACHER"] },
      classCode: { contains: classroom.code.trim(), mode: "insensitive" },
    },
    select: { id: true, role: true, classCode: true },
  });
  const matched = users.filter((user) => splitClassCodes(user.classCode).includes(code));
  const learners = matched.filter((user) => user.role !== "TEACHER");
  const teachers = matched.filter((user) => user.role === "TEACHER");
  const [students, staff] = await Promise.all([
    learners.length
      ? prisma.classEnrollment.createMany({
          data: learners.map((user) => ({ classroomId, userId: user.id })),
          skipDuplicates: true,
        })
      : { count: 0 },
    teachers.length
      ? prisma.classTeacher.createMany({
          data: teachers.map((user) => ({ classroomId, userId: user.id })),
          skipDuplicates: true,
        })
      : { count: 0 },
  ]);
  return { students: students.count, teachers: staff.count };
}

/** After a user's classCode changes: join every existing classroom it lists. */
export async function syncUserClassEnrollments(user: {
  id: string;
  role: string;
  classCode: string | null;
}) {
  const codes = splitClassCodes(user.classCode);
  if (!codes.length || user.role === "ADMIN") return;
  const classrooms = await prisma.classroom.findMany({
    where: { OR: codes.map((code) => ({ code: { equals: code, mode: "insensitive" as const } })) },
    select: { id: true },
  });
  if (!classrooms.length) return;
  if (user.role === "TEACHER") {
    await prisma.classTeacher.createMany({
      data: classrooms.map((room) => ({ classroomId: room.id, userId: user.id })),
      skipDuplicates: true,
    });
    return;
  }
  await prisma.classEnrollment.createMany({
    data: classrooms.map((room) => ({ classroomId: room.id, userId: user.id })),
    skipDuplicates: true,
  });
}
