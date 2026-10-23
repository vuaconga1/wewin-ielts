import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { toManageError } from "@/lib/classroom/manage";
import { ZoomAccountError } from "@/lib/zoom/accounts";

export const NO_STORE = { "Cache-Control": "private, no-store" };

export function jsonCode(code: string, status: number, detail?: string) {
  return NextResponse.json(
    { code, ...(detail ? { detail } : {}) },
    { status, headers: NO_STORE },
  );
}

/** Logged-in ADMIN/TEACHER (open-admin guest bypass intentionally not allowed here). */
export async function requireClassStaff(
  adminOnly = false,
): Promise<{ actor: SessionUser } | { response: NextResponse }> {
  const actor = await getSessionUser();
  if (!actor) return { response: jsonCode("LOGIN_REQUIRED", 401) };
  const allowed = adminOnly
    ? actor.role === "ADMIN"
    : actor.role === "ADMIN" || actor.role === "TEACHER";
  if (!allowed) return { response: jsonCode("FORBIDDEN", 403) };
  return { actor };
}

export function manageErrorResponse(error: unknown, scope: string) {
  if (error instanceof ZoomAccountError) return jsonCode(error.code, error.status);
  const known = toManageError(error);
  if (known) return jsonCode(known.code, known.status, known.detail);
  console.error(`[${scope}]`, error);
  return jsonCode("SERVER_ERROR", 500);
}
