import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(".env") });

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const slugs = [
    "test-35-listening",
    "test-35-reading",
    "test-36-listening",
    "test-36-reading",
    "test-37-listening",
    "test-37-reading",
    "test-38-listening",
    "test-38-reading",
  ];

  console.log("=== Checking Cambridge 16 in Database ===");

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

    if (totalQuestions !== 40) {
      console.error(
        `  [WARNING] ${test.slug} has ${totalQuestions} questions, expected 40!`
      );
    }
  }

  console.log(`\nFound ${foundCount}/${slugs.length} Cambridge 16 tests in database.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error checking DB:", err);
  process.exit(1);
});

