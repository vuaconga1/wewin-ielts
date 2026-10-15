import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { AdminUsersError, setAdminUserAccess } from "@/lib/admin/users";
import { recordAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      userIds?: string[];
      access?: { months?: number; days?: number; expiresAt?: string; unlimited?: boolean };
    };
    const userIds = [...new Set(body.userIds ?? [])].filter(Boolean).slice(0, 500);
    if (!userIds.length || !body.access) {
      return NextResponse.json({ error: "Chưa chọn tài khoản hoặc thời hạn" }, { status: 400 });
    }
    const users = [];
    for (const id of userIds) users.push(await setAdminUserAccess(id, body.access));
    const actor = await getSessionUser();
    if (actor) await recordAuditEvent({ actor, action: "USER_ACCESS_UPDATE", request, metadata: { count: users.length, bulk: true } });
    return NextResponse.json({ users, updated: users.length });
  } catch (error) {
    if (error instanceof AdminUsersError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
