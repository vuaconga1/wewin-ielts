import { prisma } from "../src/lib/prisma";

async function main() {
  const deleted = await prisma.fastbotsConversation.deleteMany({
    where: { externalId: "test_sample" },
  });
  const total = await prisma.fastbotsConversation.count();
  console.log(JSON.stringify({ deleted: deleted.count, total }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
