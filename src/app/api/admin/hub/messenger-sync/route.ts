import { NextResponse } from "next/server";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit-log";
import { isMessengerConfigured } from "@/lib/messenger/config";
import { MessengerGraphError } from "@/lib/messenger/graph";
import { syncMessengerConversations } from "@/lib/messenger/store";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

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

  if (!isMessengerConfigured()) {
    return NextResponse.json(
      { code: "MESSENGER_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const result = await syncMessengerConversations({ limit: 30 });
    await recordAuditEvent({
      actor: user,
      action: "FASTBOTS_CHAT_INGEST",
      request,
      metadata: { source: "messenger-sync", synced: result.synced },
    });
    return NextResponse.json(
      { ok: true, ...result },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof MessengerGraphError) {
      return NextResponse.json(
        { code: error.code, detail: error.message },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("[admin/hub/messenger-sync]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
