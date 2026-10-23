import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit-log";
import {
  jsonCode,
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";
import { consumeRateLimit } from "@/lib/classroom/rate-limit";
import {
  clearMyZoomHost,
  getMyZoomHost,
  listZoomHostOptions,
  setMyZoomHost,
} from "@/lib/zoom/teacher-host";

export const runtime = "nodejs";

/** GET — current link + Zoom users the teacher may pick. */
export async function GET() {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  try {
    const [current, accounts] = await Promise.all([
      getMyZoomHost(auth.actor.id),
      listZoomHostOptions(auth.actor.id),
    ]);
    return NextResponse.json({ current, accounts }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-host");
  }
}

/** PUT — link the signed-in teacher to a Zoom user (verified against Zoom). */
export async function PUT(request: Request) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  const limit = await consumeRateLimit({
    scope: "zoom-host-set",
    identity: auth.actor.id,
    limit: 10,
    windowSeconds: 60,
  });
  if (!limit.allowed) return jsonCode("RATE_LIMITED", 429);
  try {
    const current = await setMyZoomHost(
      auth.actor.id,
      await request.json().catch(() => null),
    );
    await recordAuditEvent({
      actor: auth.actor,
      action: "ZOOM_HOST_LINK",
      request,
      metadata: {
        zoomAccountId: current?.zoomAccountId ?? null,
        zoomUserEmail: current?.zoomUserEmail ?? null,
      },
    });
    return NextResponse.json({ current }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-host");
  }
}

export async function DELETE(request: Request) {
  const auth = await requireClassStaff();
  if ("response" in auth) return auth.response;
  try {
    await clearMyZoomHost(auth.actor.id);
    await recordAuditEvent({ actor: auth.actor, action: "ZOOM_HOST_UNLINK", request });
    return NextResponse.json({ current: null }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-host");
  }
}
