import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  listAdminAttempts,
  normalizeAdminAttemptFilters,
} from "@/lib/admin/attempts";

export const runtime = "nodejs";

/**
 * GET /api/admin/attempts
 * Query: userId, userQ, skill, testQ, status, from, to, limit
 */
export async function GET(request: Request) {
  const denied = await requireAdminResponse(getSessionUser);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const filters = normalizeAdminAttemptFilters({
      userId: searchParams.get("userId") ?? undefined,
      userQ: searchParams.get("userQ") ?? undefined,
      skill: searchParams.get("skill") ?? undefined,
      testQ: searchParams.get("testQ") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await listAdminAttempts(filters);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
