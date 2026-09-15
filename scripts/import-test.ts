/**
 * CLI: parse (and optionally persist) a test file.
 *
 * Parse only (no DB):
 *   npx tsx scripts/import-test.ts --file templates/sample-listening.md
 *
 * With keys:
 *   npx tsx scripts/import-test.ts --file templates/sample-listening.md --keys templates/sample-keys.md
 *
 * Persist to MySQL (requires .env + migrate):
 *   npx tsx scripts/import-test.ts --file templates/sample-listening.md --persist
 *
 * Note (Windows/npm): prefer `npx tsx scripts/import-test.ts --file ...`
 * over `npm run import:test -- --file ...` — some npm versions swallow `--file`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import type { Skill } from "../src/lib/import/detect-skill";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Fallback when npm strips `--file` / `--keys` on Windows. */
function positionalFileAndKeys(): { file?: string; keys?: string } {
  const positional = process.argv
    .slice(2)
    .filter(
      (a) =>
        !a.startsWith("--") &&
        !/^(LISTENING|READING|WRITING|SPEAKING)$/i.test(a),
    );
  const flagged = new Set<string>();
  for (const name of ["file", "keys", "skill", "title", "slug"]) {
    const v = arg(name);
    if (v) flagged.add(v);
  }
  const rest = positional.filter((p) => !flagged.has(p));
  return { file: rest[0], keys: rest[1] };
}

async function main() {
  const pos = positionalFileAndKeys();
  const file = arg("file") ?? pos.file;
  if (!file) {
    console.error(
      "Usage: npx tsx scripts/import-test.ts --file <path> [--keys <path>] [--skill LISTENING] [--persist] [--force]",
    );
    process.exit(1);
  }

  const keys = arg("keys") ?? pos.keys;
  const skill = arg("skill") as Skill | undefined;
  const title = arg("title");
  const slug = arg("slug");

  const { draft, issues } = await parseTestFromFiles({
    contentPath: path.resolve(file),
    keysPath: keys ? path.resolve(keys) : undefined,
    skill,
    title,
    slug,
    sourceFolder: path.dirname(path.resolve(file)),
  });

  console.log("\n=== Import issues ===");
  if (!issues.length) console.log("(none)");
  for (const issue of issues) {
    console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
  }

  if (!draft) {
    console.error("\nParse failed — no draft produced.");
    process.exit(1);
  }

  console.log("\n=== Draft summary ===");
  console.log(`Title: ${draft.title}`);
  console.log(`Slug:  ${draft.slug}`);
  console.log(`Skill: ${draft.skill}`);
  console.log(`Parts: ${draft.parts.length}`);
  for (const part of draft.parts) {
    console.log(
      `  [${part.order}] ${part.title} — ${part.questions.length} question(s)`,
    );
    for (const q of part.questions) {
      const ans =
        q.correctAnswer === undefined
          ? "(no answer)"
          : JSON.stringify(q.correctAnswer);
      console.log(`       Q${q.number} [${q.type}] → ${ans}`);
    }
  }

  const outDir = path.resolve("tmp");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${draft.slug}.draft.json`);
  await writeFile(outPath, JSON.stringify({ draft, issues }, null, 2), "utf8");
  console.log(`\nWrote draft JSON → ${outPath}`);

  const { saveTestDraft } = await import("../src/lib/store/test-store");
  await saveTestDraft(draft);
  console.log(`Saved local draft → data/tests/${draft.slug}.json`);

  const fatal = issues.some((i) => i.level === "error");
  if (hasFlag("persist")) {
    if (fatal && !hasFlag("force")) {
      console.error("\nRefusing to persist: fix errors or pass --force");
      process.exit(1);
    }
    try {
      const { persistParsedTest } = await import("../src/lib/import/persist");
      const result = await persistParsedTest(draft, issues, {
        force: hasFlag("force"),
        status: "DRAFT",
      });
      console.log("\n=== Persist ===");
      console.log(`importJobId: ${result.importJobId}`);
      console.log(`testId:      ${result.testId}`);
    } catch (e) {
      console.warn(
        "\nDB persist failed (local draft still saved):",
        e instanceof Error ? e.message : e,
      );
    }
  } else {
    console.log("\n(Dry-run / local only. Add --persist to also write DB.)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
