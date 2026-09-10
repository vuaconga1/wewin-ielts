/**
 * Clear redundant gap / notes-completion stems on existing local JSON tests
 * (and Neon DB when available). Safe: only rewrites `question.content.stem`
 * (+ sets `blank: true`); never touches answers, types, or scoring keys.
 *
 * Usage:
 *   npx tsx scripts/cleanup-gap-stems.ts --dry-run
 *   npx tsx scripts/cleanup-gap-stems.ts
 *   npx tsx scripts/cleanup-gap-stems.ts --slug=my-test-slug
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { canUsePrisma } from "../src/lib/db";
import { DATA_DIR } from "../src/lib/paths";
import { prisma } from "../src/lib/prisma";
import {
  sanitizePartGapStems,
  shouldClearInlineGapStem,
} from "../src/lib/questions/gap-stems";
import type { QuestionDraft } from "../src/lib/import/schemas";

const TESTS_DIR = path.join(DATA_DIR, "tests");

type StoredPart = {
  title?: string;
  order?: number;
  content?: string | null;
  questions?: Array<{
    number: number;
    order: number;
    type: string;
    content?: Record<string, unknown>;
    correctAnswer?: unknown;
    acceptableAnswers?: string[];
    explanation?: string;
  }>;
};

type StoredTest = {
  slug: string;
  title?: string;
  parts?: StoredPart[];
};

function slugFilter(): string | null {
  const arg = process.argv.find((a) => a.startsWith("--slug="));
  return arg ? arg.slice("--slug=".length).trim() || null : null;
}

function asDrafts(part: StoredPart): QuestionDraft[] {
  return (part.questions ?? []).map((q, i) => ({
    number: q.number,
    order: q.order ?? i,
    type: q.type as QuestionDraft["type"],
    content: (q.content ?? {}) as Record<string, unknown>,
    correctAnswer: q.correctAnswer,
    acceptableAnswers: q.acceptableAnswers,
    explanation: q.explanation,
  }));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const onlySlug = slugFilter();
  console.log(
    dryRun
      ? "DRY RUN — no writes"
      : "Cleaning redundant gap stems on existing tests…",
  );
  if (onlySlug) console.log(`Filter slug=${onlySlug}`);

  let localTestsTouched = 0;
  let localQuestionsCleared = 0;

  try {
    const files = (await readdir(TESTS_DIR)).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const full = path.join(TESTS_DIR, file);
      const raw = await readFile(full, "utf8");
      const test = JSON.parse(raw) as StoredTest;
      if (onlySlug && test.slug !== onlySlug) continue;

      let clearedHere = 0;
      const nextParts = (test.parts ?? []).map((part, idx) => {
        const drafts = asDrafts(part);
        const result = sanitizePartGapStems(
          part.title ?? `Part ${idx + 1}`,
          part.order ?? idx,
          part.content,
          drafts,
        );
        clearedHere += result.cleared;
        if (!result.cleared) return part;
        return {
          ...part,
          questions: (part.questions ?? []).map((q) => {
            const cleaned = result.questions.find((d) => d.number === q.number);
            if (!cleaned) return q;
            return { ...q, content: cleaned.content as Record<string, unknown> };
          }),
        };
      });

      if (!clearedHere) continue;
      localTestsTouched += 1;
      localQuestionsCleared += clearedHere;
      console.log(
        `  local ${test.slug}: clear ${clearedHere} stem(s) (${test.title ?? "?"})`,
      );
      if (!dryRun) {
        await writeFile(
          full,
          JSON.stringify({ ...test, parts: nextParts }, null, 2),
          "utf8",
        );
      }
    }
  } catch (e) {
    console.warn(
      "Local data/tests scan skipped:",
      e instanceof Error ? e.message : e,
    );
  }

  let dbQuestionsCleared = 0;
  let dbQuestionsScanned = 0;
  if (await canUsePrisma()) {
    const tests = await prisma.test.findMany({
      where: onlySlug ? { slug: onlySlug } : undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        sections: {
          select: {
            id: true,
            title: true,
            order: true,
            content: true,
            questions: {
              select: {
                id: true,
                number: true,
                order: true,
                type: true,
                content: true,
              },
            },
          },
        },
      },
    });

    for (const test of tests) {
      for (const section of test.sections) {
        for (const q of section.questions) {
          dbQuestionsScanned += 1;
          const draft: QuestionDraft = {
            number: q.number,
            order: q.order,
            type: q.type as QuestionDraft["type"],
            content: (q.content ?? {}) as Record<string, unknown>,
          };
          if (!shouldClearInlineGapStem(draft, section.content)) continue;
          dbQuestionsCleared += 1;
          console.log(
            `  db ${test.slug} Q${q.number} (${section.title}): clear stem`,
          );
          if (!dryRun) {
            const content = {
              ...((q.content ?? {}) as Record<string, unknown>),
              stem: "",
              blank: true,
            };
            await prisma.question.update({
              where: { id: q.id },
              data: { content },
            });
          }
        }
      }
    }
    await prisma.$disconnect();
  } else {
    console.log("DB unavailable — skipped Prisma cleanup.");
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        slug: onlySlug,
        localTestsTouched,
        localQuestionsCleared,
        dbQuestionsScanned,
        dbQuestionsCleared,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
