import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import {
  deleteClassAssignment,
  updateAssignmentDeadline,
} from "@/lib/classroom/homework";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; assignmentId: string }> };

/** PATCH { deadlineWallTime: "YYYY-MM-DDTHH:mm" } in the class timezone. Only the deadline is editable. */
export async function PATCH(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id, assignmentId } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const { classroom, before, item } = await updateAssignmentDeadline(auth.actor, id, assignmentId, body);
    await recordAuditEvent({
      actor: auth.actor,
      action: "HOMEWORK_DEADLINE_UPDATE",
      request,
      metadata: {
        classroomId: classroom.id,
        className: `${classroom.code} · ${classroom.name}`,
        assignmentId: item.id,
        testSlug: item.testSlug,
        testTitle: item.testTitle,
        partLabel: item.partLabel,
        previousDeadlineAt: before.deadlineAt,
        deadlineAt: item.deadlineAt,
      },
    });
    return NextResponse.json({ item }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-assignment");
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id, assignmentId } = await context.params;
  try {
    const { classroom, item } = await deleteClassAssignment(auth.actor, id, assignmentId);
    await recordAuditEvent({
      actor: auth.actor,
      action: "HOMEWORK_DELETE",
      request,
      metadata: {
        classroomId: classroom.id,
        className: `${classroom.code} · ${classroom.name}`,
        assignmentId: item.id,
        testSlug: item.testSlug,
        testTitle: item.testTitle,
        partLabel: item.partLabel,
        deadlineAt: item.deadlineAt,
      },
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-assignment");
  }
}
