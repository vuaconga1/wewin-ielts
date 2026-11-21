import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FastbotsChatListQuery } from "@/lib/fastbots/schemas";
import {
  extractWebhookRecords,
  normalizeFastbotsPayload,
} from "@/lib/fastbots/normalize";
import type {
  FastbotsChatListItem,
  FastbotsChatListResult,
} from "@/lib/fastbots/types";
import {
  getFastbotsDashboardUrl,
  getFastbotsWebhookSecret,
} from "@/lib/fastbots/webhook-auth";

function toListItem(row: {
  id: string;
  externalId: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  channel: string | null;
  conversationType: string | null;
  lastMessage: string | null;
  status: FastbotsChatListItem["status"];
  startedAt: Date | null;
  closedAt: Date | null;
  updatedAt: Date;
}): FastbotsChatListItem {
  return {
    id: row.id,
    externalId: row.externalId,
    contactName: row.contactName?.trim() || "Anonymous visitor",
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    channel: row.channel,
    conversationType: row.conversationType,
    lastMessage: row.lastMessage,
    status: row.status,
    startedAt: row.startedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFastbotsConversations(
  query: FastbotsChatListQuery,
): Promise<FastbotsChatListResult> {
  const q = query.q.trim();
  const where: Prisma.FastbotsConversationWhereInput = {};

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (q) {
    where.OR = [
      { contactName: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
      { lastMessage: { contains: q, mode: "insensitive" } },
      { externalId: { contains: q, mode: "insensitive" } },
      { channel: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.fastbotsConversation.count({ where }),
    prisma.fastbotsConversation.findMany({
      where,
      orderBy: [{ startedAt: "desc" }, { updatedAt: "desc" }],
      take: query.take,
      skip: query.skip,
      select: {
        id: true,
        externalId: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        channel: true,
        conversationType: true,
        lastMessage: true,
        status: true,
        startedAt: true,
        closedAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    items: rows.map(toListItem),
    total,
    config: {
      webhookConfigured: Boolean(getFastbotsWebhookSecret()),
      dashboardUrl: getFastbotsDashboardUrl(),
      webhookPath: "/api/webhooks/fastbots",
    },
  };
}

export async function upsertFastbotsWebhookPayload(
  body: unknown,
): Promise<{ upserted: number; skipped: number }> {
  const records = extractWebhookRecords(body);
  let upserted = 0;
  let skipped = 0;

  for (const record of records) {
    const normalized = normalizeFastbotsPayload(record);
    if (!normalized) {
      skipped += 1;
      continue;
    }

    await prisma.fastbotsConversation.upsert({
      where: { externalId: normalized.externalId },
      create: {
        externalId: normalized.externalId,
        contactName: normalized.contactName,
        contactEmail: normalized.contactEmail,
        contactPhone: normalized.contactPhone,
        channel: normalized.channel,
        conversationType: normalized.conversationType,
        lastMessage: normalized.lastMessage,
        status: normalized.status,
        startedAt: normalized.startedAt ?? new Date(),
        closedAt: normalized.closedAt,
        tags: normalized.tags,
        rawPayload: record as Prisma.InputJsonValue,
      },
      update: {
        ...(normalized.contactName != null
          ? { contactName: normalized.contactName }
          : {}),
        ...(normalized.contactEmail != null
          ? { contactEmail: normalized.contactEmail }
          : {}),
        ...(normalized.contactPhone != null
          ? { contactPhone: normalized.contactPhone }
          : {}),
        ...(normalized.channel != null ? { channel: normalized.channel } : {}),
        ...(normalized.conversationType != null
          ? { conversationType: normalized.conversationType }
          : {}),
        ...(normalized.lastMessage != null
          ? { lastMessage: normalized.lastMessage }
          : {}),
        ...(normalized.status !== "UNKNOWN" ? { status: normalized.status } : {}),
        ...(normalized.startedAt ? { startedAt: normalized.startedAt } : {}),
        ...(normalized.closedAt ? { closedAt: normalized.closedAt } : {}),
        ...(normalized.tags.length ? { tags: normalized.tags } : {}),
        rawPayload: record as Prisma.InputJsonValue,
      },
    });
    upserted += 1;
  }

  return { upserted, skipped };
}
