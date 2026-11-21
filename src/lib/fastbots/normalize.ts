import type { FastbotsChatStatus } from "@/generated/prisma/client";

export type NormalizedFastbotsChat = {
  externalId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  channel: string | null;
  conversationType: string | null;
  lastMessage: string | null;
  status: FastbotsChatStatus;
  startedAt: Date | null;
  closedAt: Date | null;
  tags: string[];
};

export type FastbotsMessage = {
  role: "visitor" | "bot" | "agent" | "unknown";
  text: string;
  createdAt: string | null;
  channel: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function mapStatus(raw: unknown): FastbotsChatStatus {
  const s = asString(raw, 40)?.toLowerCase() || "";
  if (!s) return "UNKNOWN";
  if (
    [
      "open",
      "opened",
      "active",
      "live",
      "in_progress",
      "in-progress",
      "lead",
    ].includes(s)
  ) {
    return "OPEN";
  }
  if (
    ["closed", "close", "resolved", "done", "archived", "inactive"].includes(s)
  ) {
    return "CLOSED";
  }
  return "UNKNOWN";
}

function mapRole(raw: unknown): FastbotsMessage["role"] {
  const s = asString(raw, 40)?.toLowerCase() || "";
  if (["visitor", "user", "human", "customer", "client"].includes(s)) {
    return "visitor";
  }
  if (["bot", "assistant", "ai"].includes(s)) return "bot";
  if (["agent", "staff", "admin", "operator"].includes(s)) return "agent";
  return "unknown";
}

function pickId(
  record: Record<string, unknown>,
  nested?: Record<string, unknown> | null,
): string | null {
  const candidates = [
    record.id,
    record.conversationId,
    record.chatId,
    record.contactId,
    nested?.id,
    nested?.conversationId,
    nested?.chatId,
    nested?.contactId,
  ];
  for (const c of candidates) {
    const id = asString(c, 200);
    if (id) return id;
  }
  return null;
}

function pickTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((t) => asString(t, 80))
    .filter((t): t is string => Boolean(t))
    .slice(0, 20);
}

function parseMessageList(
  value: unknown,
  channel: string | null,
): FastbotsMessage[] {
  if (!Array.isArray(value)) return [];
  const out: FastbotsMessage[] = [];
  for (const item of value) {
    const msg = asRecord(item);
    if (!msg) continue;
    const text =
      asString(msg.text ?? msg.message ?? msg.content ?? msg.body, 4000) || "";
    if (!text) continue;
    const created = asDate(msg.createdAt ?? msg.created_at ?? msg.timestamp);
    out.push({
      role: mapRole(msg.role ?? msg.sender ?? msg.from),
      text,
      createdAt: created?.toISOString() ?? null,
      channel,
    });
  }
  return out;
}

function lastText(messages: FastbotsMessage[]): string | null {
  if (!messages.length) return null;
  return messages[messages.length - 1]?.text ?? null;
}

function firstAt(messages: FastbotsMessage[]): Date | null {
  for (const m of messages) {
    const d = asDate(m.createdAt);
    if (d) return d;
  }
  return null;
}

function contactBlock(
  raw: Record<string, unknown>,
): Record<string, unknown> | null {
  return asRecord(raw.contact) || asRecord(raw.data);
}

/** Flatten Fastbots contact webhook (incl. nested conversations) into list rows. */
export function expandFastbotsWebhookRecord(
  raw: Record<string, unknown>,
): NormalizedFastbotsChat[] {
  const contact = contactBlock(raw);
  const contactId = pickId(raw, contact);
  const contactName =
    asString(
      raw.contactName ?? raw.name ?? contact?.name ?? contact?.fullName,
      200,
    ) || null;
  const contactEmail = asString(
    raw.email ?? raw.contactEmail ?? contact?.email,
    320,
  );
  const contactPhone = asString(
    raw.phone ??
      raw.contactPhone ??
      contact?.phone ??
      contact?.phoneNumber,
    40,
  );
  const tags = pickTags(raw.tags ?? contact?.tags);
  const status = mapStatus(
    raw.status ?? contact?.status ?? raw.state,
  );
  const eventType = asString(raw.event ?? raw.type, 80);

  const nestedConversations = contact?.conversations ?? raw.conversations;
  if (contactId && Array.isArray(nestedConversations) && nestedConversations.length) {
    const rows: NormalizedFastbotsChat[] = [];
    nestedConversations.forEach((item, idx) => {
      const conv = asRecord(item);
      if (!conv) return;
      const channel =
        asString(conv.channel ?? conv.type, 80) || `chat-${idx + 1}`;
      const messages = parseMessageList(conv.messages, channel);
      const startedAt =
        firstAt(messages) ||
        asDate(conv.startedAt ?? conv.createdAt) ||
        asDate(contact?.lastSeen ?? contact?.createdAt) ||
        asDate(raw.timestamp);
      rows.push({
        externalId: `${contactId}::${channel}`,
        contactName,
        contactEmail,
        contactPhone,
        channel,
        conversationType: eventType || channel,
        lastMessage: lastText(messages),
        status,
        startedAt,
        closedAt: asDate(conv.closedAt ?? conv.endedAt),
        tags,
      });
    });
    if (rows.length) return rows;
  }

  const single = normalizeFastbotsPayload(raw);
  if (!single) return [];

  // Prefer last message from nested arrays even on a single contact row.
  if (!single.lastMessage && contact && Array.isArray(contact.conversations)) {
    const all: FastbotsMessage[] = [];
    for (const item of contact.conversations) {
      const conv = asRecord(item);
      if (!conv) continue;
      const channel = asString(conv.channel, 80);
      all.push(...parseMessageList(conv.messages, channel));
    }
    if (all.length) {
      single.lastMessage = lastText(all);
      single.startedAt = single.startedAt || firstAt(all);
    }
  }

  return [single];
}

