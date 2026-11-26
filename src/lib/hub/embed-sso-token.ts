import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const EMBED_SSO_TTL_MS = 90_000;

export type EmbedSsoPayload = {
  product: string;
  exp: number;
  nonce: string;
  username: string;
  email: string | null;
  role: "ADMIN";
};

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function hubApiKeyOrNull(): string | null {
  const key = process.env.WEWIN_HUB_API_KEY?.trim();
  return key && key.length >= 16 ? key : null;
}

export function hubSsoUserId(username: string): string {
  const digest = createHash("sha256")
    .update(`hub-sso:${username}`)
    .digest("hex")
    .slice(0, 24);
  return `hub-sso-${digest}`;
}

export function verifyEmbedSsoToken(
  token: string,
  expectedProduct: string,
  secret: string,
  now = Date.now(),
): EmbedSsoPayload | null {
  if (!token || token.length > 4096 || !secret) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra) return null;
  if (!safeEqual(signPayload(payload, secret), sig)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as EmbedSsoPayload;
    if (parsed.product !== expectedProduct) return null;
    if (parsed.role !== "ADMIN") return null;
    if (!Number.isFinite(parsed.exp) || parsed.exp <= now) return null;
    if (parsed.exp > now + EMBED_SSO_TTL_MS + 5_000) return null;
    if (typeof parsed.nonce !== "string" || parsed.nonce.length < 8) return null;
    if (typeof parsed.username !== "string" || !parsed.username.trim()) {
      return null;
    }
    return {
      product: parsed.product,
      exp: parsed.exp,
      nonce: parsed.nonce,
      username: parsed.username.trim().slice(0, 80),
      email:
        typeof parsed.email === "string" && parsed.email.includes("@")
          ? parsed.email.trim().toLowerCase().slice(0, 254)
          : null,
      role: "ADMIN",
    };
  } catch {
    return null;
  }
}
