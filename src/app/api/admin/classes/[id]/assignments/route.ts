import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import {
  createClassAssignments,
  listClassAssignments,
} from "@/lib/classroom/homework";
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
    const items = await listClassAssignments(auth.actor, id);
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-assignments");
  }
}

/** POST { assignments: [{ testSlug, sectionOrders?, deadlineWallTime }] } — all-or-nothing. */
export async function POST(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  try {
    const body = await request.json().catch(() => null);
    const { classroom, items } = await createClassAssignments(auth.actor, id, body);
    await Promise.all(
      items.map((item) =>
        recordAuditEvent({
          actor: auth.actor,
          action: "HOMEWORK_ASSIGN",
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
        }),
      ),
    );
    return NextResponse.json({ items }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "admin-class-assignments");
  }
}
