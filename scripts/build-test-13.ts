/**
 * Build Test 13 assets: canonical keys (OCR from keys.docx screenshots),
 * silence-split section audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-13.ts
 *
 * Source: IELTS/Test 13/ — L/R/W 13.docx, Key 13 (screenshot→typed),
 * section-1..4.mp3 (split from Actual 6 Test 5 combined track).
 * Matching F stays F (Listening Q14). Choose THREE:
 * Listening 33–35 = B/C/E; Reading 37–39 = B/D/E.
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

const SRC = path.join(process.cwd(), "IELTS", "Test 13");
const ABS = "E:/Wewin/IELTS/Test 13";
const ROOT = process.cwd();

/**
 * Listening: OCR keys.docx image2 (ANSWERS grid). Matching F stays F (Q14).
 * Alts: Q3 6/six days; Q18 reverse|reserve; Q23 inperspective|in perspective;
 * Q39 characterized|characterised; Q40 cheese(s).
 * Reading: OCR keys.docx image1. Choose THREE 37–39 = B/D/E.
 * Q34 Disneyland (OCR had Disncyland typo — accept both).
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. equipment",
    "2. Fred",
    "3. 6 days|six days|6",
    "4. Mike",
    "5. Leo",
    "6. C",
    "7. A",
    "8. C",
    "9. B",
    "10. C",
    "",
    "Section 2",
    "11. E",
    "12. A",
    "13. D",
    "14. F",
    "15. C",
    "16. yellow",
    "17. garden shed",
    "18. wildlife reverse|wildlife reserve",
    "19. firewood",
    "20. garden bin",
    "",
    "Section 3",
    "21. Welfare State",
    "22. too long",
    "23. inperspective|in perspective",
    "24. oversimplifies",
    "25. Political Theory",
    "26. not relevant",
    "27. C",
    "28. S",
    "29. P",
    "30. P",
    "",
    "Section 4",
    "31. C",
    "32. C",
    "33. B",
    "34. C",
    "35. E",
    "36. participate",
    "37. natural springs",
    "38. local product",
    "39. characterized|characterised",
    "40. mature cheese|mature cheeses",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. C",
    "2. D",
    "3. C",
    "4. A",
    "5. E",
    "6. clerk|a clerk",
    "7. front lobby",
    "8. gallery",
    "9. stockroom",
    "10. customers",
    "11. C",
    "12. B",
    "13. C",
    "",
    "Passage 2",
    "14. H",
    "15. J",
    "16. I",
    "17. K",
    "18. G",
    "19. NOT GIVEN",
    "20. TRUE",
    "21. TRUE",
    "22. FALSE",
    "23. FALSE",
    "24. in the 1960s|1960s",
    "25. Tanzania",
    "26. close observation",
    "27. cultural origin",
    "",
    "Passage 3",
    "28. B",
    "29. A",
    "30. C",
    "31. D",
    "32. B",
    "33. liquid",
    "34. Disneyland|Disncyland",
    "35. rigorous experimentation",
    "36. grammar school",
    "37. B",
    "38. D",
    "39. E",
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
      await copyFile(path.join(SRC, "keys.docx"), archived);
      console.log("Archived keys.docx →", archived);
    } catch (e) {
      console.warn("Could not archive keys.docx:", e);
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
  if (!/^14\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q14 must remain letter F");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-13-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-13-keys.md");
  const key13Path = path.join(SRC, "Key 13.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-13-keys.docx"),
  );
  await writeMinimalDocx(text, key13Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 13.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 13.docx`);
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
    const destName = `test-13-section-${i}.mp3`;
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

  const { readdir } = await import("node:fs/promises");
  const all = await readdir(audioDir);
  const others = all.filter(
    (f) =>
      /^test-\d+-section-\d+\.mp3$/i.test(f) && !f.startsWith("test-13-"),
  );
  const collisions: string[] = [];
  for (const other of others) {
    const h = await sha256File(path.join(audioDir, other));
    for (let i = 0; i < newHashes.length; i++) {
      if (newHashes[i] === h) {
        collisions.push(`test-13-section-${i + 1}.mp3 == ${other}`);
      }
    }
  }
  if (collisions.length) {
    console.error("AUDIO SHA COLLISION:", collisions.join("; "));
  } else {
    console.log(
      `Audio SHA OK: test-13 sections unique vs ${others.length} other tracks`,
    );
  }

  // Explicit check vs Test 6 leftovers
  for (let i = 1; i <= 4; i++) {
    const t6 = path.join(audioDir, `test-6-section-${i}.mp3`);
    try {
      const h6 = await sha256File(t6);
      if (newHashes.includes(h6)) {
        throw new Error(`Test 13 section SHA matches test-6-section-${i}.mp3`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("matches")) throw e;
    }
  }
  console.log("Audio SHA ≠ Test 6 leftovers: OK");

  if (urls.length < 4) {
    console.log("AUDIO BLOCKER: Need section-1..4.mp3 in Test 13 folder.");
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
  t = t.replace(/^Section\s*1\s*$/im, "PART 1\nQuestions 1-10");
  t = t.replace(/^Section\s*2\s*$/im, "PART 2\nQuestions 11-20");
  t = t.replace(/^Section\s*3\s*$/im, "PART 3\nQuestions 21-30");
  t = t.replace(/^Section\s*4\s*$/im, "PART 4\nQuestions 31-40");
  t = t.replace(/\bQuestion\s+(\d+)\s*[-–—]\s*(\d+)/gi, "Questions $1-$2");
  // Number matching schedule blanks with time-slot stems
  t = t.replace(
    /^11[.…\s]*$/m,
    "11. 8 am – noon",
  );
  t = t.replace(/^12[.…\s]*$/m, "12. noon – 2 pm");
  t = t.replace(/^13[.…\s]*$/m, "13. 2 pm – 3 pm");
  t = t.replace(/^14[.…\s]*$/m, "14. 3 pm – 4 pm");
  t = t.replace(/^15[.…\s]*$/m, "15. 4 pm – 5 pm");
  // Favorite subjects
  t = t.replace(/^27[.…\s]*Steve\s*$/im, "27. Steve");
  t = t.replace(/^28[.…\s]*David\s*$/im, "28. David");
  t = t.replace(/^29[.…\s]*Susan\s*$/im, "29. Susan");
  t = t.replace(/^30[.…\s]*Olive\s*$/im, "30. Olive");
  return t.trim() + "\n";
}

function fixReadingText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n");
  t = t.replace(/READING PASSAGE\s+(\d+)/gi, "\nREADING PASSAGE $1\n");
  t = t.replace(/Question 1-13/gi, "Questions 1-13");
  t = t.replace(/Question 40/gi, "Questions 40");
  // Number gap stems that lost blanks
  t = t.replace(
    /^8 Customers would be under surveillance at the \.\s*$/im,
    "8 Customers would be under surveillance at the ________.",
  );
  t = t.replace(
    /^9 Another area in his store was called '', which was only accessible to the internal staff\.\s*$/im,
    "9 Another area in his store was called ________, which was only accessible to the internal staff.",
  );
  return t.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

async function writeCleanedPapers(): Promise<{
  listeningMd: string;
  readingMd: string;
}> {
  const cleanDir = path.join(SRC, "_clean");
  await mkdir(cleanDir, { recursive: true });
  const listeningMd = path.join(cleanDir, "Listening 13.md");
  const readingMd = path.join(cleanDir, "Reading 13.md");
  await writeFile(
    listeningMd,
    fixListeningText(await docxPlainText(path.join(SRC, "Listening 13.docx"))),
    "utf8",
  );
  await writeFile(
    readingMd,
    fixReadingText(await docxPlainText(path.join(SRC, "Reading 13.docx"))),
    "utf8",
  );
  console.log("Wrote cleaned papers →", cleanDir);
  return { listeningMd, readingMd };
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 13.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-13-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 13.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-13-reading",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 13.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-13-writing",
    prefix: "test-13-task1-chart",
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

const SCHEDULE_OPTIONS = [
  { label: "A", text: "Birds in ceiling" },
  { label: "B", text: "Broken windows" },
  { label: "C", text: "Electrical fault" },
  { label: "D", text: "Fallen tree" },
  { label: "E", text: "Leaking roof" },
  { label: "F", text: "Staining on walls" },
];

const SCHEDULE_STEMS: Record<number, string> = {
  11: "8 am – noon",
  12: "noon – 2 pm",
  13: "2 pm – 3 pm",
  14: "3 pm – 4 pm",
  15: "4 pm – 5 pm",
};

const SUBJECT_OPTIONS = [
  { label: "S", text: "Social History" },
  { label: "C", text: "Cultural Studies" },
  { label: "P", text: "Political Theory" },
];

const SUBJECT_STEMS: Record<number, string> = {
  27: "Steve",
  28: "David",
  29: "Susan",
  30: "Olive",
};

function ensureListeningMatching(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    if (/section\s*2|part\s*2/i.test(part.title)) {
      for (const [n, stem] of Object.entries(SCHEDULE_STEMS)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: SCHEDULE_OPTIONS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: SCHEDULE_OPTIONS },
          });
        }
      }
      console.log("  ensured Matching Q11–15 (repair schedule)");
    }
    if (/section\s*3|part\s*3/i.test(part.title)) {
      for (const [n, stem] of Object.entries(SUBJECT_STEMS)) {
        const num = Number(n);
        const existing = byNum.get(num);
        if (existing) {
          existing.type = "MATCHING";
          existing.content = { stem, options: SUBJECT_OPTIONS };
        } else {
          part.questions.push({
            number: num,
            order: num,
            type: "MATCHING",
            content: { stem, options: SUBJECT_OPTIONS },
          });
        }
      }
      console.log("  ensured Matching Q27–30 (favorite subjects)");
    }
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((q, i) => {
      q.order = i;
    });
  }
}

function ensureChooseMulti(
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
      throw new Error(`Choose multi mismatch for Q${start}-${end}`);
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
        `  fixed Choose ${answers.length} Q${start}–${end} (${answers.join("/")})`,
      );
    }
  }
}

const LISTENING_CHOOSE_THREE = {
  start: 33,
  end: 35,
  stem: "Which THREE factors are typical of modern farming?",
  options: [
    { label: "A", text: "Many overheads" },
    { label: "B", text: "More machines" },
    { label: "C", text: "Fewer types of products" },
    { label: "D", text: "More frequent feeding" },
    { label: "E", text: "Greater numbers of products" },
    { label: "F", text: "More factories" },
  ],
  answers: ["B", "C", "E"],
};

const READING_CHOOSE_THREE = {
  start: 37,
  end: 39,
  stem: "Which THREE are mentioned by the writer of the passage as characteristics of qualitative research?",
  options: [
    {
      label: "A",
      text: "Coding behaviour in terms of a predefined set of categories",
    },
    { label: "B", text: "Designing an interview as an easy conversation" },
    {
      label: "C",
      text: "Working with well-organised data in a closed set of analytical categories",
    },
    {
      label: "D",
      text: "Full of details instead of loads of data in questionnaires",
    },
    { label: "E", text: "Asking to give open-ended answers in questionnaires" },
    {
      label: "F",
      text: "Recording the researching situation and applying note-taking",
    },
  ],
  answers: ["B", "D", "E"],
};

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
      part.questions = part.questions.filter((q) => q.number >= 28);
    } else if (/passage\s*2/i.test(part.title)) {
      part.questions = part.questions.filter(
        (q) => q.number >= 14 && q.number <= 27,
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

function attachListeningSchedule(
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
    console.log("  attached schedule image to Section 2 / Q11–15");
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
    const sample = [1, 10, 14, 21, 25, 29, 31, 33, 37, 40]
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
    slug: "test-13-listening",
    title: "Test 13 - Listening",
    audioFiles: audioUrls.length ? audioUrls : undefined,
  });
  cleanListeningNotes(listening);
  ensureListeningMatching(listening);
  ensureChooseMulti(listening, [LISTENING_CHOOSE_THREE]);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  ensureChooseMulti(listening, [LISTENING_CHOOSE_THREE]);
  // Keep Listening matching F as F (Q14)
  for (const part of listening.parts) {
    for (const q of part.questions) {
      if (q.number === 14 && q.correctAnswer === "FALSE") {
        q.correctAnswer = "F";
      }
    }
  }
  attachListeningAudio(listening, audioUrls);
  attachListeningSchedule(listening, listenImgs);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: readingMd,
    keys: keysPath,
    skill: "READING",
    slug: "test-13-reading",
    title: "Test 13 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  dropSpuriousReadingQuestions(reading);
  ensureChooseMulti(reading, [READING_CHOOSE_THREE]);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "READING" });
    for (const part of reading.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  ensureChooseMulti(reading, [READING_CHOOSE_THREE]);
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 13.docx"),
    skill: "WRITING",
    slug: "test-13-writing",
    title: "Test 13 - Writing",
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
    "\nDone. Local JSON under data/tests/test-13-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    '  npx tsx scripts/upsert-tests-from-json.ts --only "test-13-listening,test-13-reading,test-13-writing"',
  );
  if (audioUrls.length < 4) {
    console.log("\nBLOCKER: Test 13 listening audio incomplete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
