import { NextResponse } from "next/server";
import { consumeRateLimit, requestClientIp } from "@/lib/classroom/rate-limit";
import { fastbotsWebhookBodySchema } from "@/lib/fastbots/schemas";
import { upsertFastbotsWebhookPayload } from "@/lib/fastbots/store";
import {
  getFastbotsWebhookSecret,
  verifyFastbotsWebhookRequest,
} from "@/lib/fastbots/webhook-auth";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (!getFastbotsWebhookSecret()) {
    return NextResponse.json(
      { code: "WEBHOOK_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  if (!verifyFastbotsWebhookRequest(request)) {
    return NextResponse.json(
      { code: "UNAUTHORIZED" },
      { status: 401, headers: NO_STORE },
    );
  }

  const limit = await consumeRateLimit({
    scope: "webhook:fastbots",
    identity: requestClientIp(request),
    limit: 120,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );
  }

  const raw = await request.json().catch(() => null);
  const parsed = fastbotsWebhookBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await upsertFastbotsWebhookPayload(parsed.data);
    return NextResponse.json(
      { ok: true, ...result },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error("[webhooks/fastbots]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
