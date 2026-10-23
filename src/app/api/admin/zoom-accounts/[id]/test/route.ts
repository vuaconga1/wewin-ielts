import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/classroom/rate-limit";
import {
  jsonCode,
  manageErrorResponse,
  NO_STORE,
  requireClassStaff,
} from "@/lib/classroom/manage-http";
import { verifyZoomAccount } from "@/lib/zoom/accounts";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

/** POST — fetch an OAuth token + host ZAK to confirm credentials and scopes. */
export async function POST(_request: Request, context: Context) {
  const auth = await requireClassStaff(true);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const limit = await consumeRateLimit({
    scope: "zoom-account-test",
    identity: `${auth.actor.id}:${id}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (!limit.allowed) return jsonCode("RATE_LIMITED", 429);
  try {
    const result = await verifyZoomAccount(id);
    if (!result.ok) return jsonCode(result.code, 502, result.detail);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return manageErrorResponse(error, "zoom-account-test");
  }
}
