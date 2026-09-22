/**
 * Build Test 6 assets: canonical keys (OCR from Key 6.docx screenshots),
 * section audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-6.ts
 *
 * Key 6.docx = typed Passage 1 + screenshot Listening/Passage 2–3 → Key-9.
 * Matching letter F stays F (Listening Q14/Q20, Reading Q7/Q27).
 * Audio: section-1..4.mp3 (split from Actual 6 Test 6 combined track).
 * Do NOT touch Speaking / test-6-speaking.json.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { extractDocxImagesToUploads } from "../src/lib/import/extract-docx-images";
import {
  normalizeKeysToCanonical,
  parseKeysCanonical,
} from "../src/lib/import/normalize-keys";
import { mergeKeysIntoQuestions } from "../src/lib/import/parse-keys";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import { stripFilledListeningAnswers } from "../src/lib/import/strip-filled-answers";
import { unwrapSingleColumnMarkdownNotes } from "../src/lib/practice/notes-table";
import { saveTestDraft } from "../src/lib/store/test-store";
import type { ParsedTestDraft } from "../src/lib/import/schemas";

const SRC = path.join(process.cwd(), "IELTS", "Test 6");
const ABS = "E:/Wewin/IELTS/Test 6";
const ROOT = process.cwd();

/**
 * Listening: OCR from Key 6.docx image2 (ANSWERS grid).
 * Reading P1: typed in Key 6 (matches SOSUS paper despite disclaimer note).
 * Reading P2: OCR image1 (14–26). P3: OCR image3 (27–40).
 * Keep matching F as F. Reading Q14 key image = B (as printed).
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. 20.25 (am)",
    "2. Box Hill",
    "3. 30 to 39",
    "4. domestic duties",
    "5. married, no children",
    "6. walking",
    "7. tighten",
    "8. hike",
    "9. swimming",
    "10. energy",
    "",
    "Section 2",
    "11. A",
    "12. E",
    "13. D",
    "14. F",
    "15. C",
    "16. A",
    "17. E",
    "18. C",
    "19. I",
    "20. F",
    "",
    "Section 3",
    "21. symbols",
    "22. interpreted",
    "23. nature",
    "24. headings",
    "25. Legal",
    "26. procedures",
    "27. associated",
    "28. directions",
    "29. notes",
    "30. headings",
    "",
    "Section 4",
    "31. billion",
    "32. clean room",
    "33. radiation",
    "34. (deep) underground",
    "35. complex",
    "36. heavy water",
    "37. electronic",
    "38. 1000 tons",
    "39. electric current",
    "40. control",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. TRUE",
    "2. FALSE",
    "3. NOT GIVEN",
    "4. TRUE",
    "5. D",
    "6. G",
    "7. F",
    "8. D",
    "9. D",
    "10. A",
    "11. A",
    "12. B",
    "13. C",
    "",
    "Passage 2",
    "14. B",
    "15. A",
    "16. B",
    "17. D",
    "18. C",
    "19. A",
    "20. D",
    "21. C",
    "22. D",
    "23. A",
    "24. facade",
    "25. escalators",
    "26. atrium",
    "",
    "Passage 3",
    "27. F",
    "28. A",
    "29. B",
    "30. H",
    "31. D",
    "32. NO",
    "33. NOT GIVEN",
    "34. YES",
    "35. YES",
    "36. YES",
    "37. marketing managers",
    "38. information needs",
    "39. internal records",
    "40. analysis unit",
  ];

  return [...listening, "", ...reading].join("\n");
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

async function archiveScreenshotKeys() {
  // Screenshot original already lives in _old/Key 6.screenshots.docx.
  // Do not overwrite that archive with the typed Key-9 rewrite.
  const archived = path.join(SRC, "_old", "Key 6.screenshots.docx");
  try {
    await readFile(archived);
    console.log("Screenshot Key archive present:", archived);
  } catch {
    console.warn("Missing screenshot archive at", archived);
  }
}

async function buildCanonicalKeys(): Promise<string> {
  const text = buildManualCanonicalKeysText();
  const check = normalizeKeysToCanonical(text);
  console.log(
    `Keys check: listening=${check.listeningCount} reading=${check.readingCount}`,
  );
  if (check.listeningCount < 40 || check.readingCount < 40) {
    throw new Error(
      `Expected 40+40 keys, got L=${check.listeningCount} R=${check.readingCount}`,
    );
  }
  if (!/^14\.\s*F\s*$/m.test(text) || !/^20\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q14 and Q20 must remain letter F");
  }
  if (!/^7\.\s*F\s*$/m.test(text) || !/^27\.\s*F\s*$/m.test(text)) {
    throw new Error("Reading Q7 and Q27 must remain letter F");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-6-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-6-keys.md");
  const key6Path = path.join(SRC, "Key 6.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-6-keys.docx"),
  );
  await writeMinimalDocx(text, key6Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 6.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 6.docx`);
  return keysMdPath;
}

async function copyAudio(): Promise<string[]> {
  const sectionFiles = [1, 2, 3, 4].map((i) =>
    path.join(SRC, `section-${i}.mp3`),
  );
  for (const f of sectionFiles) {
    await readFile(f); // throw if missing
  }

  // Mirror sections to absolute IELTS folder
  try {
    await mkdir(ABS, { recursive: true });
    for (let i = 1; i <= 4; i++) {
      await copyFile(
        path.join(SRC, `section-${i}.mp3`),
        path.join(ABS, `section-${i}.mp3`),
      );
    }
  } catch (e) {
    console.warn("ABS audio mirror:", e);
  }

  const audioDir = path.join(ROOT, "public/uploads/audio");
  await mkdir(audioDir, { recursive: true });
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const destName = `test-6-section-${i}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, `section-${i}.mp3`), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 6.docx"));
  // No shared prefix — unique img1..n filenames (floor plan, timetable, diagrams)
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-6-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 6.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-6-reading",
    prefix: "test-6-reading-flowchart",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 6.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-6-writing",
    prefix: "test-6-task1-table",
    subdir: "writing",
  });
  console.log("Writing images:", writeUrls);
  return { listenImgs, readImgs, writeUrls };
}

function cleanListeningNotes(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    if (!part.content) continue;
    const cleaned = stripFilledListeningAnswers(part.content);
    part.content = unwrapSingleColumnMarkdownNotes(
      cleaned.text
        .replace(/(\d{1,2}\s*(?:[$£€]\s*)?\.{3,})\.{2,}/g, "$1")
        .replace(/\.{6,}/g, "........"),
    );
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

function setQImage(
  q: ParsedTestDraft["parts"][0]["questions"][0],
  url: string,
) {
  q.mediaUrl = url;
  (q.content as Record<string, unknown>).imageUrl = url;
}

/**
 * Docx media order (sorted): image1 timetable, image2 floor plan,
 * image3 Sudbury diagram, image4 Neutrinos notes.
 */
