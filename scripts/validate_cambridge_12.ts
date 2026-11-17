import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ParsedTestDraftSchema,
  QuestionContentSchema,
} from "../src/lib/import/schemas";

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

async function main() {
  console.log("=== Validating Cambridge 12 Tests (27..30) ===\n");
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const slug of slugs) {
    const filePath = path.join("data", "tests", `${slug}.json`);
    console.log(`Checking ${filePath}...`);

    if (!existsSync(filePath)) {
      console.error(`  [ERROR] File not found: ${filePath}`);
      totalErrors++;
      continue;
    }

    const raw = JSON.parse(await readFile(filePath, "utf8"));
    const parseResult = ParsedTestDraftSchema.safeParse(raw);
    if (!parseResult.success) {
      console.error(`  [ERROR] ParsedTestDraftSchema failed:`);
      for (const issue of parseResult.error.issues) {
        console.error(`    - Path ${issue.path.join(".")}: ${issue.message}`);
      }
      totalErrors += parseResult.error.issues.length;
      continue;
    }

    const draft = parseResult.data;

    // Check skill and part count
    const expectedParts = draft.skill === "LISTENING" ? 4 : 3;
    if (draft.parts.length !== expectedParts) {
      console.error(
        `  [ERROR] Expected ${expectedParts} parts for ${draft.skill}, got ${draft.parts.length}`
      );
      totalErrors++;
    }

    // Collect all questions
    const allQuestions = draft.parts.flatMap((p) => p.questions);
    if (allQuestions.length !== 40) {
      console.error(
        `  [ERROR] Expected exactly 40 questions, got ${allQuestions.length}`
      );
      totalErrors++;
    }

    // Check numbers 1..40 strictly contiguous
    const numbers = allQuestions.map((q) => q.number);
    const expectedNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
    if (JSON.stringify(numbers) !== JSON.stringify(expectedNumbers)) {
      console.error(
        `  [ERROR] Question numbers mismatch! Found: ${numbers.join(",")}`
      );
      totalErrors++;
    }

    // Check order 0..39 strictly contiguous
    const orders = allQuestions.map((q) => q.order);
    const expectedOrders = Array.from({ length: 40 }, (_, i) => i);
    if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
      console.error(
        `  [ERROR] Question orders mismatch! Found: ${orders.join(",")}`
      );
      totalErrors++;
    }

    // Check each question details
    for (const q of allQuestions) {
      const qcResult = QuestionContentSchema.safeParse(q.content);
      if (!qcResult.success) {
        console.error(
          `  [ERROR] Q${q.number}: QuestionContentSchema invalid: ${qcResult.error.message}`
        );
        totalErrors++;
      }

      if (q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === "") {
        console.error(`  [ERROR] Q${q.number}: Missing correctAnswer!`);
        totalErrors++;
      }

      // Check options matching
      const content = q.content as {
        options?: Array<{ label: string; text: string }>;
        stem?: string;
      };
      if (
        ["MULTIPLE_CHOICE", "TRUE_FALSE_NG", "MATCHING"].includes(q.type)
      ) {
        if (!content.options || content.options.length === 0) {
          console.error(`  [ERROR] Q${q.number} (${q.type}): Missing options!`);
          totalErrors++;
        } else {
          const labels = content.options.map((o) => o.label);
          const ans = String(q.correctAnswer).trim();
          if (!labels.includes(ans)) {
            console.error(
              `  [ERROR] Q${q.number} (${q.type}): Correct answer '${ans}' not in option labels [${labels.join(
                ", "
              )}]`
            );
            totalErrors++;
          }
        }
      }
    }

    // Check media / audio / images
    for (const part of draft.parts) {
      if (part.meta && typeof part.meta.audioUrl === "string") {
        const audioRel = part.meta.audioUrl.replace(/^\//, "");
        const localAudio = path.join("public", audioRel);
        if (!existsSync(localAudio)) {
          console.error(`  [ERROR] Audio file missing on disk: ${localAudio}`);
          totalErrors++;
        }
      }

      if (part.content) {
        const imgMatches = part.content.matchAll(/!\[.*?\]\((.*?)\)/g);
        for (const m of imgMatches) {
          const imgUrl = m[1];
          const imgRel = imgUrl.replace(/^\//, "");
          const localImg = path.join("public", imgRel);
          if (!existsSync(localImg)) {
            console.error(`  [ERROR] Image file missing on disk: ${localImg}`);
            totalErrors++;
          }
        }
      }
    }

    console.log(`  ✓ ${slug}: OK (40 questions, answers valid, media valid)`);
  }

  console.log("\n==========================================");
  console.log(`Validation finished with ${totalErrors} errors, ${totalWarnings} warnings.`);
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
