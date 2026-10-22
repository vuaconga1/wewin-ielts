export type ClassroomPrivileges = {
  allowed: boolean;
  canControl: boolean;
  canHost: boolean;
};

export function resolveClassroomPrivileges(input: {
  actorId: string;
  role: "ADMIN" | "TEACHER" | "STUDENT" | "VISITOR";
  learnerAccessExpired: boolean;
  enrolled: boolean;
  teacherRole: "HOST" | "CO_HOST" | null;
  sessionHostUserId: string | null;
}): ClassroomPrivileges {
  const isAdmin = input.role === "ADMIN";
  const isTeacher =
    input.role === "TEACHER" && input.teacherRole !== null;
  const isEnrolledStudent =
    input.role === "STUDENT" &&
    input.enrolled &&
    !input.learnerAccessExpired;
  const allowed = isAdmin || isTeacher || isEnrolledStudent;
  const canControl = allowed && (isAdmin || isTeacher);
  const canHost =
    allowed &&
    (isAdmin ||
      Boolean(
        isTeacher &&
          input.teacherRole === "HOST" &&
          (!input.sessionHostUserId ||
            input.sessionHostUserId === input.actorId),
      ));
  return { allowed, canControl, canHost };
}