function attachListeningMedia(
  draft: ParsedTestDraft,
  audioUrls: string[],
  listenImgs: string[],
): void {
  const timetable = listenImgs[0];
  const floorPlan = listenImgs[1];
  const sudbury = listenImgs[2];
  const neutrinos = listenImgs[3];

  draft.audioFiles = audioUrls.length ? audioUrls : undefined;
  for (let i = 0; i < draft.parts.length; i++) {
    const part = draft.parts[i]!;
    const audioUrl = audioUrls[i];
    if (audioUrl) {
      part.meta = { ...part.meta, audioUrl };
    }

    if (/section\s*2|part\s*2/i.test(part.title)) {
      if (floorPlan) {
        part.meta = { ...part.meta, imageUrl: floorPlan, mediaUrl: floorPlan };
      }
      for (const q of part.questions) {
        if (q.number >= 11 && q.number <= 16 && floorPlan) {
          setQImage(q, floorPlan);
        } else if (q.number >= 17 && q.number <= 20 && timetable) {
          setQImage(q, timetable);
        }
      }
    }

    if (/section\s*4|part\s*4/i.test(part.title)) {
      if (neutrinos) {
        part.meta = { ...part.meta, imageUrl: neutrinos, mediaUrl: neutrinos };
      }
      for (const q of part.questions) {
        if (q.number >= 31 && q.number <= 35 && neutrinos) {
          setQImage(q, neutrinos);
        } else if (q.number >= 36 && q.number <= 40 && sudbury) {
          setQImage(q, sudbury);
        }
      }
    }
  }
}

