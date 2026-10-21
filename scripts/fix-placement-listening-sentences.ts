/**
 * Placement Listening Q37–40 (sentence completion): put each number next to
 * its gap in Section 4 content and store the questions as inline GAP_FILL.
 * Dry-run by default; pass --apply to write. Question IDs / attempts are kept.
 *
 *   npx tsx scripts/fix-placement-listening-sentences.ts [--apply]
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const APPLY = process.argv.includes("--apply");
const SLUG = "placement-listening";
const NUMBERS = [37, 38, 39, 40];

function placeSentenceBlankNumbers(content: string): string {
  let next = content;
  for (const n of NUMBERS) {
    const re = new RegExp(`^${n}\\s+(.+?)\\s+((?:[.…_…]|\\.){2,}|_{2,})`, "m");
    next = next.replace(re, `$1 ${n} $2`);
  }
  return next;
}

async function main() {
  const test = await prisma.test.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      sections: {
        select: {
          id: true,
          order: true,
          content: true,
          questions: {
            where: { number: { in: NUMBERS } },
            select: { id: true, number: true, type: true, content: true },
          },
        },
      },
    },
  });
  if (!test) throw new Error(`Test not found: ${SLUG}`);

  const section = test.sections.find((s) => s.questions.length > 0);
  if (!section) throw new Error(`${SLUG}: Q37–40 not found`);

  const content = placeSentenceBlankNumbers(section.content ?? "");
  const contentChanged = content !== (section.content ?? "");
  console.log(`Section order=${section.order}: content ${contentChanged ? "updated" : "unchanged"}`);
  for (const line of content.split("\n").filter((l) => /\b(3[7-9]|40)\b/.test(l))) {
    console.log(`  ${line}`);
  }

  const questionUpdates = section.questions.filter((q) => {
    const c = q.content as { stem?: string; blank?: boolean };
    return q.type !== "GAP_FILL" || (c.stem ?? "") !== "" || !c.blank;
  });
  for (const q of questionUpdates) {
    console.log(`Q${q.number}: ${q.type} ${JSON.stringify(q.content)} -> GAP_FILL {"stem":"","blank":true}`);
  }

  if (!APPLY) {
    console.log("\nDry-run. Pass --apply to write.");
    return;
  }

  await prisma.$transaction([
    ...(contentChanged
      ? [prisma.testSection.update({ where: { id: section.id }, data: { content } })]
      : []),
    ...questionUpdates.map((q) =>
      prisma.question.update({
        where: { id: q.id },
        data: {
          type: "GAP_FILL",
          content: { ...(q.content as object), stem: "", blank: true },
        },
      }),
    ),
  ]);
  console.log("Applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
