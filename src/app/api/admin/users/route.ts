import { NextResponse } from "next/server";
import { getSessionUser, requireAdminResponse } from "@/lib/auth";
import {
  AdminUsersError,
  createAdminUser,
  listAdminUsers,
} from "@/lib/admin/users";

export const runtime = "nodejs";

/**
 * GET /api/admin/users — list users (no password hashes)
 * POST /api/admin/users — create user
 */
export async function GET() {
  const denied = await requireAdminResponse(getSessionUser);
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
    const body = (await request.json()) as {
      email?: string;
      username?: string;
      password?: string;
      role?: string;
    };
    const user = await createAdminUser({
      email: body.email ?? "",
      username: body.username ?? "",
      password: body.password ?? "",
      role: body.role ?? "STUDENT",
    });
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
