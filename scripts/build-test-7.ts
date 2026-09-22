/**
 * Build Test 7 assets: canonical keys (OCR from Keys.docx screenshots),
 * archive mislabeled combined audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-7.ts
 *
 * Keys.docx = screenshot Listening (image1, mislabeled "Listening Test 6"
 * but matches Listening 7 paper) + Reading Test 7 sheet (image2).
 * Matching letter F stays F (Listening Q20, Reading Q6/Q8).
 *
 * Audio: folder only has "IELTS Listening Actual 6 - Test 6.mp3" which is
 * byte-identical to Test 6 combined track (Box Hill). Do NOT attach as
 * Test 7 section audio. Archive to _old/.
 *
 * Do NOT touch Speaking / test-7-speaking.json / Test 9 / other tests.
 */
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
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

const SRC = path.join(process.cwd(), "IELTS", "Test 7");
const ABS = "E:/Wewin/IELTS/Test 7";
const ROOT = process.cwd();

/**
 * Listening: OCR Keys.docx image1 ("Listening Test 6" header — content matches
 * Listening 7.docx: tenant Anders / first aid / waste / geosequestration).
 * Reading: OCR Keys.docx image2 ("Test 7" sheet). Use middle column for 21–40
 * (matches P3 MCQ/YNG/endings). Ignore rightmost alt block (different paper).
 * Keep matching F as F. Choose THREE 18–20 = C/D/F any order.
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. quite",
    "2. impolite",
    "3. rarely",
    "4. smoke",
    "5. promptly",
    "6. co-operate",
    "7. attend meeting",
    "8. follow rules",
    "9. strictly forbidden",
    "10. be done",
    "",
    "Section 2",
    "11. steps",
    "12. danger",
    "13. respond",
    "14. unconscious",
    "15. blockages",
    "16. irregular",
    "17. medics",
    "18. C",
    "19. D",
    "20. F",
    "",
    "Section 3",
    "21. C",
    "22. A",
    "23. B",
    "24. C",
    "25. C",
    "26. ensure",
    "27. deposited",
    "28. display",
    "29. distribute",
    "30. reward",
    "",
    "Section 4",
    "31. B",
    "32. B",
    "33. B",
    "34. effectiveness",
    "35. (a) liquid",
    "36. pipework",
    "37. a quarter|one quarter|one-quarter|¼|1/4",
    "38. suffocation",
    "39. (almost) double",
    "40. heavy metals",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. D",
    "2. E",
    "3. D",
    "4. E",
    "5. A",
    "6. F",
    "7. H",
    "8. F",
    "9. C",
    "10. TRUE",
    "11. TRUE",
    "12. FALSE",
    "13. NOT GIVEN",
    "",
    "Passage 2",
    "14. iv",
    "15. ix",
    "16. ii",
    "17. viii",
    "18. vi",
    "19. i",
    "20. xi",
    "21. x",
    "22. TRUE",
    "23. FALSE",
    "24. NOT GIVEN",
    "25. TRUE",
    "26. FALSE",
    "",
    "Passage 3",
    "27. D",
    "28. B",
    "29. A",
    "30. C",
    "31. B",
    "32. NO",
    "33. NOT GIVEN",
    "34. YES",
    "35. NOT GIVEN",
    "36. E",
    "37. C",
    "38. D",
    "39. G",
    "40. B",
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
  const archived = path.join(oldDir, "Keys.screenshots.docx");
  try {
    await readFile(archived);
    console.log("Screenshot Key archive present:", archived);
  } catch {
    try {
      await copyFile(path.join(SRC, "Keys.docx"), archived);
      console.log("Archived Keys.docx →", archived);
    } catch (e) {
      console.warn("Could not archive Keys.docx:", e);
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
  if (!/^20\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q20 must remain letter F");
  }
  if (!/^6\.\s*F\s*$/m.test(text) || !/^8\.\s*F\s*$/m.test(text)) {
    throw new Error("Reading Q6 and Q8 must remain letter F");
  }

  await archiveScreenshotKeys();

  const keysMdPath = path.join(ROOT, "public/templates/test-7-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-7-keys.md");
  const key7Path = path.join(SRC, "Key 7.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await mkdir(path.dirname(keysMdPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(
    text,
    path.join(ROOT, "public/templates/test-7-keys.docx"),
  );
  await writeMinimalDocx(text, key7Path);

  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 7.docx"));
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 7.docx`);
  return keysMdPath;
}

/**
 * The only mp3 in Test 7 is byte-identical to Test 6 combined audio
 * (Actual 6 Test 6 / Box Hill). Archive it; do not publish as test-7 sections.
 */