function attachReadingFlowchart(
  draft: ParsedTestDraft,
  flowchartUrl?: string,
): void {
  if (!flowchartUrl) return;
  for (const part of draft.parts) {
    if (!/passage\s*3/i.test(part.title)) continue;
    part.meta = { ...part.meta, imageUrl: flowchartUrl, mediaUrl: flowchartUrl };
    for (const q of part.questions) {
      if (q.number >= 37 && q.number <= 40) {
        setQImage(q, flowchartUrl);
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
    console.log(
      `  ${p.title}: ${p.questions.length} q | audio=${p.meta?.audioUrl ?? "-"} | img=${p.meta?.imageUrl ?? "-"}`,
    );
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
    if (draft.skill === "WRITING") break;
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

  if (draft.skill !== "WRITING") {
    const sample = [1, 7, 14, 20, 27, 32, 36, 40]
      .map((n) => {
        const q = qs.find((x) => x.number === n);
        return q ? `Q${n}=${JSON.stringify(q.correctAnswer)}` : `Q${n}=?`;
      })
      .join(" ");
    console.log("  sample:", sample);
  }
}

async function importSkill(opts: {
  file: string;
  keys?: string;
  skill: "LISTENING" | "READING" | "WRITING";
  slug: string;
  title: string;
  audioFiles?: string[];
  writingImages?: string[];
}) {
  const { draft, issues } = await parseTestFromFiles({
    contentPath: opts.file,
    keysPath: opts.keys,
    skill: opts.skill,
    slug: opts.slug,
    title: opts.title,
    sourceFolder: SRC,
    audioFiles: opts.audioFiles,
    writingImages: opts.writingImages,
  });
  console.log(`\n--- Import ${opts.slug} issues (${issues.length}) ---`);
  for (const issue of issues.slice(0, 50)) {
    console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (issues.length > 50) console.log(`... +${issues.length - 50} more`);
  if (!draft) throw new Error(`Parse failed for ${opts.slug}`);
  return draft;
}

async function main() {
  const keysPath = await buildCanonicalKeys();
  const audioUrls = await copyAudio();
  const { listenImgs, readImgs, writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 6.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-6-listening",
    title: "Test 6 - Listening",
    audioFiles: audioUrls.length ? audioUrls : undefined,
  });
  cleanListeningNotes(listening);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachListeningMedia(listening, audioUrls, listenImgs);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: path.join(SRC, "Reading 6.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-6-reading",
    title: "Test 6 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of reading.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachReadingFlowchart(reading, readImgs[0]);
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 6.docx"),
    skill: "WRITING",
    slug: "test-6-writing",
    title: "Test 6 - Writing",
    writingImages: writeUrls,
  });
  if (writeUrls[0]) {
    for (const part of writing.parts) {
      if (/\bTask\s*1\b/i.test(part.title) || part.order === 0) {
        part.meta = { ...part.meta, imageUrl: writeUrls[0] };
        for (const q of part.questions) {
          setQImage(q, writeUrls[0]);
        }
      }
    }
  }
  summarize(writing);
  await saveTestDraft(writing);

  console.log(
    "\nDone. Local JSON under data/tests/test-6-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    "  npx tsx scripts/upsert-tests-from-json.ts --only test-6-listening,test-6-reading,test-6-writing",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
