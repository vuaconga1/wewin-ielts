import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRanking } from "@/lib/ranking";

export const runtime = "nodejs";

/**
 * GET /api/ranking?period=month|week|day|all&year=&month=&day=
 * Returns ranked list + currentUser entry when logged in.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getSessionUser();

    const result = await getRanking({
      period: searchParams.get("period"),
      year: searchParams.get("year"),
      month: searchParams.get("month"),
      day: searchParams.get("day"),
      currentUserId: user?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
