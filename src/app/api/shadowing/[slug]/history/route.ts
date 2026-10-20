import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listShadowingHistory } from "@/lib/shadowing/store";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { slug } = await params;
    const user = await getSessionUser();
    const headers = { "Cache-Control": "private, no-store" };
    if (!user) return NextResponse.json({ signedIn: false, items: [] }, { headers });
    const items = await listShadowingHistory({ slug, userId: user.id });
    return NextResponse.json({ signedIn: true, items }, { headers });
  } catch (err) {
    return shadowingErrorResponse(err, "shadowing/history");
  }
}
