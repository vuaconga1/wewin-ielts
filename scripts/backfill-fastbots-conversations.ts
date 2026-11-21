import { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import {
  expandFastbotsWebhookRecord,
  extractWebhookRecords,
} from "../src/lib/fastbots/normalize";

async function main() {
  const rows = await prisma.fastbotsConversation.findMany({
    select: { id: true, rawPayload: true },
    take: 500,
  });

  let upserted = 0;
  for (const row of rows) {
    if (!row.rawPayload) continue;
    const records = extractWebhookRecords(row.rawPayload);
    for (const record of records) {
      for (const normalized of expandFastbotsWebhookRecord(record)) {
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
            contactName: normalized.contactName,
            contactEmail: normalized.contactEmail,
            contactPhone: normalized.contactPhone,
            channel: normalized.channel,
            conversationType: normalized.conversationType,
            lastMessage: normalized.lastMessage,
            status: normalized.status,
            startedAt: normalized.startedAt ?? undefined,
            closedAt: normalized.closedAt,
            tags: normalized.tags,
            rawPayload: record as Prisma.InputJsonValue,
          },
        });
        upserted += 1;
      }
    }
  }

  const totalRows = await prisma.fastbotsConversation.count();
  console.log(JSON.stringify({ processed: rows.length, upserted, totalRows }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
