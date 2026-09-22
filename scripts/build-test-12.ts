/**
 * Build Test 12 Reading only.
 *
 * Usage: npx tsx scripts/build-test-12.ts
 *
 * Source: IELTS/Test 12/ — Reading 12.docx, keys.docx (text list, no L/W/audio).
 * Keys → Key 12.docx (Key 9 layout, Reading section only).
 * Matching F stays F (Q27, Q34). Choose TWO: Reading 21–22 = B/D.
 * Do NOT invent Listening/Writing stubs or audio.
 * Do NOT touch Speaking / Test 9 / other tests.
 */
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { parseKeysCanonical } from "../src/lib/import/normalize-keys";
import { mergeKeysIntoQuestions } from "../src/lib/import/parse-keys";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import { saveTestDraft } from "../src/lib/store/test-store";
import type { ParsedTestDraft } from "../src/lib/import/schemas";

const SRC = path.join(process.cwd(), "IELTS", "Test 12");
const ABS = "E:/Wewin/IELTS/Test 12";
const ROOT = process.cwd();

/** Typed from keys.docx body (already text; T/NG/F expanded for TFNG). */
function buildManualCanonicalKeysText(): string {
  return [
    "Reading",
    "",
    "Passage 1",
    "1. tree",
    "2. sheep",
    "3. soft",
    "4. rope",
    "5. mines",
    "6. steal",
    "7. TRUE",
    "8. NOT GIVEN",
    "9. NOT GIVEN",
    "10. NOT GIVEN",
    "11. FALSE",
    "12. TRUE",
    "13. FALSE",
    "",
    "Passage 2",
    "14. vii",
    "15. vi",
    "16. ix",
    "17. iv",
    "18. ii",
    "19. viii",
    "20. iii",
    "21. B",
    "22. D",
    "23. spirit",
    "24. drag",
    "25. records",
    "26. nutrition",
    "",
    "Passage 3",
    "27. F",
    "28. B",
    "29. H",
    "30. I",
    "31. A",
    "32. D",
    "33. B",
    "34. F",
    "35. C",
    "36. D",
    "37. E",
    "38. F",
    "39. A",
    "40. D",
  ].join("\n");
}

async function writeMinimalDocx(text: string, outPath: string) {
  const paras = text.split(/\n/).map((line) => {
    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (!escaped.trim()) {
      return `<w:p><w:pPr/><w:r><w:t></w:t></w:r></w:p>`;
    }
    return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
  });
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paras.join("\n")}
    <w:sectPr/>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder("word")!.file("document.xml", documentXml);
  zip.folder("word")!.folder("_rels")!.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`,
  );
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  await writeFile(outPath, buf);
}

async function archiveOriginalKeys() {
  const oldDir = path.join(SRC, "_old");
  await mkdir(oldDir, { recursive: true });
  const archived = path.join(oldDir, "keys.screenshots.docx");
  const srcKeys = path.join(SRC, "keys.docx");
  try {
    await readFile(archived);
    console.log("Original keys archive present:", archived);
  } catch {
    try {
      await copyFile(srcKeys, archived);
      console.log("Archived keys.docx →", archived);
    } catch (e) {
      console.warn("Could not archive keys.docx:", e);
    }
  }
  try {
    await mkdir(path.join(ABS, "_old"), { recursive: true });
    const absArchived = path.join(ABS, "_old", "keys.screenshots.docx");
    try {
      await readFile(absArchived);
    } catch {
      await copyFile(srcKeys, absArchived);
    }
  } catch (e) {
    console.warn("ABS keys archive:", e);
  }
}

async function buildCanonicalKeys(): Promise<string> {
  // Write Key-9 Reading-only text as-authored. Do NOT run normalizeKeysToCanonical
  // for the output file: with only a Reading heading it still fills a fake
  // Listening map (no matching section → full text) and would invent L stubs.
  const text = buildManualCanonicalKeysText();
  const { map } = parseKeysCanonical(text, { skill: "READING" });
  console.log(`Keys check: reading=${map.size} (Listening omitted — none in folder)`);
  if (map.size < 40) {
    throw new Error(`Expected 40 reading keys, got R=${map.size}`);
  }
  // Matching letters F must remain F in the typed Key 12 source
  const readingBody = text.split(/^Reading\s*$/im)[1] ?? text;
  if (!/^27\.\s*F\s*$/m.test(readingBody)) {
    throw new Error("Reading Q27 must remain letter F (which-paragraph)");
  }
  if (!/^34\.\s*F\s*$/m.test(readingBody)) {
    throw new Error("Reading Q34 must remain letter F (sentence endings)");
  }

  await archiveOriginalKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-12-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-12-keys.md");
  const key12Path = path.join(SRC, "Key 12.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-12-keys.docx"),
  );
  await writeMinimalDocx(text, key12Path);

  // Remove leftover keys.docx name after Key 12 is written
  try {
    await rename(path.join(SRC, "keys.docx"), path.join(SRC, "_old", "keys.docx"));
  } catch {
    /* already archived / renamed */
  }

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 12.docx"));
    try {
      await rename(
        path.join(ABS, "keys.docx"),
        path.join(ABS, "_old", "keys.docx"),
      );
    } catch {
      /* ok */
    }
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 12.docx`);
  return keysMdPath;
}

