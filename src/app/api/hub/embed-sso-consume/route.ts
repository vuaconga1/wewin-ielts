import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  hubApiKeyOrNull,
  hubSsoUserId,
  verifyEmbedSsoToken,
} from "@/lib/hub/embed-sso-token";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };
const PRODUCT = "ielts";
const ADMIN_LANDING = "/admin";

/**
 * Admin Panel iframe / new-tab SSO → IELTS admin.
 * Verifies short-lived hub token, sets wewin_session (ADMIN), redirects to /admin.
 */
export async function GET(request: Request) {
  const fail = new URL("/login?reason=admin", request.url);
  const key = hubApiKeyOrNull();
  if (!key) {
    return NextResponse.redirect(fail, { status: 302, headers: NO_STORE });
  }

  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim();
  const product = (url.searchParams.get("product") || PRODUCT).trim();
  if (product !== PRODUCT) {
    return NextResponse.redirect(fail, { status: 302, headers: NO_STORE });
  }

  const parsed = verifyEmbedSsoToken(token, PRODUCT, key);
  if (!parsed) {
    return NextResponse.redirect(fail, { status: 302, headers: NO_STORE });
  }

  await createSession({
    id: hubSsoUserId(parsed.username),
    email: parsed.email,
    username: parsed.username,
    fullName: null,
    role: "ADMIN",
  });

  const target = new URL(ADMIN_LANDING, request.url);
  return NextResponse.redirect(target.toString(), {
    status: 302,
    headers: NO_STORE,
  });
}
