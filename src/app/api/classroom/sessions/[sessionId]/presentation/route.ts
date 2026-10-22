import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-log";
import { getClassroomAccess } from "@/lib/classroom/access";
import {
  currentPresentationState,
  PresentationConflictError,
  PresentationInputError,
  updatePresentationState,
} from "@/lib/classroom/presentation";
import { consumeRateLimit } from "@/lib/classroom/rate-limit";
import { publishPresentationState } from "@/lib/classroom/realtime";
import { presentationModeSchema } from "@/lib/classroom/types";

export const runtime = "nodejs";

type Context = { params: Promise<{ sessionId: string }> };
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" };

const updateSchema = z.object({
  mode: presentationModeSchema,
  presentationId: z.string().min(1).max(100).nullable(),
  slideIndex: z.number().int().min(0).max(499),
  expectedVersion: z.number().int().min(0),
});

async function authorizedAccess(context: Context) {
  const viewer = await getSessionUser();
  if (!viewer) return { error: "LOGIN_REQUIRED" as const, status: 401 };
  const { sessionId } = await context.params;
  const access = await getClassroomAccess(sessionId, viewer.id);
  if (!access) {
    return { error: "CLASSROOM_ACCESS_DENIED" as const, status: 403 };
  }
  return { viewer, sessionId, access };
}

export async function GET(_request: Request, context: Context) {
  const authorized = await authorizedAccess(context);
  if ("error" in authorized) {
    return NextResponse.json(
      { error: authorized.error },
      { status: authorized.status, headers: NO_STORE_HEADERS },
    );
  }
  const state = await currentPresentationState(authorized.access);
  return NextResponse.json(
    { state },
    { headers: NO_STORE_HEADERS },
  );
}

export async function PATCH(request: Request, context: Context) {
  const authorized = await authorizedAccess(context);
  if ("error" in authorized) {
    return NextResponse.json(
      { error: authorized.error },
      { status: authorized.status, headers: NO_STORE_HEADERS },
    );
  }
  if (!authorized.access.canControl) {
    return NextResponse.json(
      { error: "CONTROL_FORBIDDEN" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
  const limit = await consumeRateLimit({
    scope: "classroom-presentation",
    identity: `${authorized.viewer.id}:${authorized.sessionId}`,
    limit: 180,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_PRESENTATION_STATE" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }
  try {
    const state = await updatePresentationState({
      access: authorized.access,
      ...parsed.data,
    });
    await Promise.all([
      publishPresentationState(state),
      recordAuditEvent({
        actor: authorized.access.actor,
        action: "CLASSROOM_PRESENTATION_UPDATE",
        request,
        metadata: {
          liveSessionId: authorized.sessionId,
          classroomId: authorized.access.session.classroom.id,
          mode: state.mode,
          slideIndex: state.slideIndex,
          version: state.version,
        },
      }),
    ]);
    return NextResponse.json(
      { state },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof PresentationConflictError) {
      const state = await currentPresentationState(authorized.access);
      return NextResponse.json(
        { error: "VERSION_CONFLICT", state },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }
    if (error instanceof PresentationInputError) {
      return NextResponse.json(
        { error: "INVALID_PRESENTATION_STATE" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }
    console.error("[classroom-presentation] Could not update state", error);
    return NextResponse.json(
      { error: "UPDATE_FAILED" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
