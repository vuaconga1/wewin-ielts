import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-log";
import { getClassroomAccess } from "@/lib/classroom/access";
import {
  consumeRateLimit,
  requestClientIp,
} from "@/lib/classroom/rate-limit";
import { decryptClassroomSecret } from "@/lib/classroom/secret";
import { prisma } from "@/lib/prisma";
import { getZoomHostZak, isZoomHostAuthConfigured } from "@/lib/zoom/host-auth";
import {
  createMeetingSdkSignature,
  isMeetingSdkConfigured,
  normalizeZoomMeetingNumber,
  zoomMeetingSdkKey,
} from "@/lib/zoom/sdk-signature";

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

export async function POST(request: Request, context: Context) {
  const viewer = await getSessionUser();
  if (!viewer) return jsonError("LOGIN_REQUIRED", 401);

  const { sessionId } = await context.params;
  const [userLimit, ipLimit] = await Promise.all([
    consumeRateLimit({
      scope: "classroom-join-user",
      identity: `${viewer.id}:${sessionId}`,
      limit: 12,
      windowSeconds: 60,
    }),
    consumeRateLimit({
      scope: "classroom-join-ip",
      identity: `${requestClientIp(request)}:${sessionId}`,
      limit: 40,
      windowSeconds: 60,
    }),
  ]);
  if (!userLimit.allowed || !ipLimit.allowed) {
    return jsonError(
      "RATE_LIMITED",
      429,
      Math.max(userLimit.retryAfterSeconds, ipLimit.retryAfterSeconds),
    );
  }

  const access = await getClassroomAccess(sessionId, viewer.id);
  if (!access) return jsonError("CLASSROOM_ACCESS_DENIED", 403);
  if (access.session.status === "CANCELLED" || access.session.status === "ENDED") {
    return jsonError("SESSION_NOT_JOINABLE", 409);
  }
  if (!isMeetingSdkConfigured()) {
    return jsonError("ZOOM_NOT_CONFIGURED", 503);
  }

  const meeting = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      zoomMeetingId: true,
      zoomHostUserId: true,
      zoomPasscodeCiphertext: true,
    },
  });
  if (!meeting) return jsonError("SESSION_NOT_FOUND", 404);

  try {
    const role: 0 | 1 = access.canHost ? 1 : 0;
    if (role === 1 && !isZoomHostAuthConfigured()) {
      return jsonError("ZOOM_HOST_AUTH_NOT_CONFIGURED", 503);
    }
    const meetingNumber = normalizeZoomMeetingNumber(meeting.zoomMeetingId);
    const signature = createMeetingSdkSignature({ meetingNumber, role });
    const zak =
      role === 1
        ? await getZoomHostZak(meeting.zoomHostUserId ?? undefined)
        : undefined;
    const password = decryptClassroomSecret(meeting.zoomPasscodeCiphertext);

    await recordAuditEvent({
      actor: access.actor,
      action: role === 1 ? "CLASSROOM_HOST_START" : "CLASSROOM_JOIN",
      request,
      metadata: {
        liveSessionId: sessionId,
        classroomId: access.session.classroom.id,
        meetingId: meetingNumber,
      },
    });

    return NextResponse.json(
      {
        sdkKey: zoomMeetingSdkKey(),
        signature,
        meetingNumber,
        password,
        userName:
          access.actor.fullName?.trim() || access.actor.username,
        userEmail: access.actor.email ?? "",
        role,
        ...(zak ? { zak } : {}),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[classroom-join] Could not create join payload", error);
    return jsonError("ZOOM_JOIN_PREPARATION_FAILED", 502);
  }
}
