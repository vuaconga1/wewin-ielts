import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getShadowingAttempt } from "@/lib/shadowing/store";
import { shadowingErrorResponse } from "@/lib/shadowing/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ attemptId: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { attemptId } = await params;
    const user = await getSessionUser();
    const result = await getShadowingAttempt(attemptId, user);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    return shadowingErrorResponse(err, "shadowing/attempt");
  }
}
