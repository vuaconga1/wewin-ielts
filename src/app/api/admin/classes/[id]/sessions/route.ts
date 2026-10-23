import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import { createClassSessions } from "@/lib/classroom/manage";
import {
  jsonCode,
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";
import { consumeRateLimit } from "@/lib/classroom/rate-limit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** POST — create one session or a weekly series; WEWIN creates the Zoom meeting. */
export async function POST(request: Request, context: Context) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const limit = await consumeRateLimit({
    scope: "class-session-create",
    identity: auth.actor.id,
    limit: 20,
    windowSeconds: 60,
  });
  if (!limit.allowed) return jsonCode("RATE_LIMITED", 429);
  try {
    const result = await createClassSessions(
      auth.actor,
      id,
      await request.json().catch(() => null),
    );
    await recordAuditEvent({
      actor: auth.actor,
      action: "CLASS_SESSION_CREATE",
      request,
      metadata: {
        classroomId: id,
        meetingId: result.meetingId,
        count: result.count,
        seriesId: result.seriesId,
      },
    });
    return NextResponse.json(result, { status: 201, headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "class-sessions");
  }
}
