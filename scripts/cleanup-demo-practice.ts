/**
 * Remove non–Google Drive practice tests from the local file store
 * (and Neon DB if connected). Drive imports keep `sourceFolder` like
 * `drive:<folderId>:<name>`.
 *
 * Usage:
 *   npx tsx scripts/cleanup-demo-practice.ts
 *   npx tsx scripts/cleanup-demo-practice.ts --dry-run
 */

import { unlink, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { canUsePrisma } from "../src/lib/db";
import { DATA_DIR } from "../src/lib/paths";
import { prisma } from "../src/lib/prisma";

const TESTS_DIR = path.join(DATA_DIR, "tests");
const ATTEMPTS_DIR = path.join(DATA_DIR, "attempts");

type StoredTestLite = {
  slug: string;
  title?: string;
  sourceFolder?: string;
};

function isDriveImport(sourceFolder?: string | null): boolean {
  return typeof sourceFolder === "string" && sourceFolder.startsWith("drive:");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(dryRun ? "DRY RUN — no deletes" : "Cleaning non-Drive practice demos…");

  // --- Local JSON catalog (what /tests actually lists) ---
  let localTestsDeleted = 0;
  let localAttemptsDeleted = 0;
  const demoSlugs = new Set<string>();

  try {
    const testFiles = (await readdir(TESTS_DIR)).filter((f) => f.endsWith(".json"));
    for (const file of testFiles) {
      const raw = await readFile(path.join(TESTS_DIR, file), "utf8");
      const test = JSON.parse(raw) as StoredTestLite;
      if (isDriveImport(test.sourceFolder)) continue;
      demoSlugs.add(test.slug);
      console.log(
        `  local test: ${test.slug} (${test.title ?? "?"}) sourceFolder=${test.sourceFolder ?? "(none)"}`,
      );
      if (!dryRun) await unlink(path.join(TESTS_DIR, file));
      localTestsDeleted++;
    }

    const attemptFiles = (await readdir(ATTEMPTS_DIR)).filter((f) =>
      f.endsWith(".json"),
    );
    for (const file of attemptFiles) {
      const raw = await readFile(path.join(ATTEMPTS_DIR, file), "utf8");
      const attempt = JSON.parse(raw) as { testSlug?: string };
      if (!attempt.testSlug || !demoSlugs.has(attempt.testSlug)) continue;
      console.log(`  local attempt: ${file} → ${attempt.testSlug}`);
      if (!dryRun) await unlink(path.join(ATTEMPTS_DIR, file));
      localAttemptsDeleted++;
    }
  } catch (e) {
    console.warn("Local data/ scan skipped:", e instanceof Error ? e.message : e);
  }

  // --- Neon (cascade deletes sections/questions/keys/attempts/media) ---
  let dbTestsDeleted = 0;
  if (await canUsePrisma()) {
    const nonDrive = await prisma.test.findMany({
      where: {
        OR: [{ sourceFolder: null }, { NOT: { sourceFolder: { startsWith: "drive:" } } }],
      },
      select: { id: true, slug: true, title: true, sourceFolder: true },
    });
    for (const t of nonDrive) {
      console.log(
        `  db test: ${t.slug} (${t.title}) sourceFolder=${t.sourceFolder ?? "(none)"}`,
      );
    }
    if (!dryRun && nonDrive.length) {
      const result = await prisma.test.deleteMany({
        where: { id: { in: nonDrive.map((t) => t.id) } },
      });
      dbTestsDeleted = result.count;
    } else {
      dbTestsDeleted = nonDrive.length;
    }
    await prisma.$disconnect();
  } else {
    console.log("DB unavailable — skipped Prisma cleanup.");
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        localTestsDeleted,
        localAttemptsDeleted,
        dbTestsDeleted,
        demoSlugs: [...demoSlugs],
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
