/**
 * Build Test 10 assets: canonical keys (OCR from keys.docx screenshots +
 * typed Reading Q22–26 fragment), Reading.docx from PDF, audio, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-10.ts
 *
 * Source: IELTS/Test 10/ — Listening/Writing docx, Reading 10.pdf→docx,
 * keys.docx screenshots, P1–P4 → section-1..4.mp3.
 * Matching letter F stays F (Listening Q27). Map letter I stays I (Q18).
 * No Choose TWO/THREE in this paper.
 * Do NOT touch Speaking / Test 9 / other tests.
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

const SRC = path.join(process.cwd(), "IELTS", "Test 10");
const ABS = "E:/Wewin/IELTS/Test 10";
const ROOT = process.cwd();

/**
 * Listening: OCR keys.docx image7 (P1–P4 grid) + image2 (P3 letters 21–30).
 * Reading: OCR images 8/5/3/6/1/4 + typed body Q22–26 (D/B/A/E/C).
 * Matching F stays F (Listening Q27).
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. travel",
    "2. teaching",
    "3. 9.15 am|9.15|9:15|9.15am",
    "4. guide",
    "5. coach",
    "6. garden",
    "7. guitar",
    "8. farm",
    "9. friends",
    "10. supermarket",
    "",
    "Section 2",
    "11. C",
    "12. A",
    "13. A",
    "14. B",
    "15. C",
    "16. H",
    "17. B",
    "18. I",
    "19. A",
    "20. E",
    "",
    "Section 3",
    "21. B",
    "22. A",
    "23. B",
    "24. C",
    "25. C",
    "26. A",
    "27. F",
    "28. C",
    "29. A",
    "30. B",
    "",
    "Section 4",
    "31. ocean",
    "32. depth",
    "33. plants",
    "34. rice",
    "35. A",
    "36. A",
    "37. B",
    "38. A",
    "39. shellfish",
    "40. spring",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. TRUE",
    "2. NOT GIVEN",
    "3. TRUE",
    "4. FALSE",
    "5. TRUE",
    "6. puberty",
    "7. sleepiness",
    "8. alertness",
    "9. hunger",
    "10. soda",
    "11. five hours|5 hours",
    "12. quality",
    "13. brains",
    "",
    "Passage 2",
    "14. iv",
    "15. iii",
    "16. vi",
    "17. ii",
    "18. v",
    "19. B",
    "20. D",
    "21. D",
    "22. D",
    "23. B",
    "24. A",
    "25. E",
    "26. C",
    "",
    "Passage 3",
    "27. C",
    "28. D",
    "29. B",
    "30. D",
    "31. A",
    "32. B",
    "33. C",
    "34. D",
    "35. B",
    "36. E",
    "37. YES",
    "38. NOT GIVEN",
    "39. NO",
    "40. YES",
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
  const oldDir = path.join(SRC, "_old");
  await mkdir(oldDir, { recursive: true });
  const archived = path.join(oldDir, "keys.screenshots.docx");
  try {
    await readFile(archived);
    console.log("Screenshot Key archive present:", archived);
  } catch {
    try {
      await copyFile(path.join(SRC, "keys.docx"), archived);
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
      await copyFile(path.join(SRC, "keys.docx"), absArchived);
    }
  } catch (e) {
    console.warn("ABS keys archive:", e);
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
  if (!/^27\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q27 must remain letter F");
  }
  if (!/^18\.\s*I\s*$/m.test(text)) {
    throw new Error("Listening Q18 must remain letter I");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-10-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-10-keys.md");
  const key10Path = path.join(SRC, "Key 10.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-10-keys.docx"),
  );
  await writeMinimalDocx(text, key10Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 10.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 10.docx`);
  return keysMdPath;
}

async function prepareAudio(): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const destName = `test-10-section-${i}.mp3`;
    const dest = path.join(ROOT, "public", "uploads", "audio", destName);
    const src = path.join(SRC, `section-${i}.mp3`);
    try {
      await readFile(src);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(src, dest);
      try {
        await mkdir(ABS, { recursive: true });
        await copyFile(src, path.join(ABS, `section-${i}.mp3`));
      } catch {
        /* abs optional */
      }
      urls.push(`/uploads/audio/${destName}`);
      console.log(`Audio ready: ${destName}`);
    } catch {
      console.warn(`Missing section-${i}.mp3`);
    }
  }
  if (urls.length < 4) {
    console.log("AUDIO BLOCKER: Need section-1..4.mp3 in Test 10 folder.");
  }
  return urls;
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