async function docxPlainText(docxPath: string): Promise<string> {
  const buf = await readFile(docxPath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) return "";
  return xml
    .replace(/<w:tab[^/]*\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^/]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fixReadingText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");

  // Only treat READING PASSAGE as a part heading when alone on a line —
  // never inject breaks into "based on Reading Passage 2" / "…has seven paragraphs".
  t = t.replace(
    /([^\n])\s*(READING PASSAGE\s+\d+)\s*(?=\n|$)/gi,
    (full, before: string, heading: string) => {
      const b = before.trimEnd();
      // Mid-sentence cite: keep inline
      if (/based on$/i.test(b) || /\bin$/i.test(b)) {
        return `${before} ${heading.replace(/READING PASSAGE/i, "Reading Passage")}`;
      }
      return full;
    },
  );

  // Rejoin spend-time blurbs already split across lines
  t = t.replace(
    /(You should spend about 20 minutes on Questions?\s+\d+\s*[-–—]\s*\d+,?\s*which are based on)\s*\n+\s*(?:READING\s+)?PASSAGE\s+(\d+)\s*\n+\s*(on pages?[^\n]*)/gi,
    "$1 Reading Passage $2 $3",
  );
  t = t.replace(
    /(You should spend about 20 minutes on Questions?\s+\d+\s*[-–—]\s*\d+,?\s*which are based on)\s+(?:READING\s+)?PASSAGE\s+(\d+)\s*\n+\s*(on pages?[^\n]*)/gi,
    "$1 Reading Passage $2 $3",
  );

  // Rejoin "Reading Passage N has …" after a Questions header
  t = t.replace(
    /(Questions?\s+\d+[^\n]*)\s*\n+\s*(?:READING\s+)?PASSAGE\s+(\d+)\s*\n+\s*(has\b[^\n]*)/gi,
    "$1\nReading Passage $2 $3",
  );
  t = t.replace(
    /^(?:READING\s+)?PASSAGE\s+(\d+)\s*\n+\s*(has\b)/gim,
    "Reading Passage $1 $2",
  );

  // TFNG blurb: "...given in\nREADING PASSAGE 1\n?"
  t = t.replace(
    /(Do the following statements agree with the information given in)\s*\n+\s*(?:READING\s+)?PASSAGE\s+(\d+)\s*\n+\s*\?/gi,
    "$1 Reading Passage $2?",
  );

  // Ensure part headings stay as own lines (start-of-line only)
  t = t.replace(/^(READING PASSAGE\s+\d+)\s*$/gim, "\n$1\n");

  t = t.replace(/\bQuestion\s+(\d+)\s*[-–—]\s*(\d+)/gi, "Questions $1-$2");
  t = t.replace(
    /^Questions?\s+(\d+)\s+and\s+(\d+)\s*$/gim,
    "Questions $1 and $2",
  );

  // Word-bank labels for Q38–40 (avoid "A hard centre…" being parsed as option A)
  t = t.replace(/^A\s+gravitational pull\s*$/im, "A. gravitational pull");
  t = t.replace(/^B\s+ice\s*$/im, "B. ice");
  t = t.replace(/^C\s+solid core\s*$/im, "C. solid core");
  t = t.replace(/^D\s+ultraviolet light\s*$/im, "D. ultraviolet light");
  t = t.replace(/^E\s+Milky Way\s*$/im, "E. Milky Way");
  t = t.replace(/^F\s+disk\s*$/im, "F. disk");
  // Disambiguate English article "A" in the summary stem from option label A
  t = t.replace(
    /^A hard centre becomes larger/im,
    "Hard centre becomes larger",
  );

  return t.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function writeCleanedPaper(): Promise<string> {
  const cleanDir = path.join(SRC, "_clean");
  await mkdir(cleanDir, { recursive: true });
  const readingMd = path.join(cleanDir, "Reading 12.md");
  const fixed = fixReadingText(
    await docxPlainText(path.join(SRC, "Reading 12.docx")),
  );
  await writeFile(readingMd, fixed, "utf8");
  console.log("Wrote cleaned paper →", readingMd);
  return readingMd;
}

function ensureChooseTwo(
  draft: ParsedTestDraft,
  pairs: Array<{
    start: number;
    end: number;
    stem: string;
    options: { label: string; text: string }[];
    answers: string[];
  }>,
): void {
  for (const pair of pairs) {
    const { start, end, stem, options, answers } = pair;
    if (end - start + 1 !== answers.length) {
      throw new Error(`Choose TWO mismatch for Q${start}-${end}`);
    }
    for (const part of draft.parts) {
      const nums = part.questions.map((q) => q.number);
      if (!nums.includes(start) && !nums.includes(end)) continue;
      // Ensure start exists even if parser skipped it
      const byNum = new Map(part.questions.map((q) => [q.number, q]));
      let lead = byNum.get(start);
      if (!lead) {
        lead = {
          number: start,
          order: start,
          type: "MULTIPLE_CHOICE",
          content: {},
        };
        part.questions.push(lead);
        byNum.set(start, lead);
      }
      lead.type = "MULTIPLE_CHOICE";
      lead.content = {
        stem,
        options,
        selectCount: answers.length,
        covers: Array.from({ length: answers.length }, (_, i) => start + i),
      };
      lead.correctAnswer = answers[0];
      for (let i = 1; i < answers.length; i++) {
        const n = start + i;
        let sat = byNum.get(n);
        if (!sat) {
          sat = {
            number: n,
            order: n,
            type: "MULTIPLE_CHOICE",
            content: { stem: "", pairedFrom: start },
          };
          part.questions.push(sat);
        } else {
          sat.type = "MULTIPLE_CHOICE";
          sat.content = { stem: "", pairedFrom: start };
        }
        sat.correctAnswer = answers[i];
      }
      part.questions.sort((a, b) => a.number - b.number);
      part.questions.forEach((q, i) => {
        q.order = i;
      });
      console.log(
        `  fixed Choose TWO Q${start}–${end} (${answers.join("/")})`,
      );
    }
  }
}

function stripReadingDoubleHeaders(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    const titleMatch = part.title.match(/^Passage\s+(\d+)\s*[-–—:]\s*(.+)$/i);
    if (!titleMatch) continue;
    const subtitle = titleMatch[2]!.trim();
    if (!subtitle || !part.content) continue;
    const lines = part.content.split(/\n/);
    let i = 0;
    while (i < lines.length && !lines[i]!.trim()) i += 1;
    while (
      i < lines.length &&
      /^(You should spend|Questions?\s+\d|which are based)/i.test(
        lines[i]!.trim(),
      )
    ) {
      i += 1;
      while (i < lines.length && !lines[i]!.trim()) i += 1;
    }
    if (
      i < lines.length &&
      lines[i]!.trim().localeCompare(subtitle, undefined, {
        sensitivity: "accent",
      }) === 0
    ) {
      part.title = `Passage ${titleMatch[1]}`;
      console.log(`  stripped double-header → ${part.title}`);
    }
  }
}

