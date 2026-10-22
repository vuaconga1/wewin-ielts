/**
 * test-2-reading Q34–37: classification (A/B/C study) was parsed as heading
 * matching (stems = heading list). Q38–40: summary gap-fill parsed as MATCHING.
 * test-4-reading Q21–26: "List of PeopleA" swallowed option A (John Alroy).
 *
 * Updates data/tests JSON and DB rows in place (question IDs / attempts kept).
 * Dry-run by default; pass --apply to write.
 *
 *   npx tsx scripts/fix-test-2-4-reading-matching.ts [--apply]
 */
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const APPLY = process.argv.includes("--apply");

type Fix = {
  type: "MATCHING" | "GAP_FILL";
  content: Record<string, unknown>;
};

const STUDY_OPTIONS = [
  { label: "A", text: "the first study" },
  { label: "B", text: "the second study" },
  { label: "C", text: "the third study" },
];

const PEOPLE_OPTIONS = [
  { label: "A", text: "John Alroy" },
  { label: "B", text: "Ross D E Macphee" },
  { label: "C", text: "Russell W Graham" },
];

const GAP: Fix = { type: "GAP_FILL", content: { stem: "", blank: true } };

const TEST2: Record<number, Fix> = {
  34: { type: "MATCHING", content: { stem: "The study focused on participants' short-term reaction to receiving flowers.", options: STUDY_OPTIONS } },
  35: { type: "MATCHING", content: { stem: "Participants were deliberately misled as to the aim of the study.", options: STUDY_OPTIONS } },
  36: { type: "MATCHING", content: { stem: "Receiving flowers had a notable effect on participants' mental capacities.", options: STUDY_OPTIONS } },
  37: { type: "MATCHING", content: { stem: "Male and female responses were more uniform than expected.", options: STUDY_OPTIONS } },
  38: GAP,
  39: GAP,
  40: GAP,
};

const TEST4_NUMBERS = [21, 22, 23, 24, 25, 26];

type JsonQuestion = { number: number; type: string; content: Record<string, unknown> };
type JsonTest = { parts: { content?: string; questions: JsonQuestion[] }[] };

function fixesFor(slug: string, q: JsonQuestion): Fix | null {
  if (slug === "test-2-reading") return TEST2[q.number] ?? null;
  if (slug === "test-4-reading" && TEST4_NUMBERS.includes(q.number)) {
    return { type: "MATCHING", content: { ...q.content, options: PEOPLE_OPTIONS } };
  }
  return null;
}

function fixContent(slug: string, content: string): string {
  if (slug !== "test-4-reading") return content;
  return content.replace("List of PeopleA    John Alroy", "List of People\nA    John Alroy");
}

async function fixJson(slug: string) {
  const file = path.join(process.cwd(), "data", "tests", `${slug}.json`);
  const test = JSON.parse(await readFile(file, "utf8")) as JsonTest;
  let changed = 0;
  for (const part of test.parts) {
    if (part.content) {
      const next = fixContent(slug, part.content);
      if (next !== part.content) {
        part.content = next;
        changed += 1;
      }
    }
    for (const q of part.questions) {
      const fix = fixesFor(slug, q);
      if (!fix) continue;
      q.type = fix.type;
      q.content = fix.content;
      changed += 1;
    }
  }
  console.log(`[json] ${slug}: ${changed} changes`);
  if (APPLY && changed) await writeFile(file, JSON.stringify(test, null, 2), "utf8");
}

async function fixDb(slug: string) {
  const test = await prisma.test.findUnique({
    where: { slug },
    select: {
      sections: {
        select: {
          id: true,
          content: true,
          questions: { select: { id: true, number: true, type: true, content: true } },
        },
      },
    },
  });
  if (!test) {
    console.log(`[db] ${slug}: not found`);
    return;
  }
  for (const section of test.sections) {
    const next = fixContent(slug, section.content ?? "");
    if (next !== (section.content ?? "")) {
      console.log(`[db] ${slug}: section content updated`);
      if (APPLY) await prisma.testSection.update({ where: { id: section.id }, data: { content: next } });
    }
    for (const q of section.questions) {
      const fix = fixesFor(slug, {
        number: q.number,
        type: q.type,
        content: (q.content ?? {}) as Record<string, unknown>,
      });
      if (!fix) continue;
      console.log(`[db] ${slug} Q${q.number}: ${q.type} -> ${fix.type} ${JSON.stringify(fix.content).slice(0, 100)}`);
      if (APPLY) {
        await prisma.question.update({
          where: { id: q.id },
          data: { type: fix.type, content: fix.content as object },
        });
      }
    }
  }
}

async function main() {
  for (const slug of ["test-2-reading", "test-4-reading"]) {
    await fixJson(slug);
    await fixDb(slug);
  }
  if (!APPLY) console.log("Dry run. Re-run with --apply to write.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
