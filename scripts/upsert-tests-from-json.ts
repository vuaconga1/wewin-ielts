/**
 * Upsert local data/tests/*.json into Postgres (Neon) by slug.
 *
 * Usage:
 *   npx tsx scripts/upsert-tests-from-json.ts
 *   npx tsx scripts/upsert-tests-from-json.ts --only test-1,test-9
 *   npx tsx scripts/upsert-tests-from-json.ts --env-file .env.prod.local
 *
 * Safety: upserts tests only (no migrate reset, no user deletes).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const envFile = arg("env-file") ?? ".env";
config({ path: path.resolve(envFile) });
// Also load default .env so local tooling still works when --env-file is partial
if (envFile !== ".env") {
  config({ path: path.resolve(".env") });
}

function redactUrl(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(invalid)";
  }
}

async function main() {
  const onlyRaw = arg("only");
  const onlyPrefixes = onlyRaw
    ? onlyRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!dbUrl) {
    console.error(`DATABASE_URL missing (loaded from ${envFile})`);
    process.exit(1);
  }
  if (/USER:PASSWORD|ep-xxx|\[SENSITIVE\]/i.test(dbUrl)) {
    console.error(
      `DATABASE_URL looks like a placeholder (${redactUrl(dbUrl)}). Aborting.`,
    );
    process.exit(1);
  }

  console.log(`Env file: ${envFile}`);
  console.log(`DB host:  ${hostOf(dbUrl)}`);

  const { resetDbProbeCache, canUsePrisma } = await import("../src/lib/db");
  resetDbProbeCache();
  if (!(await canUsePrisma())) {
    console.error("Database probe failed — check DATABASE_URL / network.");
    process.exit(1);
  }

  const { persistParsedTest } = await import("../src/lib/import/persist");
  const { ParsedTestDraftSchema } = await import("../src/lib/import/schemas");
  const { prisma } = await import("../src/lib/prisma");

  const testsDir = path.resolve("data/tests");
  let files = (await readdir(testsDir)).filter((f) => f.endsWith(".json"));
  if (onlyPrefixes?.length) {
    files = files.filter((f) =>
      onlyPrefixes.some((p) => f.startsWith(p) || f.replace(/\.json$/, "") === p),
    );
  }
  files.sort();

  if (!files.length) {
    console.error("No matching JSON files under data/tests/");
    process.exit(1);
  }

  console.log(`Upserting ${files.length} file(s)…`);
  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const slugHint = file.replace(/\.json$/, "");
    try {
      const raw = JSON.parse(
        await readFile(path.join(testsDir, file), "utf8"),
      ) as unknown;
      const parsed = ParsedTestDraftSchema.safeParse(raw);
      if (!parsed.success) {
        console.error(`  ✗ ${slugHint}: schema invalid`, parsed.error.issues[0]);
        fail += 1;
        continue;
      }
      const draft = parsed.data;
      const result = await persistParsedTest(draft, [], {
        force: true,
        status: "PUBLISHED",
      });
      console.log(
        `  ✓ ${draft.slug} → testId=${result.testId} job=${result.importJobId}`,
      );
      ok += 1;
    } catch (e) {
      fail += 1;
      console.error(
        `  ✗ ${slugHint}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const count = await prisma.test.count({ where: { status: "PUBLISHED" } });
  console.log(`\nDone. ok=${ok} fail=${fail}. PUBLISHED tests in DB: ${count}`);
  await prisma.$disconnect();
  if (fail) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  try {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