/** Which-paragraph info match: MATCHING with letter stems, not passage MCQ. */
function ensureWhichParagraph(draft: ParsedTestDraft): void {
  const stems: Record<number, string> = {
    27: "the significance of recent discoveries of a large number of massive planets",
    28: "an explanation of the difference between the theories of planet creation",
    29: "the difficulties of proving that the more recent theory of planet creation is correct",
    30: "reasons why Mayer claims he was able to develop his theory",
    31: "a detailed explanation of the long-held theory of planet creation",
    32: "description of the destructive effect of heat in space",
  };
  const options = "ABCDEFGHI".split("").map((label) => ({ label, text: label }));
  for (const part of draft.parts) {
    if (!/passage\s*3/i.test(part.title)) continue;
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    for (const [n, stem] of Object.entries(stems)) {
      const num = Number(n);
      const existing = byNum.get(num);
      if (existing) {
        existing.type = "MATCHING";
        existing.content = { stem, options };
      } else {
        part.questions.push({
          number: num,
          order: num,
          type: "MATCHING",
          content: { stem, options },
        });
      }
    }
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((q, i) => {
      q.order = i;
    });
    console.log("  ensured which-paragraph MATCHING Q27–32");
  }
}

const SUMMARY_38_40_OPTIONS = [
  { label: "A", text: "gravitational pull" },
  { label: "B", text: "ice" },
  { label: "C", text: "solid core" },
  { label: "D", text: "ultraviolet light" },
  { label: "E", text: "Milky Way" },
  { label: "F", text: "disk" },
];

