import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { createClassroom, listManagedClassrooms } from "@/lib/classroom/manage";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

/** GET — ADMIN: all classes, TEACHER: assigned classes. POST — ADMIN only. */
export async function GET() {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(
      { classes: await listManagedClassrooms(auth.actor) },
      { headers: NO_STORE },
    );
  } catch (error) {
    return manageErrorResponse(error, "admin-classes");
  }
}

export async function POST(request: Request) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  try {
    const classroom = await createClassroom(auth.actor, await request.json().catch(() => null));
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASSROOM_CREATE",
      request,
      metadata: { classroomId: classroom.id, code: classroom.code },
    });
    return NextResponse.json({ classroom }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-classes");
  }
}
