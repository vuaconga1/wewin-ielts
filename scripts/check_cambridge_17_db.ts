import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(".env") });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const slugs = [
    "test-39-listening",
    "test-39-reading",
    "test-40-listening",
    "test-40-reading",
    "test-41-listening",
    "test-41-reading",
    "test-42-listening",
    "test-42-reading",
  ];

  console.log("=== Checking Cambridge 17 in Database ===");

  let foundCount = 0;
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
      console.log(`- [NOT IN DB YET] ${slug}`);
      continue;
    }

    foundCount++;
    const totalQuestions = test.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    console.log(
      `✓ ${test.slug} | id=${test.id} | status=${test.status} | skill=${test.skill} | examType=${test.examType} | sections=${test.sections.length} | totalQ=${totalQuestions}`
    );
  }

  console.log(`\nFound ${foundCount}/${slugs.length} Cambridge 17 tests in database.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("DB check error:", e);
  process.exit(1);
});

