import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  AdminUsersError,
  deleteAdminUser,
  updateAdminUser,
  setAdminUserAccess,
} from "@/lib/admin/users";
import { recordAuditEvent } from "@/lib/audit-log";
import { updateAdminUserBodySchema } from "@/lib/validation/users";
import { parseJsonBody } from "@/lib/validation/http";

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
    if (!id?.trim()) {
      return NextResponse.json(
        { error: "Thiếu id tài khoản", code: "INVALID_INPUT" },
        { status: 400 },
      );
    }

    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(updateAdminUserBodySchema, raw);
    if (!parsed.ok) return parsed.response;

    const user = parsed.data.access
      ? await setAdminUserAccess(id, parsed.data.access)
      : await updateAdminUser(id, {
          username: parsed.data.username,
          role: parsed.data.role,
          password: parsed.data.password,
          fullName: parsed.data.fullName,
          classCode: parsed.data.classCode,
        });
    const actor = await getSessionUser();
    if (actor) {
      await recordAuditEvent({
        actor,
        action: parsed.data.access
          ? "USER_ACCESS_UPDATE"
          : parsed.data.password
            ? "USER_PASSWORD_RESET"
            : "USER_UPDATE",
        request,
        metadata: { targetUserId: id, targetUsername: user.username },
      });
    }
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
    if (actor) {
      await recordAuditEvent({
        actor,
        action: "USER_DELETE",
        request,
        metadata: { targetUserId: id },
      });
    }
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
