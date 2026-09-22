/**
 * Build Test 11 assets: canonical keys (OCR from keys.docx screenshot +
 * Reading from matching paper answer set), audio, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-11.ts
 *
 * Source: IELTS/Test 11/ — L/R/W 11.docx, Key 11 (screenshot→typed),
 * section-1..4.mp3. Matching F stays F (Listening Q14). Choose TWO:
 * Listening 21–22 / 23–24; Reading 25–26.
 * Do NOT touch Speaking / Test 9 / other tests.
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

const SRC = path.join(process.cwd(), "IELTS", "Test 11");
const ABS = "E:/Wewin/IELTS/Test 11";
const ROOT = process.cwd();

/**
 * Listening: OCR Key 11 image1 (labelled "Test 2" but matches Jackson Island /
 * biomass paper). Q10 OE alt maps; Q35 electrcity→electricity|energy.
 * Reading: Passage keys from matching full paper; Matching F stays F (L14).
 * Choose TWO: L 21–22 = A/D, 23–24 = D/E; R 25–26 = C/D.
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. cash",
    "2. museum",
    "3. caravan",
    "4. sailing",
    "5. four days|4 days",
    "6. White Mountain",
    "7. snowboarding",
    "8. cakes",
    "9. car",
    "10. map|maps",
    "",
    "Section 2",
    "11. G",
    "12. E",
    "13. A",
    "14. F",
    "15. H",
    "16. C",
    "17. A",
    "18. B",
    "19. C",
    "20. A",
    "",
    "Section 3",
    "21. A",
    "22. D",
    "23. D",
    "24. E",
    "25. G",
    "26. H",
    "27. A",
    "28. E",
    "29. B",
    "30. C",
    "",
    "Section 4",
    "31. cost",
    "32. store",
    "33. powder",
    "34. holes",
    "35. electricity|energy|electrcity",
    "36. starch",
    "37. agriculture",
    "38. factories",
    "39. businesses",
    "40. demand",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. TRUE",
    "2. FALSE",
    "3. FALSE",
    "4. TRUE",
    "5. FALSE",
    "6. TRUE",
    "7. NOT GIVEN",
    "8. 46",
    "9. the human eye|human eye",
    "10. Indo-European",
    "11. Richard Brocklesby",
    "12. Royal Institution",
    "13. gas lighting",
    "",
    "Passage 2",
    "14. v",
    "15. ii",
    "16. iv",
    "17. i",
    "18. viii",
    "19. iii",
    "20. vi",
    "21. sewing machine",
    "22. department stores",
    "23. fixed prices|prices",
    "24. Europe",
    "25. C",
    "26. D",
    "",
    "Passage 3",
    "27. D",
    "28. L",
    "29. F",
    "30. J",
    "31. I",
    "32. B",
    "33. YES",
    "34. NO",
    "35. YES",
    "36. NOT GIVEN",
    "37. D",
    "38. A",
    "39. B",
    "40. C",
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
      await copyFile(path.join(SRC, "Key 11.docx"), archived);
      console.log("Archived Key 11.docx →", archived);
    } catch (e) {
      console.warn("Could not archive Key 11.docx:", e);
    }
  }
  try {
    await mkdir(path.join(ABS, "_old"), { recursive: true });
    const absArchived = path.join(ABS, "_old", "keys.screenshots.docx");
    try {
      await readFile(absArchived);
    } catch {
      await copyFile(path.join(SRC, "Key 11.docx"), absArchived);
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
  if (!/^14\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q14 must remain letter F");
  }
  if (!/^29\.\s*F\s*$/m.test(text.split("Reading")[1] ?? "")) {
    throw new Error("Reading Q29 must remain letter F (matching bank)");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-11-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-11-keys.md");
  const key11Path = path.join(SRC, "Key 11.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-11-keys.docx"),
  );
  await writeMinimalDocx(text, key11Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 11.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 11.docx`);
  return keysMdPath;
}

async function sha256File(filePath: string): Promise<string> {
  const buf = await readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

async function prepareAudio(): Promise<string[]> {
  const urls: string[] = [];
  const audioDir = path.join(ROOT, "public", "uploads", "audio");
  await mkdir(audioDir, { recursive: true });

  const newHashes: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const destName = `test-11-section-${i}.mp3`;
    const dest = path.join(audioDir, destName);
    const src = path.join(SRC, `section-${i}.mp3`);
    try {
      await readFile(src);
      await copyFile(src, dest);
      try {
        await mkdir(ABS, { recursive: true });
        await copyFile(src, path.join(ABS, `section-${i}.mp3`));
      } catch {
        /* abs optional */
      }
      const hash = await sha256File(dest);
      newHashes.push(hash);
      urls.push(`/uploads/audio/${destName}`);
      console.log(`Audio ready: ${destName} sha256=${hash.slice(0, 12)}…`);
    } catch {
      console.warn(`Missing section-${i}.mp3`);
    }
  }

  // Compare against other test-*-section-*.mp3
  const { readdir } = await import("node:fs/promises");
  const all = await readdir(audioDir);
  const others = all.filter(
    (f) =>
      /^test-\d+-section-\d+\.mp3$/i.test(f) && !f.startsWith("test-11-"),
  );
  const collisions: string[] = [];
  for (const other of others) {
    const h = await sha256File(path.join(audioDir, other));
    for (let i = 0; i < newHashes.length; i++) {
      if (newHashes[i] === h) {
        collisions.push(`test-11-section-${i + 1}.mp3 == ${other}`);
      }
    }
  }
  if (collisions.length) {
    console.error("AUDIO SHA COLLISION:", collisions.join("; "));
  } else {
    console.log(
      `Audio SHA OK: test-11 sections unique vs ${others.length} other tracks`,
    );
  }

  if (urls.length < 4) {
    console.log("AUDIO BLOCKER: Need section-1..4.mp3 in Test 11 folder.");
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

function fixListeningText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/\u0000/g, "");
  t = t.replace(
    /^Section\s*1\s+Question\s*1-10-?\s*$/im,
    "PART 1\nQuestions 1-10",
  );
  t = t.replace(
    /^Section\s*2\s+Question\s*11-12\s*$/im,
    "PART 2\nQuestions 11-20",
  );
  t = t.replace(
    /^Section\s*3\s+Question\s*21-30\s*$/im,
    "PART 3\nQuestions 21-30",
  );
  t = t.replace(
    /^Section\s*4\s+Question\s*31-40\s*$/im,
    "PART 4\nQuestions 31-40",
  );
  t = t.replace(/\bQuestion\s+(\d+)\s*[-–—]\s*(\d+)/gi, "Questions $1-$2");
  t = t.replace(/^Question\s+1-7\s*$/im, "Questions 1-7");
  // Number MCQ stems for Section 2 Q16–20
  t = t.replace(
    /^The drama option takes place\s*$/im,
    "16. The drama option takes place",
  );
  t = t.replace(
    /^The photography option is reserved for\s*$/im,
    "17. The photography option is reserved for",
  );
  t = t.replace(
    /^The writing option will focus on\s*$/im,
    "18. The writing option will focus on",
  );
  t = t.replace(
    /^The music option involves\s*$/im,
    "19. The music option involves",
  );
  t = t.replace(
    /^What information is given about the creche\?\s*$/im,
    "20. What information is given about the creche?",
  );
  // Map stems
  t = t.replace(/^11\.\s*Bike sheds\s*_*/gim, "11. Bike sheds");
  t = t.replace(/^12\.\s*Snack shop\s*_*/gim, "12. Snack shop");
  t = t.replace(/^13\.\s*Fitness rooms\s*_*/gim, "13. Fitness rooms");
  t = t.replace(/^14\.\s*Family rooms\s*_*/gim, "14. Family rooms");
  t = t.replace(/^15\.\s*TV room\s*_*/gim, "15. TV room");
  return t.trim() + "\n";
}

