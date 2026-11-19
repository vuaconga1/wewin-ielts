import { NextResponse } from "next/server";
import { z } from "zod";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import {
  cambridgePublicOrigin,
  hubApiKeyOrNull,
  mintCambridgeSsoToken,
} from "@/lib/hub/cambridge-sso-token";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const querySchema = z.object({
  attempt: z
    .string()
    .trim()
    .min(8)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

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
  const parsed = querySchema.safeParse({
    attempt: url.searchParams.get("attempt") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  const key = hubApiKeyOrNull();
  if (!key) {
    return NextResponse.json(
      { code: "CAMBRIDGE_HUB_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  const token = mintCambridgeSsoToken(parsed.data.attempt, key);
  const target = new URL("/api/hub/sso-consume", cambridgePublicOrigin());
  target.searchParams.set("token", token);
  target.searchParams.set("attempt", parsed.data.attempt);

  return NextResponse.redirect(target.toString(), {
    status: 302,
    headers: NO_STORE,
  });
}
