import { prisma } from "../src/lib/prisma";

async function main() {
  const n = await prisma.fastbotsConversation.count();
  const rows = await prisma.fastbotsConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      externalId: true,
      contactName: true,
      lastMessage: true,
      status: true,
      channel: true,
      createdAt: true,
      updatedAt: true,
      rawPayload: true,
    },
  });
  console.log(JSON.stringify({ n, rows }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
