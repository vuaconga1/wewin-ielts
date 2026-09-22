import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getMyRankSummary,
  getRanking,
  RANKING_REVALIDATE_SEC,
} from "@/lib/ranking";

export const runtime = "nodejs";

/**
 * GET /api/ranking?period=month|week|day|all&year=&month=&day=
 *      &me=1 → { rank, points } for the logged-in user only (sidebar).
 * Returns ranked list + currentUser entry when logged in (full board).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getSessionUser();
    const meOnly =
      searchParams.get("me") === "1" || searchParams.get("me") === "true";

    if (meOnly) {
      if (!user) {
        return NextResponse.json(
          { rank: null, points: 0 },
          {
            headers: {
              "Cache-Control": "private, max-age=30",
            },
          },
        );
      }
      const summary = await getMyRankSummary(
        user.id,
        searchParams.get("period") ?? "all",
      );
      return NextResponse.json(summary, {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        },
      });
    }

    const result = await getRanking({
      period: searchParams.get("period"),
      year: searchParams.get("year"),
      month: searchParams.get("month"),
      day: searchParams.get("day"),
      currentUserId: user?.id ?? null,
    });

    // Personalized when logged in — keep private. Guests get shared CDN cache.
    const cacheControl = user
      ? `private, max-age=${Math.min(30, RANKING_REVALIDATE_SEC)}`
      : `public, s-maxage=${RANKING_REVALIDATE_SEC}, stale-while-revalidate=300`;

    return NextResponse.json(result, {
      headers: { "Cache-Control": cacheControl },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
