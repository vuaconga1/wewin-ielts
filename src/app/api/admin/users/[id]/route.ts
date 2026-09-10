import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  AdminUsersError,
  deleteAdminUser,
  updateAdminUser,
} from "@/lib/admin/users";

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
    };
    const user = await updateAdminUser(id, {
      username: body.username,
      role: body.role,
      password: body.password,
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

export async function DELETE(_request: Request, ctx: Ctx) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const { id } = await ctx.params;
    const actor = await getSessionUser();
    await deleteAdminUser(id, actor?.id ?? null);
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
