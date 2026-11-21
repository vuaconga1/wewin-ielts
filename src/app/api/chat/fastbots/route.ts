import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit, requestClientIp } from "@/lib/classroom/rate-limit";
import {
  FastbotsPublicChatError,
  getFastbotsApiKey,
  sendFastbotsPublicChat,
} from "@/lib/fastbots/public-chat";
import { appendWidgetChatTurn } from "@/lib/fastbots/widget-store";
import { parseJsonBody } from "@/lib/validation/http";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

const bodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  chatId: z.string().trim().max(200).optional().nullable(),
});

export async function POST(request: Request) {
  if (!getFastbotsApiKey()) {
    return NextResponse.json(
      { code: "FASTBOTS_NOT_CONFIGURED" },
      { status: 503, headers: NO_STORE },
    );
  }

  const limit = await consumeRateLimit({
    scope: "chat:fastbots",
    identity: requestClientIp(request),
    limit: 30,
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
  const parsed = parseJsonBody(bodySchema, raw);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await sendFastbotsPublicChat({
      message: parsed.data.message,
      chatId: parsed.data.chatId,
    });

    await appendWidgetChatTurn({
      chatId: result.chatId,
      visitorText: parsed.data.message,
      botText: result.reply,
    });

    return NextResponse.json(
      { chatId: result.chatId, reply: result.reply },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof FastbotsPublicChatError) {
      return NextResponse.json(
        { code: error.code },
        { status: error.status, headers: NO_STORE },
      );
    }
    console.error("[api/chat/fastbots]", error);
    return NextResponse.json(
      { code: "SERVER_ERROR" },
      { status: 500, headers: NO_STORE },
    );
  }
}
