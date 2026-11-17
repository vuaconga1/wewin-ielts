/**
 * Benchmark Fluid Active CPU hotspots (catalog / attempts / reports).
 * Usage: npx tsx scripts/bench-fluid-cpu-hotspots.ts
 * Writes JSON summary to scripts/.bench-fluid-cpu-latest.json
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";

function bytesOf(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function ms(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

async function main() {
  const { listTests, listAttempts, findOpenAttempt, invalidateTestCatalogCache } =
    await import("../src/lib/store/test-store");
  const { buildAdminReportsUncached } = await import("../src/lib/admin/reports");

  invalidateTestCatalogCache();

  const t0 = process.hrtime.bigint();
  const tests = await listTests();
  const listTestsMs = ms(t0);

  let questionContentBytes = 0;
  let questionCount = 0;
  for (const test of tests) {
    for (const part of test.parts) {
      for (const q of part.questions) {
        questionCount += 1;
        questionContentBytes += bytesOf(q.content ?? {});
      }
    }
  }

  const catalogBytes = bytesOf(tests);
  const tClone = process.hrtime.bigint();
  const cloned = tests.slice();
  const structuredCloneMs = ms(tClone);
  void cloned;

  const tAttempts = process.hrtime.bigint();
  const attempts = await listAttempts({ lean: true });
  const listAttemptsMs = ms(tAttempts);
  const attemptsBytes = bytesOf(attempts);

  const sampleUserId =
    attempts.find((a) => a.userId)?.userId ??
    attempts[0]?.userId ??
    null;
  const sampleSlug = attempts.find((a) => a.userId)?.testSlug ?? tests[0]?.slug;

  let findOpenMs: number | null = null;
  if (sampleUserId && sampleSlug) {
    const tFind = process.hrtime.bigint();
    await findOpenAttempt({
      testSlug: sampleSlug,
      userId: sampleUserId,
      mode: "FULL",
      sectionOrders: tests.find((t) => t.slug === sampleSlug)?.parts.map((p) => p.order) ?? [0],
    });
    findOpenMs = ms(tFind);
  }

  let reportsMs: number | null = null;
  let reportRows = 0;
  try {
    const tReports = process.hrtime.bigint();
    const rows = await buildAdminReportsUncached();
    reportsMs = ms(tReports);
    reportRows = rows.length;
  } catch (error) {
    console.warn(
      "buildAdminReportsUncached skipped:",
      error instanceof Error ? error.message : error,
    );
  }

  const summary = {
    at: new Date().toISOString(),
    tests: tests.length,
    questionCount,
    catalogBytes,
    catalogMB: Number((catalogBytes / (1024 * 1024)).toFixed(3)),
    questionContentBytes,
    questionContentMB: Number((questionContentBytes / (1024 * 1024)).toFixed(3)),
    listTestsMs: Number(listTestsMs.toFixed(1)),
    structuredCloneMs: Number(structuredCloneMs.toFixed(1)),
    attempts: attempts.length,
    attemptsBytes,
    attemptsMB: Number((attemptsBytes / (1024 * 1024)).toFixed(3)),
    listAttemptsMs: Number(listAttemptsMs.toFixed(1)),
    findOpenMs: findOpenMs != null ? Number(findOpenMs.toFixed(1)) : null,
    reportsMs: reportsMs != null ? Number(reportsMs.toFixed(1)) : null,
    reportRows,
  };

  const out = path.join(process.cwd(), "scripts", ".bench-fluid-cpu-latest.json");
  writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
