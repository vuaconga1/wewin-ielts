import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(".env") });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const slugs = [
    "test-31-listening",
    "test-31-reading",
    "test-32-listening",
    "test-32-reading",
    "test-33-listening",
    "test-33-reading",
    "test-34-listening",
    "test-34-reading",
  ];

  console.log("=== Checking Cambridge 18 in Database ===");

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

