import { NextResponse } from "next/server";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { aggregatePlacementAttempts } from "@/lib/hub/aggregate-placement";
import { hubPlacementQuerySchema } from "@/lib/hub/placement-attempts-query";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const parsed = hubPlacementQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await aggregatePlacementAttempts(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error("[admin/hub/placement-attempts]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
