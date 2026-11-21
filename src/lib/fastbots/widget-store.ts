import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FastbotsMessage } from "@/lib/fastbots/normalize";

type StoredEnvelope = {
  source: "wewin-widget";
  data: {
    id: string;
    name: string;
    channel: "WEB";
    status: "open";
    conversations: Array<{
      channel: "WEB";
      messages: Array<{
        role: string;
        text: string;
        createdAt: string;
      }>;
    }>;
  };
};

function asEnvelope(raw: unknown, chatId: string): StoredEnvelope {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const root = raw as Record<string, unknown>;
    const data = root.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d = data as Record<string, unknown>;
      const conversations = Array.isArray(d.conversations)
        ? d.conversations
        : [];
      const first = conversations[0];
      if (first && typeof first === "object" && !Array.isArray(first)) {
        const msgs = Array.isArray((first as { messages?: unknown }).messages)
          ? ((first as { messages: unknown[] }).messages as Array<{
              role?: string;
              text?: string;
              createdAt?: string;
            }>)
          : [];
        return {
          source: "wewin-widget",
          data: {
            id: chatId,
            name:
              typeof d.name === "string" && d.name.trim()
                ? d.name.trim()
                : "Website visitor",
            channel: "WEB",
            status: "open",
            conversations: [
              {
                channel: "WEB",
                messages: msgs
                  .filter((m) => typeof m.text === "string" && m.text.trim())
                  .map((m) => ({
                    role: String(m.role || "unknown"),
                    text: String(m.text).slice(0, 4000),
                    createdAt:
                      typeof m.createdAt === "string"
                        ? m.createdAt
                        : new Date().toISOString(),
                  })),
              },
            ],
          },
        };
      }
    }
  }

  return {
    source: "wewin-widget",
    data: {
      id: chatId,
      name: "Website visitor",
      channel: "WEB",
      status: "open",
      conversations: [{ channel: "WEB", messages: [] }],
    },
  };
}

/** Append visitor + bot turns for a widget chatId (also listed on admin hub). */
export async function appendWidgetChatTurn(input: {
  chatId: string;
  visitorText: string;
  botText: string;
}): Promise<void> {
  const nowVisitor = new Date().toISOString();
  const nowBot = new Date().toISOString();
  const existing = await prisma.fastbotsConversation.findUnique({
    where: { externalId: input.chatId },
    select: { rawPayload: true, startedAt: true },
  });

  const envelope = asEnvelope(existing?.rawPayload, input.chatId);
  const messages = envelope.data.conversations[0]!.messages;
  messages.push(
    { role: "visitor", text: input.visitorText.slice(0, 4000), createdAt: nowVisitor },
    { role: "bot", text: input.botText.slice(0, 4000), createdAt: nowBot },
  );
  // Cap stored transcript to keep Fluid CPU / payload lean
  if (messages.length > 200) {
    envelope.data.conversations[0]!.messages = messages.slice(-200);
  }

  const lastMessage = input.botText.slice(0, 2000);

  await prisma.fastbotsConversation.upsert({
    where: { externalId: input.chatId },
    create: {
      externalId: input.chatId,
      contactName: "Website visitor",
      channel: "WEB",
      conversationType: "widget",
      lastMessage,
      status: "OPEN",
      startedAt: new Date(),
      tags: ["wewin-widget"],
      rawPayload: envelope as unknown as Prisma.InputJsonValue,
    },
    update: {
      lastMessage,
      channel: "WEB",
      conversationType: "widget",
      status: "OPEN",
      rawPayload: envelope as unknown as Prisma.InputJsonValue,
    },
  });
}

export type WidgetChatMessage = FastbotsMessage;
