/**
 * Comprehensive validation of all Cambridge 21 tests (Reading, Listening, Writing, Speaking).
 * Verifies ParsedTestDraftSchema, answer keys, question counts, and media URLs.
 *
 * Usage: npx tsx scripts/validate_c21_all.ts
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ParsedTestDraftSchema } from "../src/lib/import/schemas";

const ALL_C21_SLUGS = [
  // Reading
  "test-15-reading",
  "test-16-reading",
  "test-17-reading",
  "test-18-reading",
  // Listening
  "test-15-listening",
  "test-16-listening",
  "test-17-listening",
  "test-18-listening",
  // Writing
  "test-15-writing",
  "test-16-writing",
  "test-17-writing",
  "test-18-writing",
  // Speaking
  "test-15-speaking",
  "test-16-speaking",
  "test-17-speaking",
  "test-18-speaking",
];

async function main() {
  console.log("=== VALIDATING ALL 16 CAMBRIDGE 21 TESTS ===");
  let hasError = false;

  for (const slug of ALL_C21_SLUGS) {
    const filePath = path.resolve(`data/tests/${slug}.json`);
    if (!existsSync(filePath)) {
      console.error(`FAIL: ${slug} missing file ${filePath}`);
      hasError = true;
      continue;
    }

    const raw = JSON.parse(await readFile(filePath, "utf8"));
    const parsed = ParsedTestDraftSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`FAIL: ${slug} Zod validation error:`, parsed.error.issues);
      hasError = true;
      continue;
    }

    const draft = parsed.data;
    let totalQuestions = 0;
    for (const part of draft.parts) {
      totalQuestions += part.questions.length;

      // Check mediaUrl in part or questions
      const imageUrl = part.meta?.imageUrl;
      if (imageUrl && imageUrl.startsWith("/uploads/")) {
        const localPath = path.resolve("public" + imageUrl);
        if (!existsSync(localPath)) {
          console.error(`FAIL: ${slug} missing media file: ${localPath}`);
          hasError = true;
        }
      }
      for (const q of part.questions) {
        const qImg = q.content.imageUrl || (q as any).mediaUrl;
        if (qImg && qImg.startsWith("/uploads/")) {
          const localPath = path.resolve("public" + qImg);
          if (!existsSync(localPath)) {
            console.error(`FAIL: ${slug} Q${q.number} missing media file: ${localPath}`);
            hasError = true;
          }
        }
      }
    }

    // Check audio files if listening
    if (draft.skill === "LISTENING") {
      if (!draft.audioFiles || draft.audioFiles.length !== 4) {
        console.error(`FAIL: ${slug} listening should have 4 audioFiles`);
        hasError = true;
      } else {
        for (const audio of draft.audioFiles) {
          const localAudio = path.resolve("public" + audio);
          if (!existsSync(localAudio)) {
            console.error(`FAIL: ${slug} missing audio file: ${localAudio}`);
            hasError = true;
          }
        }
      }
      if (totalQuestions !== 40) {
        console.error(`FAIL: ${slug} listening should have 40 questions, found ${totalQuestions}`);
        hasError = true;
      }
    }

    if (draft.skill === "READING") {
      if (totalQuestions !== 40) {
        console.error(`FAIL: ${slug} reading should have 40 questions, found ${totalQuestions}`);
        hasError = true;
      }
    }

    if (draft.skill === "WRITING") {
      if (draft.parts.length !== 2) {
        console.error(`FAIL: ${slug} writing should have 2 parts (Task 1 & Task 2)`);
        hasError = true;
      }
    }

    if (draft.skill === "SPEAKING") {
      if (draft.parts.length !== 3) {
        console.error(`FAIL: ${slug} speaking should have 3 parts`);
        hasError = true;
      }
    }

    console.log(`✓ PASS: ${slug} (skill=${draft.skill}, parts=${draft.parts.length}, questions=${totalQuestions})`);
  }

  if (hasError) {
    console.error("\nValidation failed with errors.");
    process.exit(1);
  } else {
    console.log("\nALL 16 CAMBRIDGE 21 TESTS ARE VALIDATED AND READY!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