/** Normalize PART headers and map labeling so the IELTS parser keeps all 40 Qs. */
function fixListeningText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/\u0000/g, "");
  // Normalize exotic dashes / spaces around PART headings
  t = t.replace(
    /^PART\s*1\s+Questions?\s*1\s*[-–—]\s*10\s*$/im,
    "PART 1\nQuestions 1-10",
  );
  t = t.replace(
    /^PART\s*2\s+Questions?\s*11\s*[-–—]\s*20\s*$/im,
    "PART 2\nQuestions 11-20",
  );
  t = t.replace(
    /^PART\s*3\s+Questions?\s*21\s*[-–—]\s*30\s*$/im,
    "PART 3\nQuestions 21-30",
  );
  t = t.replace(
    /^PART\s*4\s+Questions?\s*31\s*[-–—]?\s*40\s*$/im,
    "PART 4\nQuestions 31-40",
  );
  t = t.replace(/\bQuestion\s+(\d+)\s*[-–—]\s*(\d+)/gi, "Questions $1-$2");
  t = t.replace(/^Questions\s+15\s*[-–—]\s*20\s*$/im, "Questions 15-20");
  t = t.replace(
    /Write the correct letter,\s*A-J,\s*next to questions\s*15-20\.?/i,
    "Write the correct letter, A-J, next to questions 15-20.",
  );
  // Longer matching stems so SHORT_ANSWER fallback still keeps them
  t = t.replace(/^15\s+Staff room\b.*$/gim, "15. Staff room area");
  t = t.replace(/^16\s+Administration\b.*$/gim, "16. Administration building");
  t = t.replace(/^17\s+Packing shed\b.*$/gim, "17. Packing shed area");
  t = t.replace(/^18\s+Staff car park\b.*$/gim, "18. Staff car park area");
  t = t.replace(/^19\s+Ripe strawberries\b.*$/gim, "19. Ripe strawberries area");
  t = t.replace(
    /^20\s+Unripe strawberries\b.*$/gim,
    "20. Unripe strawberries area",
  );
  t = t.replace(
    /^27\s+going to Mechanical Engineers/gim,
    "27. going to Mechanical Engineers",
  );
  t = t.replace(/^28\s+Visiting different/gim, "28. Visiting different");
  t = t.replace(/^29\s+getting some work/gim, "29. getting some work");
  t = t.replace(/^30\s+attending an international/gim, "30. attending an international");
  return t.trim() + "\n";
}

/** Fix PDF extract quirks + word bank for summary Q22–26. */
function fixReadingText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/^V5T6\s*$/gim, "");
  t = t.replace(/Question 1-13/gi, "Questions 1-13");
  t = t.replace(/about minutes on Questions/gi, "about 20 minutes on Questions");
  t = t.replace(/based on Read\s*\n?Passage 2/gi, "based on Reading Passage 2");
  t = t.replace(/for each section rom/gi, "for each section from");
  t = t.replace(/vii hanges/gi, "vii Changes");
  t = t.replace(/for ach answer/gi, "for each answer");
  t = t.replace(/White your answers/gi, "Write your answers");
  t = t.replace(/20 mines on/gi, "20 minutes on");
  t = t.replace(/in bores/gi, "in boxes");
  t = t.replace(/answer shoot/gi, "answer sheet");
  t = t.replace(/Choose the correct heading or each/gi, "Choose the correct heading for each");
  // Collapse broken word-bank (letters then words on separate lines)
  t = t.replace(
    /Why certain objects are valued\??\s*([\s\S]*?)(?=READING PASSAGE 3|$)/i,
    () => {
      return `Why certain objects are valued?

Some researchers argue that we may use ownership of desirable goods to
demonstrate our strength and fitness as other 22 ...... uses their attractive physical
features. Showing off one's superiority is not a new phenomenon and even in
ancient times successful people would have gained 23 .......... from this. A desire for
status could have led to an increase in the worth of prestige goods and to 24 ....... .
among people wishing to achieve this status.

It is thought that our natural desire to trade provided a basis for organised farming
and 25 ... development and finally resulted in the complex societies which can be
seen today. Whilst we do not value things such as beads nowadays, other items
hold the same appeal for us and bring the same status as owning beads did for our
26 ......... .

A competitiveness
B respect
C ancestors
D species
E city

`;
    },
  );
  // Ensure passage headings alone on a line
  t = t.replace(/READING PASSAGE\s+(\d+)/gi, "\nREADING PASSAGE $1\n");
  return t.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function writeCleanedPapers(): Promise<{
  listeningMd: string;
  readingMd: string;
}> {
  const cleanDir = path.join(SRC, "_clean");
  await mkdir(cleanDir, { recursive: true });
  const listeningMd = path.join(cleanDir, "Listening 10.md");
  const readingMd = path.join(cleanDir, "Reading 10.md");
  await writeFile(
    listeningMd,
    fixListeningText(await docxPlainText(path.join(SRC, "Listening 10.docx"))),
    "utf8",
  );
  await writeFile(
    readingMd,
    fixReadingText(await docxPlainText(path.join(SRC, "Reading 10.docx"))),
    "utf8",
  );
  console.log("Wrote cleaned papers →", cleanDir);
  return { listeningMd, readingMd };
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 10.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-10-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 10.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-10-reading",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 10.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-10-writing",
    prefix: "test-10-task1-chart",
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

const MAP_LABELS = [
  { label: "A", text: "A" },
  { label: "B", text: "B" },
  { label: "C", text: "C" },
  { label: "D", text: "D" },
  { label: "E", text: "E" },
  { label: "F", text: "F" },
  { label: "G", text: "G" },
  { label: "H", text: "H" },
  { label: "I", text: "I" },
  { label: "J", text: "J" },
];

const MAP_STEMS: Record<number, string> = {
  15: "Staff room",
  16: "Administration",
  17: "Packing shed",
  18: "Staff car park",
  19: "Ripe strawberries",
  20: "Unripe strawberries",
};

const BENEFIT_OPTIONS = [
  { label: "A", text: "broadens practical experience of the field" },
  { label: "B", text: "chance to publicise own work" },
  { label: "C", text: "effective way of keeping up-to-date" },
  { label: "D", text: "looks good on a CV" },
  { label: "E", text: "provides useful access to resources" },
  { label: "F", text: "way to make useful contacts" },
];

const BENEFIT_STEMS: Record<number, string> = {
  27: "going to Mechanical Engineers' Society meetings",
  28: "Visiting different workplaces",
  29: "getting some work experience abroad",
  30: "attending an international conference",
};

/** Parser may drop short map/matching labels — rebuild Q15–20 and Q27–30. */
function ensureListeningMatching(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    if (/section\s*2|part\s*2/i.test(part.title)) {
      for (const [n, stem] of Object.entries(MAP_STEMS)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: MAP_LABELS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: MAP_LABELS },
          });
        }
      }
      console.log("  ensured Matching Q15–20 (map labels)");
    }
    if (/section\s*3|part\s*3/i.test(part.title)) {
      for (const [n, stem] of Object.entries(BENEFIT_STEMS)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: BENEFIT_OPTIONS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: BENEFIT_OPTIONS },
          });
        }
      }
      part.questions = part.questions.filter((q) => {
        if (q.number >= 27 && q.number <= 30 && q.type !== "MATCHING") {
          return false;
        }
        return true;
      });
      console.log("  ensured Matching Q27–30 (benefits)");
    }
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((q, i) => {
      q.order = i;
    });
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

