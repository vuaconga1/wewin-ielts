import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const CAMBRIDGE_SSO_TTL_MS = 90_000;

export type CambridgeSsoPayload = {
  attemptId: string;
  exp: number;
  nonce: string;
};

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function mintCambridgeSsoToken(
  attemptId: string,
  secret: string,
  now = Date.now(),
): string {
  const body: CambridgeSsoPayload = {
    attemptId,
    exp: now + CAMBRIDGE_SSO_TTL_MS,
    nonce: randomBytes(16).toString("hex"),
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyCambridgeSsoToken(
  token: string,
  attemptId: string,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token || token.length > 2048 || !secret) return false;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra) return false;
  if (!safeEqual(signPayload(payload, secret), sig)) return false;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CambridgeSsoPayload;
    if (parsed.attemptId !== attemptId) return false;
    if (!Number.isFinite(parsed.exp) || parsed.exp <= now) return false;
    if (parsed.exp > now + CAMBRIDGE_SSO_TTL_MS + 5_000) return false;
    return typeof parsed.nonce === "string" && parsed.nonce.length >= 8;
  } catch {
    return false;
  }
}

export function hubApiKeyOrNull(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

/** Cambridge site origin for SSO redirect (not the /api/hub/... path). */
export function cambridgePublicOrigin(): string {
  const dedicated = process.env.CAMBRIDGE_PUBLIC_SITE_URL?.trim().replace(
    /\/$/,
    "",
  );
  if (dedicated) return dedicated;
  const hub =
    process.env.CAMBRIDGE_HUB_URL?.trim() ||
    "https://cambridge-placement-test.vercel.app/api/hub/placement-attempts";
  try {
    return new URL(hub).origin;
  } catch {
    return "https://cambridge-placement-test.vercel.app";
  }
}
