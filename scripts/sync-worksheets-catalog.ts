/**
 * Recompute sectionCount / questionCount in data/learn/worksheets-catalog.json from the worksheet files.
 *   npx tsx scripts/sync-worksheets-catalog.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { WorksheetCatalogItem, WorksheetLesson } from "../src/lib/learn/worksheet-types";

const ROOT = path.join(__dirname, "..", "data", "learn");
const catalogPath = path.join(ROOT, "worksheets-catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as { worksheets: WorksheetCatalogItem[] };

let changed = 0;
for (const item of catalog.worksheets) {
  const lesson = JSON.parse(
    readFileSync(path.join(ROOT, "worksheets", `${item.id}.json`), "utf8"),
  ) as WorksheetLesson;
  const sectionCount = lesson.sections.length;
  const questionCount = lesson.sections.reduce((n, s) => n + s.questions.length, 0);
  if (item.sectionCount !== sectionCount || item.questionCount !== questionCount) {
    console.log(`${item.id}: ${item.sectionCount}/${item.questionCount} -> ${sectionCount}/${questionCount}`);
    item.sectionCount = sectionCount;
    item.questionCount = questionCount;
    changed++;
  }
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Updated ${changed} catalog entr${changed === 1 ? "y" : "ies"}.`);