const SUMMARY_38_40_STEMS: Record<number, string> = {
  38: "Hard centre becomes larger and this produces enough gravity to draw gas from the …… around it.",
  39: "Stars can break up the outer gaseous parts which surround objects in the sky because the attraction of the …… from stars is very powerful.",
  40: "Heat caused by …… can also destroy the material surrounding the objects in a relatively short time.",
};

function ensureSummaryWordBank(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    if (!/passage\s*3/i.test(part.title)) continue;
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    for (const [n, stem] of Object.entries(SUMMARY_38_40_STEMS)) {
      const num = Number(n);
      const existing = byNum.get(num);
      if (existing) {
        existing.type = "MATCHING";
        existing.content = { stem, options: SUMMARY_38_40_OPTIONS };
      } else {
        part.questions.push({
          number: num,
          order: num,
          type: "MATCHING",
          content: { stem, options: SUMMARY_38_40_OPTIONS },
        });
      }
    }
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((q, i) => {
      q.order = i;
    });
    console.log("  ensured summary word-bank Q38–40");
  }
}

function dropSpuriousReadingQuestions(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    const before = part.questions.length;
    if (/passage\s*3/i.test(part.title)) {
      part.questions = part.questions.filter((q) => q.number >= 27);
    } else if (/passage\s*2/i.test(part.title)) {
      part.questions = part.questions.filter(
        (q) => q.number >= 14 && q.number <= 26,
      );
    } else if (/passage\s*1/i.test(part.title)) {
      part.questions = part.questions.filter((q) => q.number <= 13);
    }
    if (part.questions.length !== before) {
      console.log(
        `  ${part.title}: dropped ${before - part.questions.length} spurious q(s)`,
      );
    }
  }
}

/** Keep matching / MCQ letter F as F (undo TFNG expansion). */
function keepMatchingLetterF(draft: ParsedTestDraft, nums: number[]): void {
  for (const part of draft.parts) {
    for (const q of part.questions) {
      if (!nums.includes(q.number)) continue;
      if (q.correctAnswer === "FALSE") {
        q.correctAnswer = "F";
        console.log(`  restored matching F on Q${q.number}`);
      }
    }
  }
}

