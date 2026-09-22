/**
 * Build Test 8 assets: canonical keys (OCR from keys 8.docx screenshots +
 * typed Reading fragment), images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-8.ts
 *
 * keys 8.docx = screenshot Listening S1–S4 + typed Reading answer list.
 * Matching letter F stays F (Listening Q17/Q24).
 * Audio: none in folder — do NOT invent/reuse Test 5 08section* tracks.
 *
 * No Choose TWO/THREE in this paper (matching + single MCQ only).
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

const SRC = path.join(process.cwd(), "IELTS", "Test 8");
const ABS = "E:/Wewin/IELTS/Test 8";
const ROOT = process.cwd();

/**
 * Listening: OCR keys 8.docx images (S1 image4, S2 image3, S3 image1, S4 image2).
 * Q16–20: typed fragment "16 A, 17. F, 18. G, 19. D, 20. B" (letters; F stays F).
 * Reading: typed list in keys 8.docx body (roman headings lowercase).
 * P2 Q16 typed "traw" → passage "straw".
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. CWX576884",
    "2. 9 months|nine months|9/nine months",
    "3. Middle Street",
    "4. Go194KE|GO194KE|GO19 4KE",
    "5. water|Water",
    "6. switched off|Switched off",
    "7. wood",
    "8. client engineer|Client engineer",
    "9. next Tuesday",
    "10. Post Office|post office",
    "",
    "Section 2",
    "11. C",
    "12. A",
    "13. B",
    "14. A",
    "15. C",
    "16. A",
    "17. F",
    "18. G",
    "19. D",
    "20. B",
    "",
    "Section 3",
    "21. C",
    "22. B",
    "23. D",
    "24. F",
    "25. A",
    "26. E",
    "27. A",
    "28. C",
    "29. A",
    "30. A",
    "",
    "Section 4",
    "31. health",
    "32. salary",
    "33. forest",
    "34. October",
    "35. king",
    "36. beer",
    "37. deserts",
    "38. concentrated",
    "39. shipping",
    "40. transport",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. viii",
    "2. iv",
    "3. ix",
    "4. vi",
    "5. v",
    "6. vii",
    "7. iii",
    "8. x",
    "9. D",
    "10. E",
    "11. B",
    "12. G",
    "13. A",
    "",
    "Passage 2",
    "14. clay|Clay",
    "15. water|Water",
    "16. straw|Straw",
    "17. cow manure|Cow manure",
    "18. 950 degrees|950°",
    "19. 60 minutes",
    "20. TRUE",
    "21. NOT GIVEN",
    "22. FALSE",
    "23. NOT GIVEN",
    "24. C",
    "25. B",
    "26. A",
    "",
    "Passage 3",
    "27. sound laws|Sound laws",
    "28. fashion|Fashion",
    "29. imperfect|Imperfect",
    "30. principle of ease|Principle of ease",
    "31. FALSE",
    "32. FALSE",
    "33. NOT GIVEN",
    "34. TRUE",
    "35. TRUE",
    "36. NOT GIVEN",
    "37. TRUE",
    "38. C",
    "39. B",
    "40. A",
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
  const archived = path.join(oldDir, "keys 8.screenshots.docx");
  try {
    await readFile(archived);
    console.log("Screenshot Key archive present:", archived);
  } catch {
    try {
      await copyFile(path.join(SRC, "keys 8.docx"), archived);
      console.log("Archived keys 8.docx →", archived);
    } catch (e) {
      console.warn("Could not archive keys 8.docx:", e);
    }
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
  if (!/^17\.\s*F\s*$/m.test(text) || !/^24\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q17 and Q24 must remain letter F");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-8-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-8-keys.md");
  const key8Path = path.join(SRC, "Key 8.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-8-keys.docx"),
  );
  await writeMinimalDocx(text, key8Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 8.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 8.docx`);
  return keysMdPath;
}

/**
 * Test 8 folder has no section MP3s. Do not wire Test 5's 08section* files.
 */
