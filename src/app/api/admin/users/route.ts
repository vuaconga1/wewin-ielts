import { NextResponse } from "next/server";
import {
  getSessionUser,
  requireAdminResponse,
  requireStaffResponse,
} from "@/lib/auth";
import {
  AdminUsersError,
  createAdminUser,
  listAdminUsers,
} from "@/lib/admin/users";
import { recordAuditEvent } from "@/lib/audit-log";
import { createAdminUserBodySchema } from "@/lib/validation/users";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

/**
 * GET /api/admin/users — list users (no password hashes); ADMIN + TEACHER
 * POST /api/admin/users — create user; ADMIN only
 */
export async function GET() {
  const denied = await requireStaffResponse(getSessionUser);
  if (denied) return denied;

  try {
    const users = await listAdminUsers();
    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(createAdminUserBodySchema, raw);
    if (!parsed.ok) return parsed.response;

    const user = await createAdminUser({
      email: parsed.data.email,
      username: parsed.data.username,
      password: parsed.data.password,
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      classCode: parsed.data.classCode,
    });
    const actor = await getSessionUser();
    if (actor) {
      await recordAuditEvent({
        actor,
        action: "USER_CREATE",
        request,
        metadata: { targetUserId: user.id, targetUsername: user.username },
      });
    }
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof AdminUsersError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.status },
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