/** Normalize one Fastbots webhook object into a conversation row. */
export function normalizeFastbotsPayload(
  raw: Record<string, unknown>,
): NormalizedFastbotsChat | null {
  const contact = contactBlock(raw);
  const conversation =
    asRecord(raw.conversation) ||
    asRecord(raw.chat) ||
    asRecord(raw.session) ||
    null;

  const externalId = pickId(raw, conversation) || pickId(raw, contact);
  if (!externalId) return null;

  const contactName =
    asString(
      raw.contactName ?? raw.name ?? contact?.name ?? contact?.fullName,
      200,
    ) || asString(conversation?.contactName, 200);

  const contactEmail = asString(
    raw.email ?? raw.contactEmail ?? contact?.email,
    320,
  );
  const contactPhone = asString(
    raw.phone ??
      raw.contactPhone ??
      contact?.phone ??
      contact?.phoneNumber,
    40,
  );

  const channel = asString(
    raw.channel ?? conversation?.channel ?? contact?.channel,
    80,
  );
  const conversationType = asString(
    raw.event ??
      raw.type ??
      raw.conversationType ??
      conversation?.type ??
      conversation?.conversationType,
    80,
  );

  let lastMessage = asString(
    raw.lastMessage ??
      raw.message ??
      raw.last_message ??
      conversation?.lastMessage ??
      conversation?.message ??
      contact?.lastMessage,
    2000,
  );

  if (!lastMessage && conversation) {
    const msgs = parseMessageList(
      conversation.messages,
      asString(conversation.channel, 80),
    );
    lastMessage = lastText(msgs);
  }

  const status = mapStatus(
    raw.status ?? conversation?.status ?? contact?.status ?? raw.state,
  );

  const startedAt =
    asDate(raw.startedAt ?? raw.started_at ?? raw.createdAt ?? raw.created_at) ||
    asDate(conversation?.startedAt ?? conversation?.createdAt) ||
    asDate(contact?.lastSeen ?? contact?.createdAt) ||
    asDate(raw.timestamp);

  const closedAt =
    asDate(raw.closedAt ?? raw.closed_at ?? raw.endedAt) ||
    asDate(conversation?.closedAt ?? conversation?.endedAt);

  const tags = pickTags(raw.tags ?? contact?.tags ?? conversation?.tags);

  return {
    externalId,
    contactName,
    contactEmail,
    contactPhone,
    channel,
    conversationType,
    lastMessage,
    status,
    startedAt,
    closedAt,
    tags,
  };
}

/** Extract chat messages from a stored raw webhook payload. */
export function extractMessagesFromRawPayload(
  raw: unknown,
  preferredChannel?: string | null,
): FastbotsMessage[] {
  const root = asRecord(raw);
  if (!root) return [];
  const contact = contactBlock(root);
  const out: FastbotsMessage[] = [];

  const conversations = contact?.conversations ?? root.conversations;
  if (Array.isArray(conversations)) {
    for (const item of conversations) {
      const conv = asRecord(item);
      if (!conv) continue;
      const channel = asString(conv.channel, 80);
      if (
        preferredChannel &&
        channel &&
        channel.toLowerCase() !== preferredChannel.toLowerCase()
      ) {
        continue;
      }
      out.push(...parseMessageList(conv.messages, channel));
    }
  }

  const direct =
    root.messages ||
    asRecord(root.conversation)?.messages ||
    asRecord(root.chat)?.messages;
  if (Array.isArray(direct)) {
    out.push(...parseMessageList(direct, preferredChannel ?? null));
  }

  out.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return ta - tb;
  });

  return out;
}

export function extractWebhookRecords(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body
      .map(asRecord)
      .filter((r): r is Record<string, unknown> => Boolean(r));
  }
  const root = asRecord(body);
  if (!root) return [];

  // contact.created envelope: keep whole root (data is an object, not a list)
  if (root.event || root.type || asRecord(root.data)?.id || root.contact) {
    return [root];
  }

  for (const key of ["conversations", "chats", "contacts", "items"] as const) {
    const nested = root[key];
    if (Array.isArray(nested)) {
      return nested
        .map(asRecord)
        .filter((r): r is Record<string, unknown> => Boolean(r));
    }
  }

  if (Array.isArray(root.data)) {
    return root.data
      .map(asRecord)
      .filter((r): r is Record<string, unknown> => Boolean(r));
  }

  return [root];
}
