import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { deleteClassSession, updateClassSession } from "@/lib/classroom/manage";
import {
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";

export const runtime = "nodejs";

type Context = { params: Promise<{ sessionId: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { sessionId } = await context.params;
  try {
    await updateClassSession(auth.actor, sessionId, await request.json().catch(() => null));
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASS_SESSION_UPDATE",
      request,
      metadata: { liveSessionId: sessionId },
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "class-sessions");
  }
}

/** DELETE ?scope=series removes every session of the weekly schedule. */
export async function DELETE(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { sessionId } = await context.params;
  const scope = new URL(request.url).searchParams.get("scope") === "series" ? "series" : "one";
  try {
    const result = await deleteClassSession(auth.actor, sessionId, scope);
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASS_SESSION_DELETE",
      request,
      metadata: { liveSessionId: sessionId, scope, deleted: result.deleted },
    });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "class-sessions");
  }
}
