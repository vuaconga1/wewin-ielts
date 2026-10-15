import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ParsedTestDraftSchema } from "../src/lib/import/schemas";
import { normalizeTestMapLabelLayouts } from "../src/lib/questions/map-label-layout";

async function main() {
  const dir = path.resolve("data/tests");
  const files = (await readdir(dir)).filter((file) => file.endsWith("-listening.json"));
  let changed = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    const raw = JSON.parse(await readFile(full, "utf8"));
    const parsed = ParsedTestDraftSchema.parse(raw);
    const normalized = normalizeTestMapLabelLayouts(parsed);
    const before = JSON.stringify(parsed);
    const after = JSON.stringify(normalized);
    if (before === after) continue;
    const savedAt = typeof raw.savedAt === "string" ? { savedAt: raw.savedAt } : {};
    await writeFile(full, JSON.stringify({ ...normalized, ...savedAt }, null, 2), "utf8");
    console.log(`normalized ${file}`);
    changed += 1;
  }
  console.log(`Done. changed=${changed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});