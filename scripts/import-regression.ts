/**
 * Regression checks for IELTS luyện đề import quality.
 *
 * Run:
 *   npx tsx scripts/import-regression.ts
 *
 * Asserts part counts / question counts (and answers when keys exist)
 * against templates/ + optional Castle real docs on disk.
 */

import path from "node:path";
import { access } from "node:fs/promises";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import { parseKeysDocument } from "../src/lib/import/parse-keys";
import { extractFileWithMeta, normalizeExtractedText } from "../src/lib/import/docx";

type Expectation = {
  name: string;
  file: string;
  keys?: string;
  skill?: "LISTENING" | "READING" | "WRITING" | "SPEAKING";
  /** Skip if file missing (optional real samples) */
  optional?: boolean;
  parts: number;
  /** Total questions across parts */
  questions: number;
  /** Per-part question counts, if known */
  perPart?: number[];
  /** Every L/R question must have an answer */
  requireAnswers?: boolean;
  /** Expected issue codes (subset) */
  expectIssueCodes?: string[];
  /** Issue codes that must NOT appear */
  forbidIssueCodes?: string[];
};

const CASTLE =
  "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment";
const TEST6 = "e:/Wewin/Test 6";

const cases: Expectation[] = [
  {
    name: "sample-listening (templates)",
    file: "templates/sample-listening.md",
    keys: "templates/sample-keys.md",
    parts: 4,
    questions: 9,
    perPart: [3, 2, 2, 2],
    requireAnswers: true,
    forbidIssueCodes: ["KEYS_EMPTY", "KEYS_IMAGE_ONLY", "PART_FALLBACK"],
  },
  {
    name: "sample-writing (templates)",
    file: "templates/sample-writing.md",
    parts: 2,
    questions: 2,
    perPart: [1, 1],
  },
  {
    name: "castle-listening + text keys",
    file: path.join(CASTLE, "Listening 5.docx"),
    keys: "templates/castle-listening-keys.md",
    optional: true,
    parts: 4,
    questions: 40,
    perPart: [10, 10, 10, 10],
    requireAnswers: true,
    forbidIssueCodes: ["KEYS_EMPTY", "KEYS_IMAGE_ONLY", "PART_NO_QUESTIONS"],
  },
  {
    name: "castle-reading + text keys",
    file: path.join(CASTLE, "Reading 5.docx"),
    keys: "templates/castle-reading-keys.md",
    optional: true,
    parts: 3,
    questions: 40,
    perPart: [13, 13, 14],
    requireAnswers: true,
    forbidIssueCodes: ["KEYS_EMPTY", "KEYS_IMAGE_ONLY", "PART_NO_QUESTIONS"],
  },
  {
    name: "castle-writing",
    file: path.join(CASTLE, "WRITING 5.docx"),
    optional: true,
    parts: 2,
    questions: 2,
    perPart: [1, 1],
  },
  {
    name: "castle-keyss image-only (listening)",
    file: path.join(CASTLE, "Listening 5.docx"),
    keys: path.join(CASTLE, "Keyss.docx"),
    optional: true,
    parts: 4,
    questions: 40,
    expectIssueCodes: ["KEYS_IMAGE_ONLY"],
  },
  {
    name: "test6 listening — section4 synthetic from ranges",
    file: path.join(TEST6, "Test 6(1).docx"),
    skill: "LISTENING",
    optional: true,
    parts: 4,
    questions: 40,
    perPart: [10, 10, 10, 10],
    expectIssueCodes: ["PART_SYNTHETIC_QUESTIONS"],
  },
  {
    name: "test6 reading — 40Q incl. flowchart synthetic",
    file: path.join(TEST6, "Reading 6.docx"),
    optional: true,
    parts: 3,
    questions: 40,
    perPart: [13, 13, 14],
    expectIssueCodes: ["PART_SYNTHETIC_QUESTIONS"],
  },
];

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function fail(msg: string): never {
  throw new Error(msg);
}

