import { NextResponse } from "next/server";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-log";
import { fastbotsChatListQuerySchema } from "@/lib/fastbots/schemas";
import {
  listFastbotsConversations,
  upsertFastbotsWebhookPayload,
} from "@/lib/fastbots/store";
import { parseJsonBody } from "@/lib/validation/http";
import { z } from "zod";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const ingestBodySchema = z.object({
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .max(100),
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
  const parsed = fastbotsChatListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_INPUT" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const result = await listFastbotsConversations(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (error) {
    console.error("[admin/hub/fastbots-chats]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}

/** Admin-only manual ingest (until Fastbots list API / webhook is wired). */
export async function POST(request: Request) {
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

  const raw = await request.json().catch(() => null);
  const parsed = parseJsonBody(ingestBodySchema, raw);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await upsertFastbotsWebhookPayload(parsed.data.items);
    await recordAuditEvent({
      actor: user,
      action: "FASTBOTS_CHAT_INGEST",
      request,
      metadata: { upserted: result.upserted, skipped: result.skipped },
    });
    return NextResponse.json(
      { ok: true, ...result },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error("[admin/hub/fastbots-chats POST]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
