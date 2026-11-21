import "server-only";
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function getFastbotsWebhookSecret(): string | null {
  const secret = process.env.FASTBOTS_WEBHOOK_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

export function getFastbotsDashboardUrl(): string {
  return (
    process.env.FASTBOTS_DASHBOARD_URL?.trim() ||
    "https://app.fastbots.ai/"
  );
}

/** Accept Bearer token or X-Fastbots-Secret header. */
export function verifyFastbotsWebhookRequest(request: Request): boolean {
  const secret = getFastbotsWebhookSecret();
  if (!secret) return false;

  const auth = request.headers.get("authorization")?.trim() || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token && safeEqual(token, secret)) return true;
  }

  const headerSecret = request.headers.get("x-fastbots-secret")?.trim() || "";
  if (headerSecret && safeEqual(headerSecret, secret)) return true;

  return false;
}