async function prepareAudio(): Promise<string[]> {
  for (let i = 1; i <= 4; i++) {
    const f = path.join(SRC, `section-${i}.mp3`);
    try {
      await readFile(f);
      // If authentic sections appear later, copy into public uploads.
      const destName = `test-8-section-${i}.mp3`;
      const dest = path.join(ROOT, "public", "uploads", "audio", destName);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(f, dest);
      try {
        await mkdir(ABS, { recursive: true });
        await copyFile(f, path.join(ABS, `section-${i}.mp3`));
      } catch {
        /* abs optional */
      }
      console.log(`Copied section-${i}.mp3 → /uploads/audio/${destName}`);
    } catch {
      /* expected missing */
    }
  }

  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const dest = path.join(
      ROOT,
      "public",
      "uploads",
      "audio",
      `test-8-section-${i}.mp3`,
    );
    try {
      await readFile(dest);
      urls.push(`/uploads/audio/test-8-section-${i}.mp3`);
    } catch {
      /* missing */
    }
  }

  if (urls.length === 4) {
    console.log("Listening audio ready:", urls.join(", "));
  } else {
    console.log(
      "AUDIO BLOCKER: No authentic Test 8 listening audio (section-1..4.mp3 absent).",
    );
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

/** Fix Listening Word export quirks so the IELTS parser keeps all 40 Qs. */
function fixListeningText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/^SECTION\s+1\s+Question\s+1\s*[-–—]\s*10\s*$/im, "SECTION 1");
  t = t.replace(/^Section\s+2\s+Question\s+11\s*[-–—]\s*20\s*$/im, "SECTION 2");
  t = t.replace(/^SECTION\s+3\s+Questions?\s+21\s*[-–—]\s*30\s*$/im, "SECTION 3");
  t = t.replace(/^SECTION\s+4\b.*$/im, "SECTION 4");
  t = t.replace(/Questions?\s+1\s*[-–—]\s*6\b/i, "Questions 1-10");
  // Strip same-line / next-line "next to Questions N–M" before Question→Questions
  t = t.replace(
    /(Write the correct letter,\s*A\s*[-–—]\s*[A-H],?\s*next to)\s+Questions?\s+\d+\s*[-–—]\s*\d+/gi,
    "$1 questions",
  );
  t = t.replace(
    /(Write the correct letter,\s*A\s*[-–—]\s*[A-H],?\s*next to)\s*\n+Questions?\s+\d+\s*[-–—]\s*\d+/gi,
    "$1 questions",
  );
  t = t.replace(/\bQuestion\s+(\d+)\s*[-–—]\s*(\d+)/gi, "Questions $1-$2");
  t = t.replace(/\bFeatures\s*A\b/g, "Features\nA");
  t = t.replace(/\bProblems\s*A\b/g, "Problems\nA");
  t = t.replace(/\bCities\s+(\d)/g, "Cities\n$1");
  t = t.replace(/\bParts of the hotel\s+(\d)/gi, "Parts of the hotel\n$1");
  // Letter bank as "A text" (parser sameLine needs space, not "A.")
  t = t.replace(/^([A-H])[.)]\s+/gim, "$1 ");
  t = t.replace(/^([A-H])\s+(?=[a-z])/gim, "$1 ");
  // Longer matching stems so SHORT_ANSWER fallback still keeps them
  t = t.replace(/^(\d{1,2})[.)]?\s*London\b.*$/gim, "$1. London city");
  t = t.replace(/^(\d{1,2})[.)]?\s*Edinburgh\b.*$/gim, "$1. Edinburgh city");
  t = t.replace(/^(\d{1,2})[.)]?\s*Cardiff\b.*$/gim, "$1. Cardiff city");
  t = t.replace(/^(\d{1,2})[.)]?\s*Manchester\b.*$/gim, "$1. Manchester city");
  t = t.replace(/^(\d{1,2})[.)]?\s*oxford\b.*$/gim, "$1. Oxford city");
  t = t.replace(/^(\d{1,2})[.)]?\s*reception\b.*$/gim, "$1. reception desk");
  t = t.replace(/^(\d{1,2})[.)]?\s*restaurant\b.*$/gim, "$1. restaurant area");
  t = t.replace(/^(\d{1,2})[.)]?\s*coffee bar\b.*$/gim, "$1. coffee bar area");
  t = t.replace(/^(\d{1,2})[.)]?\s*shop\b.*$/gim, "$1. hotel shop");
  t = t.replace(
    /^(\d{1,2})[.)]?\s*personal office\b.*$/gim,
    "$1. personal office",
  );
  t = t.replace(/^(\d{1,2})[.)]?\s*cleaning\b.*$/gim, "$1. cleaning staff");
  t = t.replace(
    /(Time of purchase:\s*)(2)(\s*$)/im,
    "$1$2 ...................",
  );
  return t.trim() + "\n";
}

/** Relabel the second passage heading (source mislabels P3 as P2). */
function fixReadingText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  let headingHits = 0;
  t = t.replace(/^(?:READING\s+)?PASSAGE\s+2\s*$/gim, (m) => {
    headingHits += 1;
    return headingHits === 1 ? m : "READING PASSAGE 3";
  });
  t = t.replace(
    /(Questions?\s+27\s*[-–—]\s*40[\s\S]{0,120}?based on Reading Passage )2\b/i,
    "$13",
  );
  t = t.replace(/Reading Passage 243/gi, "Reading Passage 3");
  return t.trim() + "\n";
}

