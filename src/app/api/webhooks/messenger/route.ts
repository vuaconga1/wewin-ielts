import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { consumeRateLimit, requestClientIp } from "@/lib/classroom/rate-limit";
import { getMessengerConfig } from "@/lib/messenger/config";
import { appendMessengerWebhookMessage } from "@/lib/messenger/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** Meta webhook verification handshake. */
export async function GET(request: Request) {
  const config = getMessengerConfig();
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    challenge &&
    config?.verifyToken &&
    token === config.verifyToken
  ) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain", ...NO_STORE },
    });
  }

  return NextResponse.json(
    { code: "FORBIDDEN" },
    { status: 403, headers: NO_STORE },
  );
}

function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
};

/** Receive Messenger message events from Meta. */
export async function POST(request: Request) {
  const config = getMessengerConfig();
  if (!config) {
    return NextResponse.json(
      { code: "MESSENGER_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  const limit = await consumeRateLimit({
    scope: "webhook:messenger",
    identity: requestClientIp(request),
    limit: 300,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      { status: 429, headers: NO_STORE },
    );
  }

  const rawBody = await request.text();
  if (config.appSecret) {
    const sig = request.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBody, sig, config.appSecret)) {
      return NextResponse.json(
        { code: "UNAUTHORIZED" },
        { status: 401, headers: NO_STORE },
      );
    }
  }

  let payload: {
    object?: string;
    entry?: Array<{ messaging?: MessagingEvent[] }>;
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  if (payload.object !== "page") {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }

  for (const entry of payload.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const text = event.message?.text?.trim();
      if (!text) continue;
      const senderId = event.sender?.id;
      if (!senderId) continue;
      try {
        await appendMessengerWebhookMessage({
          senderId,
          text,
          mid: event.message?.mid ?? null,
          timestampMs: event.timestamp ?? null,
          isEcho: Boolean(event.message?.is_echo),
        });
      } catch (error) {
        console.error("[webhooks/messenger] persist", error);
      }
    }
  }

  // Meta expects a quick 200
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
