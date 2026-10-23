/**
 * STUDENT = learner in a class; VISITOR ("Khách") = registered account without a class.
 * A signed-out guest has no role at all (user === null).
 */
export type AppRole = "ADMIN" | "TEACHER" | "STUDENT" | "VISITOR";

/** Non-staff accounts (STUDENT or VISITOR) — subject to access-plan expiry. */
export function isLearnerRole(role: string | null | undefined): boolean {
  return role === "STUDENT" || role === "VISITOR";
}

/** IELTS grammar slide courses (3.0–4.0, 4.0–5.0): class members and staff only (not VISITOR, not signed-out guests). */
export function canViewIeltsGrammar(role: AppRole | null | undefined): boolean {
  return role === "ADMIN" || role === "TEACHER" || role === "STUDENT";
}

/** Learner role derived from class membership: class → STUDENT, no class → VISITOR. */
export function learnerRoleForClass(classCode: string | null | undefined): "STUDENT" | "VISITOR" {
  return (classCode ?? "").trim() ? "STUDENT" : "VISITOR";
}
