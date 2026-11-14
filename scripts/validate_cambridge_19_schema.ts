import { readFile } from "node:fs/promises";
import path from "node:path";
import { ParsedTestDraftSchema } from "../src/lib/import/schemas";
import {
  applyQuestionLayoutVariants,
  validateQuestionLayouts,
} from "../src/lib/questions/layout-variants";

const slugs = [
  "test-19-listening",
  "test-19-reading",
  "test-20-listening",
  "test-20-reading",
  "test-21-listening",
  "test-21-reading",
  "test-22-listening",
  "test-22-reading",
];

async function main() {
  console.log("=== VALIDATING CAMBRIDGE 19 WITH ZOD SCHEMA & LAYOUT VALIDATOR ===");
  let hasError = false;

  for (const slug of slugs) {
    const filePath = path.resolve(`data/tests/${slug}.json`);
    const raw = JSON.parse(await readFile(filePath, "utf8"));

    const parsed = ParsedTestDraftSchema.safeParse(raw);
    if (!parsed.success) {
      console.error(`FAIL: ${slug} Zod validation error:`, parsed.error.issues);
      hasError = true;
      continue;
    }

    const normalized = applyQuestionLayoutVariants(parsed.data);
    const layoutIssues = validateQuestionLayouts(normalized);
    if (layoutIssues.length > 0) {
      console.warn(`WARN: ${slug} layout issues:`, layoutIssues);
    }

    console.log(`PASS: ${slug} (Zod valid, layout checked: ${layoutIssues.length} issues)`);
  }

  if (hasError) {
    process.exit(1);
  } else {
    console.log("\nALL 8 TESTS ARE STRICTLY SCHEMA-COMPLIANT!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
