/**
 * Validates data/learn/worksheets/*.json: every question is gradable (or has a model answer),
 * gap counts match keys, MC keys point at real options, and the catalog counts are in sync.
 *
 *   npx tsx scripts/test-worksheets.ts            # all worksheets
 *   npx tsx scripts/test-worksheets.ts ws-34 ws-35
 *   npx tsx scripts/test-worksheets.ts --no-catalog ws-34   # skip catalog count check
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { checkAnswer, parseKeyGaps } from "../src/lib/learn/worksheet-grader";
import type { WorksheetCatalogItem, WorksheetLesson } from "../src/lib/learn/worksheet-types";

const ROOT = path.join(__dirname, "..", "data", "learn");
const DIR = path.join(ROOT, "worksheets");
const GAP_TYPES = new Set(["inline_gap_fill", "passage_gap_fill", "verb_conjugation", "matching"]);
const SENTENCE_TYPES = new Set([
  "sentence_rewrite",
  "sentence_building",
  "sentence_combine",
  "question_formation",
  "reading_qa",
  "error_correction",
]);
const ALL_TYPES = new Set([...GAP_TYPES, ...SENTENCE_TYPES, "multiple_choice"]);

const args = process.argv.slice(2);
const skipCatalog = args.includes("--no-catalog");
const only = args.filter((a) => !a.startsWith("--"));
const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => only.length === 0 || only.includes(f.replace(/\.json$/, "")))
  .sort();

const catalog = (JSON.parse(readFileSync(path.join(ROOT, "worksheets-catalog.json"), "utf8")) as {
  worksheets: WorksheetCatalogItem[];
}).worksheets;

let errors = 0;
let totalQ = 0;
let keyed = 0;
let model = 0;

function fail(ws: string, msg: string) {
  errors++;
  console.log(`  ✗ ${ws}: ${msg}`);
}

for (const file of files) {
  const wsId = file.replace(/\.json$/, "");
  let lesson: WorksheetLesson;
  try {
    lesson = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
  } catch (e) {
    fail(wsId, `invalid JSON: ${(e as Error).message}`);
    continue;
  }

  const ids = new Set<string>();
  let qCount = 0;
  for (const s of lesson.sections) {
    if (!ALL_TYPES.has(s.type)) fail(wsId, `${s.id} unknown type ${s.type}`);
    if (s.questions.length === 0) fail(wsId, `${s.id} has no questions`);
    for (const q of s.questions) {
      qCount++;
      const where = `${q.id}`;
      if (ids.has(q.id)) fail(wsId, `duplicate id ${q.id}`);
      ids.add(q.id);
      if (!q.prompt?.trim()) fail(wsId, `${where} empty prompt`);
      if (/[…]{1,}|\.{3,}|_{3,}/.test(q.prompt)) fail(wsId, `${where} leftover dots/underscores in prompt: ${q.prompt}`);

      const keys = (q.acceptedAnswers ?? []).filter((k) => k.trim());
      if (keys.length === 0) {
        if (q.modelAnswer?.trim()) model++;
        else fail(wsId, `${where} no acceptedAnswers and no modelAnswer`);
        continue;
      }
      keyed++;

      const gaps = (q.prompt.match(/\[gap\]/g) ?? []).length;
      if (s.type === "multiple_choice") {
        const letters = (q.options ?? []).map((o, i) => (o.match(/^([a-z])\)/i)?.[1] ?? String.fromCharCode(97 + i)).toLowerCase());
        if (letters.length < 2) fail(wsId, `${where} multiple_choice needs ≥2 options`);
        for (const k of keys) if (!letters.includes(k.trim().toLowerCase())) fail(wsId, `${where} key "${k}" not in options ${letters.join(",")}`);
      } else if (GAP_TYPES.has(s.type)) {
        if (gaps === 0) fail(wsId, `${where} ${s.type} prompt has no [gap]`);
        for (const k of keys) {
          const n = parseKeyGaps(k).length;
          if (n !== gaps) fail(wsId, `${where} key "${k}" has ${n} gap(s), prompt has ${gaps}`);
        }
      } else if (SENTENCE_TYPES.has(s.type)) {
        if (gaps > 0) fail(wsId, `${where} sentence-type prompt should not contain [gap]`);
        for (const k of keys) if (k.includes(" / ")) fail(wsId, `${where} sentence key contains " / ": ${k}`);
      }

      for (const k of keys) {
        const first = parseKeyGaps(k).map((alts) => alts[0]).join(" / ");
        if (!checkAnswer(first, keys).isCorrect) fail(wsId, `${where} key does not grade itself: ${k}`);
      }
    }
  }
  totalQ += qCount;

  const meta = catalog.find((c) => c.id === lesson.id);
  if (skipCatalog) continue;
  if (!meta) fail(wsId, "missing from catalog");
  else {
    if (meta.questionCount !== qCount) fail(wsId, `catalog questionCount ${meta.questionCount} ≠ ${qCount}`);
    if (meta.sectionCount !== lesson.sections.length) fail(wsId, `catalog sectionCount ${meta.sectionCount} ≠ ${lesson.sections.length}`);
  }
}

console.log(`\n${files.length} worksheets · ${totalQ} questions · ${keyed} keyed · ${model} model-answer only · ${errors} error(s)`);
process.exit(errors > 0 ? 1 : 0);