function fixReadingText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/READING PASSAGE\s+(\d+)/gi, "\nREADING PASSAGE $1\n");
  t = t.replace(/Question 1-13/gi, "Questions 1-13");
  // Number YE/NG stems that lack numbers in extract
  t = t.replace(
    /^It is rare to find a fossil of a pterosaur that clearly shows its skeleton\.\s*$/im,
    "33. It is rare to find a fossil of a pterosaur that clearly shows its skeleton.",
  );
  t = t.replace(
    /^The reason for building the model was to prove pterosaurs flew for long distances\.\s*$/im,
    "34. The reason for building the model was to prove pterosaurs flew for long distances.",
  );
  t = t.replace(
    /^It is possible that pterosaur species achieved their wing size as a result of the pteroid\.\s*$/im,
    "35. It is possible that pterosaur species achieved their wing size as a result of the pteroid.",
  );
  t = t.replace(
    /^Wilkinson has made several unsuccessful replicas of the pterosaur's head\.\s*$/im,
    "36. Wilkinson has made several unsuccessful replicas of the pterosaur's head.",
  );
  t = t.replace(
    /^What was Professor Wilkinson's main problem, according to the third paragraph\?\s*$/im,
    "37. What was Professor Wilkinson's main problem, according to the third paragraph?",
  );
  t = t.replace(
    /^What did Professor Wilkinson discover about a bone in pterosaurs called a pteroid\?\s*$/im,
    "38. What did Professor Wilkinson discover about a bone in pterosaurs called a pteroid?",
  );
  t = t.replace(
    /^According to the writer, the main problem with the remote-controlled 'pterosaur' is that\s*$/im,
    "39. According to the writer, the main problem with the remote-controlled 'pterosaur' is that",
  );
  t = t.replace(
    /^What does 'it' in the last sentence refer to\?\s*$/im,
    "40. What does 'it' in the last sentence refer to?",
  );
  return t.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function writeCleanedPapers(): Promise<{
  listeningMd: string;
  readingMd: string;
}> {
  const cleanDir = path.join(SRC, "_clean");
  await mkdir(cleanDir, { recursive: true });
  const listeningMd = path.join(cleanDir, "Listening 11.md");
  const readingMd = path.join(cleanDir, "Reading 11.md");
  await writeFile(
    listeningMd,
    fixListeningText(await docxPlainText(path.join(SRC, "Listening 11.docx"))),
    "utf8",
  );
  await writeFile(
    readingMd,
    fixReadingText(await docxPlainText(path.join(SRC, "Reading 11.docx"))),
    "utf8",
  );
  console.log("Wrote cleaned papers →", cleanDir);
  return { listeningMd, readingMd };
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 11.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-11-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 11.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-11-reading",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 11.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-11-writing",
    prefix: "test-11-task1-chart",
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
];

