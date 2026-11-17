import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(".env") });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const slugs = [
    "test-27-listening",
    "test-27-reading",
    "test-28-listening",
    "test-28-reading",
    "test-29-listening",
    "test-29-reading",
    "test-30-listening",
    "test-30-reading",
  ];

  console.log("=== Checking Cambridge 12 in Database ===");

  for (const slug of slugs) {
    const test = await prisma.test.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!test) {
      console.error(`[ERROR] Test not found in DB: ${slug}`);
      continue;
    }

    const totalQuestions = test.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    console.log(
      `✓ ${test.slug} | id=${test.id} | status=${test.status} | skill=${test.skill} | examType=${test.examType} | sections=${test.sections.length} | totalQ=${totalQuestions}`
    );

    if (totalQuestions !== 40) {
      console.error(`  [ERROR] Total questions is ${totalQuestions}, expected 40!`);
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
