import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { invalidateClassProgress } from "@/lib/classroom/homework";
import {
  addClassMember,
  removeClassMember,
  syncClassroomMembers,
} from "@/lib/classroom/manage";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/**
 * POST { kind, userId, role? } — add teacher/student
 * POST { sync: true } — add everyone whose classCode lists this class
 * DELETE { kind, userId } — remove member
 */
export async function POST(request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (body?.sync === true) {
      const synced = await syncClassroomMembers(auth.actor, id);
      invalidateClassProgress(id);
      await recordAuditEvent({
        actor: auth.actor,
        action: "CLASSROOM_MEMBERS_UPDATE",
        request,
        metadata: { classroomId: id, sync: true, ...synced },
      });
      return NextResponse.json({ synced }, { headers: NO_STORE });
    }
    await addClassMember(auth.actor, id, body);
    invalidateClassProgress(id);
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASSROOM_MEMBERS_UPDATE",
      request,
      metadata: {
        classroomId: id,
        added: String(body?.userId ?? ""),
        kind: String(body?.kind ?? ""),
      },
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-members");
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    await removeClassMember(auth.actor, id, body);
    invalidateClassProgress(id);
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASSROOM_MEMBERS_UPDATE",
      request,
      metadata: {
        classroomId: id,
        removed: String(body?.userId ?? ""),
        kind: String(body?.kind ?? ""),
      },
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-members");
  }
}