async function writeCleanedPapers(): Promise<{
  listeningMd: string;
  readingMd: string;
}> {
  const cleanDir = path.join(SRC, "_clean");
  await mkdir(cleanDir, { recursive: true });
  const listeningMd = path.join(cleanDir, "Listening 8.md");
  const readingMd = path.join(cleanDir, "Reading 8.md");
  await writeFile(
    listeningMd,
    fixListeningText(await docxPlainText(path.join(SRC, "Listening 8.docx"))),
    "utf8",
  );
  await writeFile(
    readingMd,
    fixReadingText(await docxPlainText(path.join(SRC, "Reading 8.docx"))),
    "utf8",
  );
  console.log("Wrote cleaned papers →", cleanDir);
  return { listeningMd, readingMd };
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 8.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-8-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 8.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-8-reading",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 8.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-8-writing",
    prefix: "test-8-task1-chart",
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

const CITY_FEATURES = [
  { label: "A", text: "good signage" },
  { label: "B", text: "multiple access roads" },
  { label: "C", text: "police control points" },
  { label: "D", text: "ring roads" },
  { label: "E", text: "one-way streets" },
  { label: "F", text: "Effective traffic lights" },
  { label: "G", text: "Additional lanes" },
  { label: "H", text: "Pedestrianised areas" },
];

const HOTEL_PROBLEMS = [
  { label: "A", text: "it is lack patience" },
  { label: "B", text: "it is very strict" },
  { label: "C", text: "it is a daily routine" },
  { label: "D", text: "it lacks sufficient staff" },
  { label: "E", text: "it is noisy" },
  { label: "F", text: "it is very tiring" },
];

/** Parser drops short matching labels; rebuild Q16–20 and Q21–26. */
function ensureListeningMatching(draft: ParsedTestDraft): void {
  const cities: Record<number, string> = {
    16: "London",
    17: "Edinburgh",
    18: "Cardiff",
    19: "Manchester",
    20: "Oxford",
  };
  const hotel: Record<number, string> = {
    21: "reception",
    22: "restaurant",
    23: "coffee bar",
    24: "shop",
    25: "personal office",
    26: "cleaning",
  };

  for (const part of draft.parts) {
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    if (/section\s*2/i.test(part.title)) {
      for (const [n, stem] of Object.entries(cities)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: CITY_FEATURES };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: CITY_FEATURES },
          });
        }
      }
      console.log("  ensured Matching Q16–20 (city features)");
    }
    if (/section\s*3/i.test(part.title)) {
      for (const [n, stem] of Object.entries(hotel)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing && existing.type === "MULTIPLE_CHOICE" && num >= 27) {
          continue;
        }
        if (existing && num >= 27) continue;
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: HOTEL_PROBLEMS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: HOTEL_PROBLEMS },
          });
        }
      }
      // Drop any stray SHORT_ANSWER duplicates for 21–26 that aren't matching
      part.questions = part.questions.filter((q) => {
        if (q.number >= 21 && q.number <= 26 && q.type !== "MATCHING") {
          return false;
        }
        return true;
      });
      console.log("  ensured Matching Q21–26 (hotel parts)");
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

/** Source doc mislabels Passage 3 as "READING PASSAGE 2". */
function fixPassage3Label(draft: ParsedTestDraft): void {
  const parts = draft.parts;
  if (parts.length < 3) return;
  const last = parts[parts.length - 1]!;
  if (/passage\s*3/i.test(last.title)) return;
  if (/passage\s*2/i.test(last.title) || /linguistic change/i.test(last.title)) {
    const prevTitle = last.title;
    last.title = "Passage 3";
    console.log(`  relabeled "${prevTitle}" → Passage 3`);
  }
  // If two parts share "Passage 2", keep first; force last to 3
  const p2 = parts.filter((p) => /passage\s*2/i.test(p.title));
  if (p2.length >= 2) {
    const second = p2[p2.length - 1]!;
    second.title = "Passage 3";
    console.log("  fixed duplicate Passage 2 → Passage 3");
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
    console.log("  multi-select / paired: (none — expected for Test 8)");
  }

  if (draft.skill !== "WRITING") {
    const sample = [1, 8, 16, 17, 20, 24, 27, 32, 38, 40]
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
  const { writeUrls } = await extractMedia();
  const { listeningMd, readingMd } = await writeCleanedPapers();

  let listening = await importSkill({
    file: listeningMd,
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-8-listening",
    title: "Test 8 - Listening",
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
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: readingMd,
    keys: keysPath,
    skill: "READING",
    slug: "test-8-reading",
    title: "Test 8 - Reading",
  });
  fixPassage3Label(reading);
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
    file: path.join(SRC, "Writing 8.docx"),
    skill: "WRITING",
    slug: "test-8-writing",
    title: "Test 8 - Writing",
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
    "\nDone. Local JSON under data/tests/test-8-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    '  npx tsx scripts/upsert-tests-from-json.ts --only "test-8-listening,test-8-reading,test-8-writing"',
  );
  if (audioUrls.length < 4) {
    console.log(
      "\nBLOCKER: Authentic Test 8 listening audio missing (no section-1..4.mp3).",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
