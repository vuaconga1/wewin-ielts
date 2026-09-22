/**
 * Build Test 5 assets: canonical keys (OCR from Keyss.docx screenshots),
 * audio rename/copy, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-5.ts
 *
 * Keyss.docx = screenshot-only Listening + Reading → OCR, recreate Key-9
 * typed Key 5.docx. Keep matching letter F as F (not FALSE).
 * No Choose TWO in this paper (matching + single MCQ only).
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

const SRC = path.join(process.cwd(), "IELTS", "Test 5");
const ABS = "E:/Wewin/IELTS/Test 5";
const ROOT = process.cwd();

/**
 * Listening: OCR from Keyss.docx image2 (sheet title "Test 9").
 * Reading: OCR from Keyss.docx image1 (sheet title "Test 8").
 * Q10 reading: key OCR "bankruptancy" → passage word "bankruptcy".
 * Listening Q29 matching letter F stays F. Q38 keep key spelling "lonley".
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. Bittens",
    "2. group",
    "3. 23",
    "4. 12.50",
    "5. back",
    "6. wheelchair",
    "7. lift",
    "8. library",
    "9. vegetarian",
    "10. pizza",
    "",
    "Section 2",
    "11. C",
    "12. A",
    "13. B",
    "14. A",
    "15. B",
    "16. B",
    "17. A",
    "18. C",
    "19. B",
    "20. C",
    "",
    "Section 3",
    "21. A",
    "22. A",
    "23. C",
    "24. C",
    "25. B",
    "26. B",
    "27. D",
    "28. A",
    "29. F",
    "30. G",
    "",
    "Section 4",
    "31. company",
    "32. original",
    "33. description",
    "34. engineering",
    "35. communication",
    "36. language",
    "37. salary",
    "38. lonley",
    "39. industrial",
    "40. government",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. FALSE",
    "2. NOT GIVEN",
    "3. TRUE",
    "4. FALSE",
    "5. FALSE",
    "6. TRUE",
    "7. 1906",
    "8. Australia",
    "9. family",
    "10. bankruptcy",
    "11. writers",
    "12. reputation",
    "13. husband",
    "",
    "Passage 2",
    "14. I",
    "15. F",
    "16. G",
    "17. D",
    "18. C",
    "19. H",
    "20. C",
    "21. D",
    "22. B",
    "23. one-sixth",
    "24. 16th century",
    "25. Mercator",
    "26. John Gould",
    "",
    "Passage 3",
    "27. K",
    "28. H",
    "29. D",
    "30. J",
    "31. E",
    "32. B",
    "33. B",
    "34. C",
    "35. D",
    "36. C",
    "37. B",
    "38. YES",
    "39. NOT GIVEN",
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

async function archiveIfExists(from: string, toDir: string, name: string) {
  await mkdir(toDir, { recursive: true });
  try {
    await rename(from, path.join(toDir, name));
    console.log(`Archived ${name} → ${toDir}`);
  } catch {
    /* already archived or missing */
  }
}

/**
 * Windows is case-insensitive: `WRITING 5.docx` and `Writing 5.docx` are
 * the same path. Rename via a temp name, then archive a copy of the old name.
 */
