import path from "node:path";
import { config } from "dotenv";
config({ path: path.resolve(".env") });

import { prisma } from "../src/lib/prisma";

async function main() {
  const tests = await prisma.test.findMany({
    where: {
      slug: {
        in: [
          "test-23-listening",
          "test-23-reading",
          "test-24-listening",
          "test-24-reading",
          "test-25-listening",
          "test-25-reading",
          "test-26-listening",
          "test-26-reading",
        ],
      },
    },
    select: {
      slug: true,
      title: true,
      status: true,
      skill: true,
      sections: {
        select: {
          title: true,
          order: true,
          questions: { select: { id: true } },
        },
      },
      media: {
        select: { type: true, path: true },
      },
    },
    orderBy: { slug: "asc" },
  });

  console.log(`Found ${tests.length} tests in DB:`);
  for (const t of tests) {
    const qCount = t.sections.reduce((acc, s) => acc + s.questions.length, 0);
    const audioCount = t.media.filter((m) => m.type === "AUDIO").length;
    console.log(
      `✓ ${t.slug.padEnd(20)} | ${t.title.padEnd(28)} | ${t.status} | Sections: ${t.sections.length} | Questions: ${qCount} | Audio: ${audioCount}`,
    );
  }

  const totalPublished = await prisma.test.count({
    where: { status: "PUBLISHED" },
  });
  console.log(`\nTotal PUBLISHED tests in DB: ${totalPublished}`);

  const attempts = await prisma.attempt.findMany({
    where: { test: { slug: { in: ["test-23-listening", "test-24-listening"] } } },
    select: { id: true, test: { select: { slug: true } }, finishedAt: true, scoreRaw: true, payload: true }
  });
  console.log(`Attempts for test-23 and test-24 (${attempts.length}):`);
  for (const a of attempts) {
    const p = a.payload as any;
    console.log(a.id, a.test.slug, {
      11: p?.answers?.["11"],
      12: p?.answers?.["12"],
      13: p?.answers?.["13"],
      14: p?.answers?.["14"],
      15: p?.answers?.["15"],
      16: p?.answers?.["16"],
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