const MAP_STEMS: Record<number, string> = {
  11: "Bike sheds",
  12: "Snack shop",
  13: "Fitness rooms",
  14: "Family rooms",
  15: "TV room",
};

const FLOW_OPTIONS = [
  { label: "A", text: "export routes" },
  { label: "B", text: "future" },
  { label: "C", text: "talk" },
  { label: "D", text: "homework" },
  { label: "E", text: "worksheet" },
  { label: "F", text: "history" },
  { label: "G", text: "producers" },
  { label: "H", text: "methods of transport" },
];

const FLOW_STEMS: Record<number, string> = {
  25: "Locate the top …… on a world map",
  26: "Discuss the pros and cons of different ……",
  27: "In groups, discuss countries' possible …… to the USA",
  28: "Complete a …… about pencil distribution within the USA",
  29: "Share ideas about the …… of pencils",
  30: "Prepare a ……",
};

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
      console.log("  ensured Matching Q11–15 (map labels)");
    }
    if (/section\s*3|part\s*3/i.test(part.title)) {
      for (const [n, stem] of Object.entries(FLOW_STEMS)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: FLOW_OPTIONS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: FLOW_OPTIONS },
          });
        }
      }
      console.log("  ensured Matching Q25–30 (flow-chart)");
    }
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((q, i) => {
      q.order = i;
    });
  }
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
      if (!nums.includes(start)) continue;
      const byNum = new Map(part.questions.map((q) => [q.number, q]));
      const lead = byNum.get(start);
      if (!lead) continue;
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
      if (q.number >= 11 && q.number <= 15) {
        setQImage(q, mapUrl);
      }
    }
    console.log("  attached map image to Section 2 / Q11–15");
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
    const sample = [1, 10, 14, 21, 25, 29, 31, 40]
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
    slug: "test-11-listening",
    title: "Test 11 - Listening",
    audioFiles: audioUrls.length ? audioUrls : undefined,
  });
  cleanListeningNotes(listening);
  ensureListeningMatching(listening);
  ensureChooseTwo(listening, [
    {
      start: 21,
      end: 22,
      stem: "Which TWO topics were the aims of the geography lesson related to?",
      options: [
        { label: "A", text: "global inter dependency" },
        { label: "B", text: "manufacturing methods" },
        { label: "C", text: "the environmental impact of trade" },
        { label: "D", text: "transport systems" },
        { label: "E", text: "the development of writing tools" },
      ],
      answers: ["A", "D"],
    },
    {
      start: 23,
      end: 24,
      stem: "Which TWO problems do Dean and Hannah identify in their lesson?",
      options: [
        { label: "A", text: "the materials" },
        { label: "B", text: "the student grouping" },
        { label: "C", text: "the lesson structure" },
        { label: "D", text: "the teacher coordination" },
        { label: "E", text: "the timing" },
      ],
      answers: ["D", "E"],
    },
  ]);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  // Re-apply Choose TWO answers after merge (covers lead+satellites)
  ensureChooseTwo(listening, [
    {
      start: 21,
      end: 22,
      stem: "Which TWO topics were the aims of the geography lesson related to?",
      options: [
        { label: "A", text: "global inter dependency" },
        { label: "B", text: "manufacturing methods" },
        { label: "C", text: "the environmental impact of trade" },
        { label: "D", text: "transport systems" },
        { label: "E", text: "the development of writing tools" },
      ],
      answers: ["A", "D"],
    },
    {
      start: 23,
      end: 24,
      stem: "Which TWO problems do Dean and Hannah identify in their lesson?",
      options: [
        { label: "A", text: "the materials" },
        { label: "B", text: "the student grouping" },
        { label: "C", text: "the lesson structure" },
        { label: "D", text: "the teacher coordination" },
        { label: "E", text: "the timing" },
      ],
      answers: ["D", "E"],
    },
  ]);
  attachListeningAudio(listening, audioUrls);
  attachListeningMap(listening, listenImgs);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: readingMd,
    keys: keysPath,
    skill: "READING",
    slug: "test-11-reading",
    title: "Test 11 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  dropSpuriousReadingQuestions(reading);
  ensureChooseTwo(reading, [
    {
      start: 25,
      end: 26,
      stem: "Which TWO of the following statements does the writer make about garment assembly?",
      options: [
        {
          label: "A",
          text: "The majority of sewing is done by computer-operated machines.",
        },
        {
          label: "B",
          text: "Highly skilled workers are the most important requirement.",
        },
        {
          label: "C",
          text: "Most businesses use other companies to manufacture their products.",
        },
        {
          label: "D",
          text: "Fasteners and labels are attached after the clothes have been made up.",
        },
        {
          label: "E",
          text: "Manufacturers usually produce one range of women's clothing annually.",
        },
      ],
      answers: ["C", "D"],
    },
  ]);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of reading.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  ensureChooseTwo(reading, [
    {
      start: 25,
      end: 26,
      stem: "Which TWO of the following statements does the writer make about garment assembly?",
      options: [
        {
          label: "A",
          text: "The majority of sewing is done by computer-operated machines.",
        },
        {
          label: "B",
          text: "Highly skilled workers are the most important requirement.",
        },
        {
          label: "C",
          text: "Most businesses use other companies to manufacture their products.",
        },
        {
          label: "D",
          text: "Fasteners and labels are attached after the clothes have been made up.",
        },
        {
          label: "E",
          text: "Manufacturers usually produce one range of women's clothing annually.",
        },
      ],
      answers: ["C", "D"],
    },
  ]);
  // Keep Reading matching F as F (Q29)
  for (const part of reading.parts) {
    for (const q of part.questions) {
      if (q.number === 29 && q.correctAnswer === "FALSE") {
        q.correctAnswer = "F";
      }
    }
  }
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 11.docx"),
    skill: "WRITING",
    slug: "test-11-writing",
    title: "Test 11 - Writing",
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
    "\nDone. Local JSON under data/tests/test-11-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    '  npx tsx scripts/upsert-tests-from-json.ts --only "test-11-listening,test-11-reading,test-11-writing"',
  );
  if (audioUrls.length < 4) {
    console.log("\nBLOCKER: Test 11 listening audio incomplete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