async function ensureCanonicalDocNames(folder: string) {
  const oldDir = path.join(folder, "_old");
  await mkdir(oldDir, { recursive: true });

  const writingCanon = path.join(folder, "Writing 5.docx");
  const writingTemp = path.join(folder, "_Writing 5.tmp.docx");
  const archivedUpper = path.join(oldDir, "WRITING 5.docx");

  // Already have canonical on disk (correct casing in directory listing)?
  const listing = await import("node:fs/promises").then((fs) =>
    fs.readdir(folder),
  );
  const hasExactWriting = listing.includes("Writing 5.docx");
  const hasUpperWriting = listing.includes("WRITING 5.docx");

  if (hasExactWriting) {
    if (hasUpperWriting) {
      // Distinct only on case-sensitive FS; on Windows this branch is rare
      await archiveIfExists(
        path.join(folder, "WRITING 5.docx"),
        oldDir,
        "WRITING 5.docx",
      );
    }
    return;
  }

  // Restore from _old if needed
  if (!hasUpperWriting) {
    try {
      await copyFile(archivedUpper, writingTemp);
      await rename(writingTemp, writingCanon);
      console.log(`Restored Writing 5.docx from _old in ${folder}`);
      return;
    } catch (e) {
      console.warn(`Missing Writing 5.docx in ${folder}`, e);
      return;
    }
  }

  // Case-only rename: WRITING → temp → Writing, keep archive copy
  const writingUpper = path.join(folder, "WRITING 5.docx");
  try {
    await copyFile(writingUpper, archivedUpper);
    await rename(writingUpper, writingTemp);
    await rename(writingTemp, writingCanon);
    console.log(`Renamed WRITING 5.docx → Writing 5.docx in ${folder}`);
  } catch (e) {
    console.warn(`Writing rename failed in ${folder}`, e);
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
  // Guard: Listening matching letter Q29 must stay F, not FALSE
  if (!/^29\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q29 must remain letter F");
  }
  // Guard: Reading matching letter Q15 must stay F, not FALSE
  if (!/^15\.\s*F\s*$/m.test(text)) {
    throw new Error("Reading Q15 must remain letter F");
  }

  const keysMdPath = path.join(ROOT, "public/templates/test-5-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-5-keys.md");
  const key5Path = path.join(SRC, "Key 5.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(text, path.join(ROOT, "public/templates/test-5-keys.docx"));
  await writeMinimalDocx(text, key5Path);

  await archiveIfExists(
    path.join(SRC, "Keyss.docx"),
    path.join(SRC, "_old"),
    "Keyss.docx",
  );

  // Mirror to absolute IELTS folder
  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 5.docx"));
    await archiveIfExists(
      path.join(ABS, "Keyss.docx"),
      path.join(ABS, "_old"),
      "Keyss.docx",
    );
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 5.docx`);
  return keysMdPath;
}

async function renameAudioInFolder(folder: string) {
  const mapping: [string, string][] = [
    ["08section1(2).mp3", "section-1.mp3"],
    ["08section2.mp3", "section-2.mp3"],
    ["08Section3.mp3", "section-3.mp3"],
    ["08section4.mp3", "section-4.mp3"],
  ];
  const oldDir = path.join(folder, "_old");
  await mkdir(oldDir, { recursive: true });

  for (const [oldName, newName] of mapping) {
    const oldPath = path.join(folder, oldName);
    const newPath = path.join(folder, newName);
    try {
      await copyFile(oldPath, newPath);
      await rename(oldPath, path.join(oldDir, oldName));
      console.log(`Audio rename ${oldName} → ${newName} (+ archive)`);
    } catch {
      try {
        await readFile(newPath);
        console.log(`Audio already ${newName}`);
      } catch {
        try {
          await copyFile(path.join(oldDir, oldName), newPath);
          console.log(`Audio restored ${oldName} → ${newName}`);
        } catch (e) {
          console.warn(`Missing audio ${oldName} in ${folder}`, e);
        }
      }
    }
  }
}

async function copyAudio(): Promise<string[]> {
  await renameAudioInFolder(SRC);
  try {
    await renameAudioInFolder(ABS);
  } catch (e) {
    console.warn("ABS audio rename:", e);
  }

  const audioDir = path.join(ROOT, "public/uploads/audio");
  await mkdir(audioDir, { recursive: true });
  const urls: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const destName = `test-5-section-${i}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, `section-${i}.mp3`), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 5.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-5-listening",
    prefix: "test-5-listening-map",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 5.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-5-writing",
    prefix: "test-5-task1-diagram",
    subdir: "writing",
  });
  console.log("Writing images:", writeUrls);
  return { listenImgs, writeUrls };
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

/** Avoid "Passage N - Title" + same title as first content line (double header). */
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

function attachListeningAudioAndMap(
  draft: ParsedTestDraft,
  audioUrls: string[],
  mapUrl?: string,
): void {
  draft.audioFiles = audioUrls;
  for (let i = 0; i < draft.parts.length; i++) {
    const part = draft.parts[i]!;
    const audioUrl = audioUrls[i] ?? audioUrls[0];
    part.meta = { ...part.meta, audioUrl };
    if (mapUrl && /section\s*2|part\s*2/i.test(part.title)) {
      part.meta = { ...part.meta, imageUrl: mapUrl, mediaUrl: mapUrl };
      for (const q of part.questions) {
        if (q.type === "MAP_LABELING" || (q.number >= 11 && q.number <= 14)) {
          q.mediaUrl = mapUrl;
          (q.content as Record<string, unknown>).imageUrl = mapUrl;
        }
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
    const sample = [1, 15, 27, 28, 29, 30, 38, 40]
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
}) {
  const { draft, issues } = await parseTestFromFiles({
    contentPath: opts.file,
    keysPath: opts.keys,
    skill: opts.skill,
    slug: opts.slug,
    title: opts.title,
    sourceFolder: SRC,
    audioFiles: opts.audioFiles,
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
  await ensureCanonicalDocNames(SRC);
  try {
    await ensureCanonicalDocNames(ABS);
  } catch (e) {
    console.warn("ABS rename:", e);
  }

  const keysPath = await buildCanonicalKeys();
  const audioUrls = await copyAudio();
  const { listenImgs, writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 5.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-5-listening",
    title: "Test 5 - Listening",
    audioFiles: audioUrls,
  });
  cleanListeningNotes(listening);
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachListeningAudioAndMap(listening, audioUrls, listenImgs[0]);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: path.join(SRC, "Reading 5.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-5-reading",
    title: "Test 5 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  // Ensure Reading matching Q15 stays letter F after merge
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
    file: path.join(SRC, "Writing 5.docx"),
    skill: "WRITING",
    slug: "test-5-writing",
    title: "Test 5 - Writing",
  });
  if (writeUrls[0]) {
    for (const part of writing.parts) {
      if (/\bTask\s*1\b/i.test(part.title) || part.order === 0) {
        part.meta = { ...part.meta, imageUrl: writeUrls[0] };
        for (const q of part.questions) {
          q.mediaUrl = writeUrls[0];
          (q.content as Record<string, unknown>).imageUrl = writeUrls[0];
        }
      }
    }
  }
  summarize(writing);
  await saveTestDraft(writing);

  console.log(
    "\nDone. Local JSON under data/tests/test-5-{listening,reading,writing}.json",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
