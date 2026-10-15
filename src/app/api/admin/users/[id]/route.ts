import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  AdminUsersError,
  deleteAdminUser,
  updateAdminUser,
  setAdminUserAccess,
} from "@/lib/admin/users";
import { recordAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/[id] — update username, role, optional password
 * DELETE /api/admin/users/[id] — delete user (not self)
 */
export async function PATCH(request: Request, ctx: Ctx) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      username?: string;
      role?: string;
      password?: string;
      fullName?: string | null;
      classCode?: string | null;
      access?: { months?: number; days?: number; expiresAt?: string; unlimited?: boolean };
    };
    const user = body.access ? await setAdminUserAccess(id, body.access) : await updateAdminUser(id, {
      username: body.username,
      role: body.role,
      password: body.password,
      fullName: body.fullName,
      classCode: body.classCode,
    });
    const actor = await getSessionUser();
    if (actor) await recordAuditEvent({
      actor,
      action: body.access ? "USER_ACCESS_UPDATE" : body.password ? "USER_PASSWORD_RESET" : "USER_UPDATE",
      request,
      metadata: { targetUserId: id, targetUsername: user.username },
    });
    return NextResponse.json({ user });
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

export async function DELETE(request: Request, ctx: Ctx) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const actor = await getSessionUser();
    await deleteAdminUser(id, actor?.id ?? null);
    if (actor) await recordAuditEvent({ actor, action: "USER_DELETE", request, metadata: { targetUserId: id } });
    return NextResponse.json({ ok: true });
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