function summarize(draft: ParsedTestDraft) {
  const qs = draft.parts.flatMap((p) => p.questions);
  const withAns = qs.filter(
    (q) => q.correctAnswer !== undefined && q.correctAnswer !== null,
  );
  console.log(
    `\n=== ${draft.slug} === parts=${draft.parts.length} qs=${qs.length} withAns=${withAns.length}`,
  );
  for (const p of draft.parts) {
    console.log(`  ${p.title}: ${p.questions.length} q`);
  }
  console.log(
    "  numbers:",
    qs
      .map((q) => q.number)
      .sort((a, b) => a - b)
      .join(","),
  );
  const missing = [];
  for (let n = 1; n <= 40; n++) {
    if (!qs.some((q) => q.number === n)) missing.push(n);
  }
  if (missing.length) console.log("  MISSING Q:", missing.join(","));

  const multi = qs.filter((q) => {
    const c = q.content as {
      selectCount?: number;
      covers?: number[];
      pairedFrom?: number;
    };
    return (
      (typeof c.selectCount === "number" && c.selectCount >= 2) ||
      (Array.isArray(c.covers) && c.covers.length >= 2) ||
      typeof c.pairedFrom === "number"
    );
  });
  if (multi.length) {
    console.log("  multi-select / paired:");
    for (const q of multi) {
      const c = q.content as {
        selectCount?: number;
        covers?: number[];
        pairedFrom?: number;
      };
      console.log(
        `    Q${q.number} type=${q.type} ans=${JSON.stringify(q.correctAnswer)} selectCount=${c.selectCount ?? "-"} covers=${JSON.stringify(c.covers ?? null)} pairedFrom=${c.pairedFrom ?? "-"}`,
      );
    }
  } else {
    console.log("  multi-select / paired: (none)");
  }

  const sample = [1, 7, 11, 14, 21, 22, 27, 34, 38, 40]
    .map((n) => {
      const q = qs.find((x) => x.number === n);
      return q ? `Q${n}=${JSON.stringify(q.correctAnswer)}` : `Q${n}=?`;
    })
    .join(" ");
  console.log("  sample:", sample);
}

const CHOOSE_TWO_21_22 = {
  start: 21,
  end: 22,
  stem: "Which TWO of the following statements about Ran Clarke are made in the passage?",
  options: [
    {
      label: "A",
      text: "Clarke was not performing well immediately prior to the Mexico Games.",
    },
    {
      label: "B",
      text: "The worries Clarke had before the Mexico Games were not taken into account.",
    },
    {
      label: "C",
      text: "Clarke's experiences at the Mexico Games are widely talked about today.",
    },
    {
      label: "D",
      text: "At one stage of the Mexico Games 10,000 metres, Clarke was near the front.",
    },
    {
      label: "E",
      text: "Clarke was the only runner at the Mexico Games who appeared to be affected by the altitude.",
    },
  ],
  answers: ["B", "D"],
};

async function main() {
  const keysPath = await buildCanonicalKeys();
  const readingMd = await writeCleanedPaper();

  const { draft, issues } = await parseTestFromFiles({
    contentPath: readingMd,
    keysPath,
    skill: "READING",
    slug: "test-12-reading",
    title: "Test 12 - Reading",
    sourceFolder: SRC,
  });
  console.log(`\n--- Import test-12-reading issues (${issues.length}) ---`);
  for (const issue of issues.slice(0, 40)) {
    console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (!draft) throw new Error("Parse failed for test-12-reading");

  stripReadingDoubleHeaders(draft);
  dropSpuriousReadingQuestions(draft);
  ensureWhichParagraph(draft);
  ensureSummaryWordBank(draft);
  ensureChooseTwo(draft, [CHOOSE_TWO_21_22]);

  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of draft.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }

  ensureWhichParagraph(draft);
  ensureSummaryWordBank(draft);
  ensureChooseTwo(draft, [CHOOSE_TWO_21_22]);
  keepMatchingLetterF(draft, [27, 34]);
  // Re-apply keys for F letters after type fixes
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of draft.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  keepMatchingLetterF(draft, [27, 34]);
  ensureChooseTwo(draft, [CHOOSE_TWO_21_22]);

  summarize(draft);
  await saveTestDraft(draft);

  console.log("\nDone. Local JSON: data/tests/test-12-reading.json");
  console.log("Skipped: Listening, Writing, audio (not in folder).");
  console.log("Speaking / Test 9 untouched.");
  console.log(
    'Upsert: npx tsx scripts/upsert-tests-from-json.ts --only test-12-reading',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
