/**
 * Split speaking-speaking into 6 realistic IELTS speaking tests (10+1+5).
 *
 * Usage:
 *   npx tsx scripts/split-speaking-tests.ts --dry-run
 *   npx tsx scripts/split-speaking-tests.ts
 */
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(".env") });

function argFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const dryRun = argFlag("dry-run");

  const { getTestBySlug } = await import("../src/lib/store/test-store");
  const {
    buildSpeakingExamQueue,
    countSpeakingItemsByPart,
  } = await import("../src/lib/practice/speaking-exam");
  const { ParsedTestDraftSchema } = await import("../src/lib/import/schemas");
  type SpeakingExamItem = import("../src/lib/practice/speaking-exam").SpeakingExamItem;

  const source = await getTestBySlug("speaking-speaking");
  if (!source) {
    console.error("Source test speaking-speaking not found (DB or FS).");
    process.exit(1);
  }

  console.log(
    `Source: ${source.slug} | parts=${source.parts.length} | rawQs=${source.parts.reduce((n, p) => n + p.questions.length, 0)}`,
  );

  // Prefer per-pack expansion to keep topic coherence (each imported pack
  // is already one speaking set with Part 1/2/3 content).
  const packQueues: SpeakingExamItem[][] = source.parts.map((part, i) => {
    const q = buildSpeakingExamQueue([part as never]);
    const c = countSpeakingItemsByPart(q);
    console.log(
      `  pack ${i}: items=${q.length} P1=${c[1]} P2=${c[2]} P3=${c[3]} topics=[${[...new Set(q.filter((x) => x.partKind === 1 && x.topic).map((x) => x.topic!))].join("; ")}]`,
    );
    return q;
  });

  const globalQueue = buildSpeakingExamQueue(source.parts as never);
  const globalCounts = countSpeakingItemsByPart(globalQueue);
  console.log(
    `Global queue: ${globalQueue.length} P1=${globalCounts[1]} P2=${globalCounts[2]} P3=${globalCounts[3]}`,
  );

  /** Build one test draft from selected items. */
  function draftFromItems(
    index: number,
    items: SpeakingExamItem[],
  ): Record<string, unknown> {
    const part1 = items.filter((it) => it.partKind === 1).slice(0, 10);
    const part2 = items.filter((it) => it.partKind === 2).slice(0, 1);
    const part3 = items.filter((it) => it.partKind === 3).slice(0, 5);
    if (part1.length !== 10 || part2.length !== 1 || part3.length !== 5) {
      throw new Error(
        `Test ${index}: incomplete set P1=${part1.length} P2=${part2.length} P3=${part3.length}`,
      );
    }

    let number = 0;
    const makeQuestions = (
      list: SpeakingExamItem[],
      speakingPart: 1 | 2 | 3,
    ) =>
      list.map((it, order) => {
        number += 1;
        return {
          number,
          order,
          type: "SPEAKING_PROMPT" as const,
          content: {
            stem: it.stem,
            ...(it.topic ? { topic: it.topic } : {}),
            speakingPart,
          },
        };
      });

    const slug = `test-${index}-speaking`;
    return {
      title: `Speaking Test ${index}`,
      slug,
      skill: "SPEAKING",
      examType: "ACADEMIC",
      timeLimitMinutes: 15,
      tags: ["#IELTS Academic", "#Speaking"],
      sourceFolder: source.sourceFolder,
      description: `IELTS Academic Speaking practice set ${index} (Part 1 · Part 2 · Part 3).`,
      parts: [
        {
          title: "Part 1",
          order: 0,
          questions: makeQuestions(part1, 1),
        },
        {
          title: "Part 2",
          order: 1,
          questions: makeQuestions(part2, 2),
        },
        {
          title: "Part 3",
          order: 2,
          questions: makeQuestions(part3, 3),
        },
      ],
    };
  }

  // Strategy: take complete 10+1+5 from each pack when possible; fill gaps
  // from a global leftover pool so we still get 6 tests.
  const p1Pool: SpeakingExamItem[] = [];
  const p2Pool: SpeakingExamItem[] = [];
  const p3Pool: SpeakingExamItem[] = [];

  const packTests: SpeakingExamItem[][] = [];
  for (const q of packQueues) {
    const c = countSpeakingItemsByPart(q);
    if (c[1] >= 10 && c[2] >= 1 && c[3] >= 5) {
      const used = [
        ...q.filter((it) => it.partKind === 1).slice(0, 10),
        ...q.filter((it) => it.partKind === 2).slice(0, 1),
        ...q.filter((it) => it.partKind === 3).slice(0, 5),
      ];
      packTests.push(used);
      // leftovers from this pack go to pools
      p1Pool.push(...q.filter((it) => it.partKind === 1).slice(10));
      p2Pool.push(...q.filter((it) => it.partKind === 2).slice(1));
      p3Pool.push(...q.filter((it) => it.partKind === 3).slice(5));
    } else {
      p1Pool.push(...q.filter((it) => it.partKind === 1));
      p2Pool.push(...q.filter((it) => it.partKind === 2));
      p3Pool.push(...q.filter((it) => it.partKind === 3));
    }
  }

  console.log(
    `Pack-complete tests: ${packTests.length}; leftover pools P1=${p1Pool.length} P2=${p2Pool.length} P3=${p3Pool.length}`,
  );

  const TARGET = 6;
  const tests: SpeakingExamItem[][] = [...packTests];
  while (tests.length < TARGET) {
    if (p1Pool.length < 10 || p2Pool.length < 1 || p3Pool.length < 5) break;
    tests.push([
      ...p1Pool.splice(0, 10),
      ...p2Pool.splice(0, 1),
      ...p3Pool.splice(0, 5),
    ]);
  }

  // If pack-complete produced more than 6, keep first 6 and move extras to discard pools
  while (tests.length > TARGET) {
    const extra = tests.pop()!;
    p1Pool.push(...extra.filter((it) => it.partKind === 1));
    p2Pool.push(...extra.filter((it) => it.partKind === 2));
    p3Pool.push(...extra.filter((it) => it.partKind === 3));
  }

  if (tests.length < TARGET) {
    // Fallback: ignore pack structure, slice global queues evenly
    console.warn(
      `Only ${tests.length} pack-based tests; falling back to global even split.`,
    );
    const g1 = globalQueue.filter((it) => it.partKind === 1);
    const g2 = globalQueue.filter((it) => it.partKind === 2);
    const g3 = globalQueue.filter((it) => it.partKind === 3);
    tests.length = 0;
    for (let i = 0; i < TARGET; i++) {
      tests.push([
        ...g1.slice(i * 10, i * 10 + 10),
        ...g2.slice(i * 1, i * 1 + 1),
        ...g3.slice(i * 5, i * 5 + 5),
      ]);
    }
    p1Pool.length = 0;
    p2Pool.length = 0;
    p3Pool.length = 0;
    p1Pool.push(...g1.slice(TARGET * 10));
    p2Pool.push(...g2.slice(TARGET * 1));
    p3Pool.push(...g3.slice(TARGET * 5));
  }

  const discarded = {
    part1: p1Pool.length,
    part2: p2Pool.length,
    part3: p3Pool.length,
    total: p1Pool.length + p2Pool.length + p3Pool.length,
  };
  console.log(`Discarding leftovers:`, discarded);

  const drafts = tests.map((items, i) => draftFromItems(i + 1, items));

  for (const d of drafts) {
    const parsed = ParsedTestDraftSchema.safeParse(d);
    if (!parsed.success) {
      console.error(`Schema fail ${d.slug}:`, parsed.error.issues[0]);
      process.exit(1);
    }
    const q = buildSpeakingExamQueue(parsed.data.parts as never);
    const c = countSpeakingItemsByPart(q);
    console.log(
      `  draft ${d.slug}: storedQs=${parsed.data.parts.reduce((n, p) => n + p.questions.length, 0)} queue=${q.length} P1=${c[1]} P2=${c[2]} P3=${c[3]}`,
    );
  }

  if (dryRun) {
    console.log("Dry run — no files/DB written.");
    return;
  }

  const testsDir = path.resolve("data/tests");
  await mkdir(testsDir, { recursive: true });

  const { persistParsedTest } = await import("../src/lib/import/persist");
  const { prisma } = await import("../src/lib/prisma");
  const { canUsePrisma, resetDbProbeCache } = await import("../src/lib/db");
  resetDbProbeCache();
  if (!(await canUsePrisma())) {
    console.error("Database not available.");
    process.exit(1);
  }

  for (const d of drafts) {
    const parsed = ParsedTestDraftSchema.parse(d);
    const filePath = path.join(testsDir, `${parsed.slug}.json`);
    await writeFile(filePath, JSON.stringify(parsed, null, 2) + "\n", "utf8");
    const result = await persistParsedTest(parsed, [], {
      force: true,
      status: "PUBLISHED",
    });
    console.log(`  ✓ persisted ${parsed.slug} → ${result.testId}`);
  }

  // Remove / unpublish old bloated test
  const old = await prisma.test.findUnique({
    where: { slug: "speaking-speaking" },
  });
  if (old) {
    // Delete sections/questions via cascade if schema supports it; else soft-unpublish
    try {
      await prisma.testSection.deleteMany({ where: { testId: old.id } });
      await prisma.mediaAsset.deleteMany({ where: { testId: old.id } });
      await prisma.test.delete({ where: { id: old.id } });
      console.log("  ✓ deleted DB test speaking-speaking");
    } catch (e) {
      console.warn(
        "Hard delete failed (attempts may reference it); unpublishing instead:",
        e instanceof Error ? e.message : e,
      );
      await prisma.test.update({
        where: { id: old.id },
        data: { status: "DRAFT" },
      });
      console.log("  ✓ unpublished speaking-speaking → DRAFT");
    }
  }

  // Remove local JSON so FS fallback cannot resurrect the bloated card
  try {
    await unlink(path.join(testsDir, "speaking-speaking.json"));
    console.log("  ✓ removed data/tests/speaking-speaking.json");
  } catch {
    console.log("  · speaking-speaking.json already absent");
  }

  // Verify
  const speaking = await prisma.test.findMany({
    where: { skill: "SPEAKING" },
    include: {
      sections: { include: { _count: { select: { questions: true } } } },
    },
    orderBy: { slug: "asc" },
  });
  console.log("\nSpeaking tests in DB:");
  for (const t of speaking) {
    const qCount = t.sections.reduce((n, s) => n + s._count.questions, 0);
    console.log(
      `  ${t.status} ${t.slug} | "${t.title}" | sections=${t.sections.length} questions=${qCount}`,
    );
  }
  console.log(
    `\nDone. Created ${drafts.length} tests; discarded ${discarded.total} leftover prompts (P1=${discarded.part1}, P2=${discarded.part2}, P3=${discarded.part3}).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
