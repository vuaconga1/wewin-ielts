import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== CHECKING PUBLISHED TESTS 19-22 IN DATABASE ===");
  const slugs = [
    "test-19-listening", "test-19-reading",
    "test-20-listening", "test-20-reading",
    "test-21-listening", "test-21-reading",
    "test-22-listening", "test-22-reading",
  ];

  for (const slug of slugs) {
    const test = await prisma.test.findUnique({
      where: { slug },
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!test) {
      console.error(`FAIL: Test not found: ${slug}`);
      continue;
    }

    const totalQuestions = test.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );

    console.log(
      `✓ [${test.status}] ${test.slug} | "${test.title}" | Sections: ${test.sections.length} | Questions: ${totalQuestions} | Skill: ${test.skill}`
    );
  }

  const publishedCount = await prisma.test.count({
    where: { status: "PUBLISHED" },
  });
  console.log(`\nTotal PUBLISHED tests in database: ${publishedCount}`);

  console.log("\n=== CHECKING R2 MEDIA ACCESSIBILITY ===");
  const mediaUrls = [
    "https://pub-9de21ff141584031af658ddfb8e11aec.r2.dev/uploads/audio/test-19-section-1.mp3",
    "https://pub-9de21ff141584031af658ddfb8e11aec.r2.dev/uploads/images/test-19-map.png",
    "https://pub-9de21ff141584031af658ddfb8e11aec.r2.dev/uploads/audio/test-22-section-4.mp3",
  ];

  for (const url of mediaUrls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(
      `✓ ${url} -> HTTP ${res.status} | Content-Type: ${res.headers.get("content-type")} | Length: ${res.headers.get("content-length")} bytes`
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Error:", e);
  await prisma.$disconnect();
  process.exit(1);
});