async function runCase(c: Expectation): Promise<"ok" | "skip"> {
  const file = path.resolve(c.file);
  if (!(await exists(file))) {
    if (c.optional) {
      console.log(`SKIP  ${c.name} (missing ${c.file})`);
      return "skip";
    }
    fail(`Missing required file: ${c.file}`);
  }
  if (c.keys && !(await exists(path.resolve(c.keys)))) {
    if (c.optional) {
      console.log(`SKIP  ${c.name} (missing keys ${c.keys})`);
      return "skip";
    }
    fail(`Missing keys: ${c.keys}`);
  }

  const { draft, issues } = await parseTestFromFiles({
    contentPath: file,
    keysPath: c.keys ? path.resolve(c.keys) : undefined,
    skill: c.skill,
  });

  if (!draft) fail(`${c.name}: no draft\n` + issues.map((i) => i.message).join("\n"));

  if (draft.parts.length !== c.parts) {
    fail(
      `${c.name}: expected ${c.parts} parts, got ${draft.parts.length} (${draft.parts.map((p) => p.title).join(" | ")})`,
    );
  }

  const totalQ = draft.parts.reduce((n, p) => n + p.questions.length, 0);
  if (totalQ !== c.questions) {
    fail(
      `${c.name}: expected ${c.questions} questions, got ${totalQ} ` +
        `[${draft.parts.map((p) => p.questions.length).join(",")}]`,
    );
  }

  if (c.perPart) {
    for (let i = 0; i < c.perPart.length; i++) {
      const got = draft.parts[i]!.questions.length;
      const want = c.perPart[i]!;
      if (got !== want) {
        fail(
          `${c.name}: part[${i}] "${draft.parts[i]!.title}" expected ${want}Q, got ${got}`,
        );
      }
    }
  }

  if (c.requireAnswers) {
    for (const part of draft.parts) {
      for (const q of part.questions) {
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          fail(`${c.name}: Q${q.number} in "${part.title}" missing answer`);
        }
      }
    }
  }

  const codes = new Set(issues.map((i) => i.code));
  for (const code of c.expectIssueCodes ?? []) {
    if (!codes.has(code)) {
      fail(`${c.name}: expected issue code ${code}, got [${[...codes].join(", ")}]`);
    }
  }
  for (const code of c.forbidIssueCodes ?? []) {
    if (codes.has(code)) {
      fail(`${c.name}: unexpected issue code ${code}`);
    }
  }

  console.log(
    `OK    ${c.name} — ${draft.parts.length} parts, ${totalQ}Q` +
      (issues.length ? ` (${issues.length} issue(s))` : ""),
  );
  return "ok";
}

async function runKeyFixtures(): Promise<void> {
  // Spreadsheet STT/Đáp án fixtures in templates/
  const listening = await import("node:fs/promises").then((fs) =>
    fs.readFile(
      path.resolve("templates/castle-listening-keys.md"),
      "utf8",
    ),
  );
  const reading = await import("node:fs/promises").then((fs) =>
    fs.readFile(path.resolve("templates/castle-reading-keys.md"), "utf8"),
  );

  const lMap = parseKeysDocument(listening, { skill: "LISTENING" });
  const rMap = parseKeysDocument(reading, { skill: "READING" });
  if (lMap.size !== 40) fail(`castle-listening-keys: expected 40, got ${lMap.size}`);
  if (rMap.size !== 40) fail(`castle-reading-keys: expected 40, got ${rMap.size}`);
  if (rMap.get(2)?.answer !== "NOT GIVEN") {
    fail(`castle-reading-keys Q2 should normalize NGV → NOT GIVEN`);
  }
  console.log("OK    key fixtures (castle listening/reading = 40 each)");

  // Image-only Keyss detection (optional)
  const keyss = path.join(CASTLE, "Keyss.docx");
  if (await exists(keyss)) {
    const meta = await extractFileWithMeta(keyss, { includeTables: true });
    const text = normalizeExtractedText(meta.text);
    const map = parseKeysDocument(text);
    if (!meta.looksImageOnly) {
      fail("Keyss.docx should look image-only");
    }
    if (map.size !== 0) {
      fail(`Keyss.docx should parse 0 keys, got ${map.size}`);
    }
    console.log(
      `OK    Keyss.docx image-only (images=${meta.imageCount}, textLen=${text.length})`,
    );
  } else {
    console.log("SKIP  Keyss.docx image-only check");
  }
}

async function main() {
  let ok = 0;
  let skip = 0;
  const errors: string[] = [];

  try {
    await runKeyFixtures();
    ok += 1;
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  for (const c of cases) {
    try {
      const r = await runCase(c);
      if (r === "ok") ok += 1;
      else skip += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`FAIL  ${c.name}\n      ${msg}`);
      errors.push(msg);
    }
  }

  console.log(`\n=== Regression: ${ok} ok, ${skip} skipped, ${errors.length} failed ===`);
  if (errors.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
