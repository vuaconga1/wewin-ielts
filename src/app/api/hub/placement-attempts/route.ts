import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { listHubPlacementAttempts } from "@/lib/hub/placement-attempts";
import { hubPlacementQuerySchema } from "@/lib/hub/placement-attempts-query";

export const runtime = "nodejs";

const NO_STORE = {
  "Cache-Control": "private, max-age=45",
};

/** AdminPanel BFF may call with Bearer WEWIN_HUB_API_KEY (same as Cambridge). */
function hasHubBearer(request: Request): boolean {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  if (!key || key.length < 16) return false;
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return false;
  const token = header.slice(7).trim();
  const a = Buffer.from(token);
  const b = Buffer.from(key);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const bearerOk = hasHubBearer(request);
  if (!bearerOk) {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { code: "LOGIN_REQUIRED" },
        { status: 401, headers: NO_STORE },
      );
    }
    if (!canAccessAdmin(user)) {
      return NextResponse.json(
        { code: "ADMIN_REQUIRED" },
        { status: 403, headers: NO_STORE },
      );
    }
  }

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = hubPlacementQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT", error: "Invalid query" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await listHubPlacementAttempts(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error("[hub/placement-attempts]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
