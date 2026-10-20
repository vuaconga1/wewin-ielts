import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordSiteVisit } from "@/lib/site-visit";

export const runtime = "nodejs";

const VISITOR_ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function POST(request: Request) {
  let visitorId = "";
  try {
    const body = (await request.json()) as { visitorId?: unknown };
    if (typeof body.visitorId === "string") visitorId = body.visitorId;
  } catch {
    /* sendBeacon may deliver an empty/invalid body */
  }
  if (!VISITOR_ID.test(visitorId)) {
    return new NextResponse(null, { status: 204 });
  }

  const user = await getSessionUser().catch(() => null);
  await recordSiteVisit(visitorId, user?.id ?? null);
  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
