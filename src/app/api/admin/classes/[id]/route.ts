import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { getManagedClassroom, updateClassroom } from "@/lib/classroom/manage";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    return NextResponse.json(
      { classroom: await getManagedClassroom(auth.actor, id) },
      { headers: NO_STORE },
    );
  } catch (error) {
    return manageErrorResponse(error, "admin-classes");
  }
}

export async function PATCH(request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const classroom = await updateClassroom(auth.actor, id, await request.json().catch(() => null));
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASSROOM_UPDATE",
      request,
      metadata: { classroomId: id, code: classroom.code },
    });
    return NextResponse.json({ classroom }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-classes");
  }
}
