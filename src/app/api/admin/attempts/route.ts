import { NextResponse } from "next/server";
import { getSessionUser, requireStaffResponse } from "@/lib/auth";
import {
  listAdminAttempts,
  normalizeAdminAttemptFilters,
} from "@/lib/admin/attempts";

export const runtime = "nodejs";

/**
 * GET /api/admin/attempts
 * Query: userId, classId, skill, testSlug, status, from, to, limit
 */
export async function GET(request: Request) {
  const denied = await requireStaffResponse(getSessionUser);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const filters = normalizeAdminAttemptFilters({
      userId: searchParams.get("userId") ?? undefined,
      classId: searchParams.get("classId") ?? undefined,
      skill: searchParams.get("skill") ?? undefined,
      testSlug: searchParams.get("testSlug") ?? undefined,
      testQ: searchParams.get("testQ") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await listAdminAttempts(filters);
    // options=0: the viewer already has the user/test/class dropdowns.
    const body =
      searchParams.get("options") === "0"
        ? { attempts: result.attempts, total: result.total, source: result.source }
        : result;
    return NextResponse.json(body, {
      headers: {
        // Auth-scoped; short private cache softens remount storms in admin UI.
        "Cache-Control": "private, max-age=15, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
