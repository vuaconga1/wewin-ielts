import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import { AdminUsersError, setAdminUserAccess } from "@/lib/admin/users";
import { recordAuditEvent } from "@/lib/audit-log";
import { bulkAccessBodySchema } from "@/lib/validation/users";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;
  try {
    const raw = await request.json().catch(() => null);
    const parsed = parseJsonBody(bulkAccessBodySchema, raw);
    if (!parsed.ok) return parsed.response;

    const userIds = [...new Set(parsed.data.userIds)].slice(0, 500);
    const users = [];
    for (const id of userIds) {
      users.push(await setAdminUserAccess(id, parsed.data.access));
    }
    const actor = await getSessionUser();
    if (actor) {
      await recordAuditEvent({
        actor,
        action: "USER_ACCESS_UPDATE",
        request,
        metadata: { count: users.length, bulk: true },
      });
    }
    return NextResponse.json({ users, updated: users.length });
  } catch (error) {
    if (error instanceof AdminUsersError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