async function archiveMislabeledAudio(): Promise<string[]> {
  const combinedName = "IELTS Listening Actual 6 - Test 6.mp3";
  const combined = path.join(SRC, combinedName);
  const oldDir = path.join(SRC, "_old");
  await mkdir(oldDir, { recursive: true });

  try {
    await readFile(combined);
    const dest = path.join(oldDir, combinedName);
    try {
      await readFile(dest);
      // already archived — remove working copy if still present
      await rename(combined, path.join(oldDir, `${combinedName}.dup`)).catch(
        async () => {
          // if rename fails because dest exists, just leave
        },
      );
    } catch {
      await rename(combined, dest);
      console.log("Archived mislabeled combined audio →", dest);
    }
  } catch {
    console.log("Combined audio already absent from Test 7 root");
  }

  // Mirror archive note to ABS
  try {
    await mkdir(path.join(ABS, "_old"), { recursive: true });
    const absCombined = path.join(ABS, combinedName);
    const absDest = path.join(ABS, "_old", combinedName);
    try {
      await readFile(absCombined);
      try {
        await readFile(absDest);
      } catch {
        await rename(absCombined, absDest);
      }
    } catch {
      /* no abs copy */
    }
  } catch (e) {
    console.warn("ABS audio archive:", e);
  }

  // Confirm no Test-6 leftover sections are silently reused
  for (let i = 1; i <= 4; i++) {
    const f = path.join(SRC, `section-${i}.mp3`);
    try {
      await readFile(f);
      console.warn(
        `WARNING: section-${i}.mp3 present in Test 7 — verify it is not a Test 6 copy before wiring`,
      );
    } catch {
      /* expected missing */
    }
  }

  console.log(
    "AUDIO BLOCKER: No authentic Test 7 listening audio. Listening JSON will have no section tracks.",
  );
  return [];
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 7.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-7-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const readBuf = await readFile(path.join(SRC, "Reading 7.docx"));
  const readImgs = await extractDocxImagesToUploads(readBuf, {
    slug: "test-7-reading",
    subdir: "images",
  });
  console.log("Reading images:", readImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 7.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-7-writing",
    prefix: "test-7-task1-maps",
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

/** Drop phantom blanks (e.g. "pages 10 and 11" → fake Q11 in Passage 3). */
function dropSpuriousReadingQuestions(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    const before = part.questions.length;
    if (/passage\s*3/i.test(part.title)) {
      part.questions = part.questions.filter((q) => q.number >= 27);
    } else if (/passage\s*2/i.test(part.title)) {
      part.questions = part.questions.filter((q) => q.number >= 14);
      for (const q of part.questions) {
        const stem = String((q.content as { stem?: string }).stem ?? "");
        if (/Paragraph\s+H/i.test(stem) && /[^\w\s]/.test(stem)) {
          (q.content as { stem: string }).stem = "Paragraph H";
        }
      }
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

/** Parser mis-reads "Choose THREE answers" as broken MATCHING — rebuild Q18–20. */
function fixChooseThreeAdvice(draft: ParsedTestDraft): void {
  const OPTIONS = [
    { label: "A", text: "Have proper equipment" },
    { label: "B", text: "Give regular first-aid training" },
    { label: "C", text: "Have a safety officer" },
    { label: "D", text: "Instil safe behaviour" },
    { label: "E", text: "Put posters on walls" },
    { label: "F", text: "Have safety meetings" },
    { label: "G", text: "Have first-aid boxes" },
  ];
  const stem =
    "Which THREE pieces of advice does the first-aid officer say are most important?";

  for (const part of draft.parts) {
    if (!/section\s*2|part\s*2/i.test(part.title)) continue;
    const byNum = new Map(part.questions.map((q) => [q.number, q]));
    const q18 = byNum.get(18);
    const q19 = byNum.get(19);
    const q20 = byNum.get(20);
    if (!q18 || !q19 || !q20) {
      console.warn("Choose THREE: missing Q18–20");
      continue;
    }

    q18.type = "MULTIPLE_CHOICE";
    q18.content = {
      stem,
      options: OPTIONS,
      selectCount: 3,
      covers: [18, 19, 20],
    };
    q18.correctAnswer = "C";

    q19.type = "MULTIPLE_CHOICE";
    q19.content = { stem: "", pairedFrom: 18 };
    q19.correctAnswer = "D";

    q20.type = "MULTIPLE_CHOICE";
    q20.content = { stem: "", pairedFrom: 18 };
    q20.correctAnswer = "F";

    console.log("  fixed Choose THREE Q18–20 (selectCount=3, C/D/F)");
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
    console.log("  multi-select / paired: (none)");
  }

  if (draft.skill !== "WRITING") {
    const sample = [1, 6, 8, 12, 18, 20, 27, 32, 36, 40]
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
  const audioUrls = await archiveMislabeledAudio();
  const { writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 7.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-7-listening",
    title: "Test 7 - Listening",
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
  fixChooseThreeAdvice(listening);
  // Re-merge after fix so Q18–20 answers stick (fix sets them; ensure F on 20)
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      // only fill missing — fixChooseThree already set 18–20
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachListeningAudio(listening, audioUrls);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: path.join(SRC, "Reading 7.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-7-reading",
    title: "Test 7 - Reading",
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
    file: path.join(SRC, "Writing 7.docx"),
    skill: "WRITING",
    slug: "test-7-writing",
    title: "Test 7 - Writing",
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
    "\nDone. Local JSON under data/tests/test-7-{listening,reading,writing}.json",
  );
  console.log("Speaking untouched. Upsert with:");
  console.log(
    "  npx tsx scripts/upsert-tests-from-json.ts --only test-7-listening,test-7-reading,test-7-writing",
  );
  console.log(
    "\nBLOCKER: Authentic Test 7 listening audio missing (folder had Test 6 combined track only).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
