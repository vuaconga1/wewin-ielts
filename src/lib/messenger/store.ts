import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getMessengerConfig } from "@/lib/messenger/config";
import {
  listMessengerConversations,
  type GraphConversation,
  type GraphMessage,
} from "@/lib/messenger/graph";

function participantName(
  conv: GraphConversation,
  pageId: string,
): string {
  const people = conv.participants?.data ?? [];
  const other = people.find((p) => p.id && p.id !== pageId);
  return other?.name?.trim() || "Messenger visitor";
}

function participantEmail(
  conv: GraphConversation,
  pageId: string,
): string | null {
  const people = conv.participants?.data ?? [];
  const other = people.find((p) => p.id && p.id !== pageId);
  return other?.email?.trim() || null;
}

function mapRole(fromId: string | undefined, pageId: string): string {
  if (!fromId) return "unknown";
  if (fromId === pageId) return "bot";
  return "visitor";
}

function toEnvelope(
  conv: GraphConversation,
  pageId: string,
): {
  contactName: string;
  contactEmail: string | null;
  lastMessage: string | null;
  startedAt: Date | null;
  rawPayload: Prisma.InputJsonValue;
} {
  const msgs = [...(conv.messages?.data ?? [])].reverse();
  const mapped = msgs
    .filter((m) => typeof m.message === "string" && m.message.trim())
    .map((m: GraphMessage) => ({
      role: mapRole(m.from?.id, pageId),
      text: String(m.message).slice(0, 4000),
      createdAt: m.created_time
        ? new Date(m.created_time).toISOString()
        : new Date().toISOString(),
    }));

  const last =
    mapped[mapped.length - 1]?.text ||
    conv.snippet?.trim() ||
    null;

  const started =
    mapped[0]?.createdAt
      ? new Date(mapped[0].createdAt)
      : conv.updated_time
        ? new Date(conv.updated_time)
        : null;

  const envelope = {
    source: "facebook-messenger",
    data: {
      id: conv.id,
      name: participantName(conv, pageId),
      email: participantEmail(conv, pageId),
      channel: "MESSENGER",
      status: "open",
      conversations: [
        {
          channel: "MESSENGER",
          messages: mapped,
        },
      ],
    },
  };

  return {
    contactName: participantName(conv, pageId),
    contactEmail: participantEmail(conv, pageId),
    lastMessage: last ? last.slice(0, 2000) : null,
    startedAt: started && !Number.isNaN(started.getTime()) ? started : null,
    rawPayload: envelope as unknown as Prisma.InputJsonValue,
  };
}

export async function upsertMessengerConversation(
  conv: GraphConversation,
): Promise<void> {
  const config = getMessengerConfig();
  if (!config) return;

  const mapped = toEnvelope(conv, config.pageId);
  const externalId = `messenger:${conv.id}`;

  await prisma.fastbotsConversation.upsert({
    where: { externalId },
    create: {
      externalId,
      contactName: mapped.contactName,
      contactEmail: mapped.contactEmail,
      channel: "MESSENGER",
      conversationType: "messenger",
      lastMessage: mapped.lastMessage,
      status: "OPEN",
      startedAt: mapped.startedAt ?? new Date(),
      tags: ["messenger", "facebook"],
      rawPayload: mapped.rawPayload,
    },
    update: {
      contactName: mapped.contactName,
      contactEmail: mapped.contactEmail,
      channel: "MESSENGER",
      conversationType: "messenger",
      lastMessage: mapped.lastMessage,
      status: "OPEN",
      ...(mapped.startedAt ? { startedAt: mapped.startedAt } : {}),
      tags: ["messenger", "facebook"],
      rawPayload: mapped.rawPayload,
    },
  });
}

/** Pull recent Page Messenger threads into admin Chat History. */
export async function syncMessengerConversations(input?: {
  limit?: number;
}): Promise<{ synced: number }> {
  const conversations = await listMessengerConversations({
    limit: input?.limit ?? 25,
  });
  for (const conv of conversations) {
    await upsertMessengerConversation(conv);
  }
  return { synced: conversations.length };
}

/** Append one live Messenger webhook message into a conversation row. */
export async function appendMessengerWebhookMessage(input: {
  senderId: string;
  senderName?: string | null;
  text: string;
  mid?: string | null;
  timestampMs?: number | null;
  isEcho?: boolean;
}): Promise<void> {
  const config = getMessengerConfig();
  if (!config) return;

  const externalId = `messenger:psid:${input.senderId}`;
  const existing = await prisma.fastbotsConversation.findUnique({
    where: { externalId },
    select: { rawPayload: true, contactName: true },
  });

  const createdAt = input.timestampMs
    ? new Date(input.timestampMs).toISOString()
    : new Date().toISOString();

  const role = input.isEcho ? "bot" : "visitor";
  let messages: Array<{ role: string; text: string; createdAt: string }> = [];
  if (existing?.rawPayload && typeof existing.rawPayload === "object") {
    const root = existing.rawPayload as {
      data?: { conversations?: Array<{ messages?: typeof messages }> };
    };
    messages = root.data?.conversations?.[0]?.messages ?? [];
  }
  messages.push({
    role,
    text: input.text.slice(0, 4000),
    createdAt,
  });
  if (messages.length > 200) messages = messages.slice(-200);

  const contactName =
    input.senderName?.trim() ||
    existing?.contactName ||
    "Messenger visitor";

  const envelope = {
    source: "facebook-messenger-webhook",
    data: {
      id: input.senderId,
      name: contactName,
      channel: "MESSENGER",
      status: "open",
      conversations: [{ channel: "MESSENGER", messages }],
    },
  };

  await prisma.fastbotsConversation.upsert({
    where: { externalId },
    create: {
      externalId,
      contactName,
      channel: "MESSENGER",
      conversationType: "messenger",
      lastMessage: input.text.slice(0, 2000),
      status: "OPEN",
      startedAt: new Date(createdAt),
      tags: ["messenger", "facebook", "webhook"],
      rawPayload: envelope as unknown as Prisma.InputJsonValue,
    },
    update: {
      contactName,
      channel: "MESSENGER",
      lastMessage: input.text.slice(0, 2000),
      status: "OPEN",
      rawPayload: envelope as unknown as Prisma.InputJsonValue,
    },
  });
}
