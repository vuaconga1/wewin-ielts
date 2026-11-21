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
    ["open", "opened", "active", "live", "in_progress", "in-progress", "lead"].includes(
      s,
    )
  ) {
    return "OPEN";
  }
  if (["closed", "close", "resolved", "done", "archived", "inactive"].includes(s)) {
    return "CLOSED";
  }
  return "UNKNOWN";
}

function pickId(record: Record<string, unknown>, nested?: Record<string, unknown> | null): string | null {
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

/** Normalize one Fastbots webhook object into a conversation row. */
export function normalizeFastbotsPayload(
  raw: Record<string, unknown>,
): NormalizedFastbotsChat | null {
  const contact = asRecord(raw.contact) || asRecord(raw.data);
  const conversation =
    asRecord(raw.conversation) ||
    asRecord(raw.chat) ||
    asRecord(raw.session) ||
    null;

  const externalId = pickId(raw, conversation) || pickId(raw, contact);
  if (!externalId) return null;

  const contactName =
    asString(raw.contactName ?? raw.name ?? contact?.name ?? contact?.fullName, 200) ||
    asString(conversation?.contactName, 200);

  const contactEmail = asString(
    raw.email ?? raw.contactEmail ?? contact?.email,
    320,
  );
  const contactPhone = asString(
    raw.phone ?? raw.contactPhone ?? contact?.phone ?? contact?.phoneNumber,
    40,
  );

  const channel = asString(
    raw.channel ?? conversation?.channel ?? contact?.channel,
    80,
  );
  const conversationType = asString(
    raw.type ??
      raw.conversationType ??
      conversation?.type ??
      conversation?.conversationType,
    80,
  );

  const lastMessage = asString(
    raw.lastMessage ??
      raw.message ??
      raw.last_message ??
      conversation?.lastMessage ??
      conversation?.message ??
      contact?.lastMessage,
    2000,
  );

  const status = mapStatus(
    raw.status ?? conversation?.status ?? contact?.status ?? raw.state,
  );

  const startedAt =
    asDate(raw.startedAt ?? raw.started_at ?? raw.createdAt ?? raw.created_at) ||
    asDate(conversation?.startedAt ?? conversation?.createdAt) ||
    asDate(contact?.createdAt);

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

export function extractWebhookRecords(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.map(asRecord).filter((r): r is Record<string, unknown> => Boolean(r));
  }
  const root = asRecord(body);
  if (!root) return [];

  for (const key of ["conversations", "chats", "contacts", "items", "data"] as const) {
    const nested = root[key];
    if (Array.isArray(nested)) {
      return nested
        .map(asRecord)
        .filter((r): r is Record<string, unknown> => Boolean(r));
    }
  }

  return [root];
}