function setQImage(
  q: ParsedTestDraft["parts"][0]["questions"][0],
  url: string,
) {
  q.mediaUrl = url;
  (q.content as Record<string, unknown>).imageUrl = url;
}

function attachListeningAudio(
  draft: ParsedTestDraft,
  audioUrls: string[],
): void {
  draft.audioFiles = audioUrls.length ? audioUrls : undefined;
  for (let i = 0; i < draft.parts.length; i++) {
    const part = draft.parts[i]!;
    const audioUrl = audioUrls[i];
    if (audioUrl) {
      part.meta = { ...part.meta, audioUrl };
    }
  }
}

function attachListeningMap(
  draft: ParsedTestDraft,
  listenImgs: string[],
): void {
  const mapUrl = listenImgs[0];
  if (!mapUrl) return;
  for (const part of draft.parts) {
    if (!/section\s*2|part\s*2/i.test(part.title)) continue;
    part.meta = { ...part.meta, imageUrl: mapUrl, mediaUrl: mapUrl };
    for (const q of part.questions) {
      if (q.number >= 15 && q.number <= 20) {
        setQImage(q, mapUrl);
      }
    }
    console.log("  attached map image to Section 2 / Q15–20");
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
    console.log("  multi-select / paired: (none — expected for Test 10)");
  }

  if (draft.skill !== "WRITING") {
    const sample = [1, 8, 15, 18, 27, 31, 40]
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
  const audioUrls = await prepareAudio();
  const { listenImgs, writeUrls } = await extractMedia();
  const { listeningMd, readingMd } = await writeCleanedPapers();

  let listening = await importSkill({
    file: listeningMd,
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-10-listening",
    title: "Test 10 - Listening",
    audioFiles: audioUrls.length ? audioUrls : undefined,
  });
  cleanListeningNotes(listening);
  ensureListeningMatching(listening);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachListeningAudio(listening, audioUrls);
  attachListeningMap(listening, listenImgs);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: readingMd,
    keys: keysPath,
    skill: "READING",
    slug: "test-10-reading",
    title: "Test 10 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  dropSpuriousReadingQuestions(reading);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of reading.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 10.docx"),
    skill: "WRITING",
    slug: "test-10-writing",
    title: "Test 10 - Writing",
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
    "\nDone. Local JSON under data/tests/test-10-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    '  npx tsx scripts/upsert-tests-from-json.ts --only "test-10-listening,test-10-reading,test-10-writing"',
  );
  if (audioUrls.length < 4) {
    console.log("\nBLOCKER: Test 10 listening audio incomplete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
