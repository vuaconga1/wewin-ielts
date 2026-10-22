import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getClassroomAccess } from "@/lib/classroom/access";
import { consumeRateLimit } from "@/lib/classroom/rate-limit";
import {
  createClassroomTokenRequest,
  isClassroomRealtimeConfigured,
} from "@/lib/classroom/realtime";

export const runtime = "nodejs";

type Context = { params: Promise<{ sessionId: string }> };

function jsonError(code: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { error: code },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
      },
    },
  );
}

export async function POST(_request: Request, context: Context) {
  const viewer = await getSessionUser();
  if (!viewer) return jsonError("LOGIN_REQUIRED", 401);
  const { sessionId } = await context.params;
  const limit = await consumeRateLimit({
    scope: "classroom-realtime-token",
    identity: `${viewer.id}:${sessionId}`,
    limit: 20,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return jsonError("RATE_LIMITED", 429, limit.retryAfterSeconds);
  }
  const access = await getClassroomAccess(sessionId, viewer.id);
  if (!access) {
    return jsonError("CLASSROOM_ACCESS_DENIED", 403);
  }
  if (!isClassroomRealtimeConfigured()) {
    return jsonError("REALTIME_NOT_CONFIGURED", 503);
  }
  const tokenRequest = await createClassroomTokenRequest({
    liveSessionId: sessionId,
    userId: viewer.id,
  });
  return NextResponse.json(tokenRequest, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
