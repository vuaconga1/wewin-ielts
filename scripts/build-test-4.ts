/**
 * Build Test 4 assets: canonical keys (OCR Listening + typed Reading),
 * audio rename/copy, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-4.ts
 *
 * Keys.docx = typed Reading + screenshot-only Listening → OCR Listening,
 * recreate Key-9 typed Key 4.docx. Keep matching letter F as F (not FALSE).
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

const SRC = path.join(process.cwd(), "IELTS", "Test 4");
const ABS = "E:/Wewin/IELTS/Test 4";
const ROOT = process.cwd();

/**
 * Listening: OCR from Keys.docx screenshot (P1–P4 grid).
 * Reading: typed text from Keys.docx (normalized to Key-9).
 * Keep matching letter F as F (Listening Q28). Prefer WEWIN key order for
 * Choose TWO: 17–18 = C/D, 19–20 = A/C (order-independent in scorer).
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. sea",
    "2. animals",
    "3. eggs",
    "4. fire",
    "5. 15.75",
    "6. fishing",
    "7. bike",
    "8. football",
    "9. July",
    "10. pool",
    "",
    "Section 2",
    "11. B",
    "12. A",
    "13. C",
    "14. B",
    "15. C",
    "16. A",
    "17. C",
    "18. D",
    "19. A",
    "20. C",
    "",
    "Section 3",
    "21. B",
    "22. A",
    "23. B",
    "24. C",
    "25. C",
    "26. B",
    "27. A",
    "28. F",
    "29. H",
    "30. G",
    "",
    "Section 4",
    "31. month",
    "32. profit",
    "33. size",
    "34. research",
    "35. wires",
    "36. dirt",
    "37. plastic",
    "38. floor",
    "39. water",
    "40. ink",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. FALSE",
    "2. TRUE",
    "3. NOT GIVEN",
    "4. TRUE",
    "5. FALSE",
    "6. TRUE",
    "7. NOT GIVEN",
    "8. Animals",
    "9. Emotion",
    "10. Gene",
    "11. Left",
    "12. Laboratory",
    "13. Cheating",
    "",
    "Passage 2",
    "14. North America",
    "15. Overkill model",
    "16. Hunting",
    "17. Deadly disease",
    "18. Empirical evidence",
    "19. Climate instability",
    "20. Communities",
    "21. B",
    "22. C",
    "23. B",
    "24. A",
    "25. B",
    "26. C",
    "",
    "Passage 3",
    "27. iv",
    "28. viii",
    "29. ii",
    "30. iii",
    "31. i",
    "32. vi",
    "33. Weight, position",
    "34. Resonance frequency",
    "35. Three axes",
    "36. Headaches",
    "37. Coriolis illusion",
    "38. NO",
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
  // Guard: Listening matching letter Q28 must stay F, not FALSE
  if (!/^28\.\s*F\s*$/m.test(text)) {
    throw new Error("Listening Q28 must remain letter F");
  }

  const keysMdPath = path.join(ROOT, "public/templates/test-4-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-4-keys.md");
  const key4Path = path.join(SRC, "Key 4.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(text, path.join(ROOT, "public/templates/test-4-keys.docx"));
  await writeMinimalDocx(text, key4Path);

  await archiveIfExists(
    path.join(SRC, "Keys.docx"),
    path.join(SRC, "_old"),
    "Keys.docx",
  );

  // Mirror to absolute IELTS folder
  try {
    await mkdir(ABS, { recursive: true });
    await writeMinimalDocx(text, path.join(ABS, "Key 4.docx"));
    await archiveIfExists(
      path.join(ABS, "Keys.docx"),
      path.join(ABS, "_old"),
      "Keys.docx",
    );
  } catch (e) {
    console.warn("ABS keys mirror:", e);
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 4.docx`);
  return keysMdPath;
}

async function renameAudioInFolder(folder: string) {
  const mapping: [string, string][] = [
    ["P1. Campsite.mp3", "section-1.mp3"],
    ["P2. Arthur.mp3", "section-2.mp3"],
    ["P3. Dolphin.mp3", "section-3.mp3"],
    ["P4. Recycling tyre.mp3", "section-4.mp3"],
  ];
  const oldDir = path.join(folder, "_old");
  await mkdir(oldDir, { recursive: true });

  for (const [oldName, newName] of mapping) {
    const oldPath = path.join(folder, oldName);
    const newPath = path.join(folder, newName);
    try {
      // Copy to canonical name, archive original
      await copyFile(oldPath, newPath);
      await rename(oldPath, path.join(oldDir, oldName));
      console.log(`Audio rename ${oldName} → ${newName} (+ archive)`);
    } catch {
      // Already renamed: ensure section-N exists
      try {
        await readFile(newPath);
        console.log(`Audio already ${newName}`);
      } catch {
        // Maybe only in _old — restore
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
    const destName = `test-4-section-${i}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, `section-${i}.mp3`), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 4.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-4-listening",
    prefix: "test-4-listening-map",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 4.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-4-writing",
    prefix: "test-4-task1-diagram",
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
    // Skip instruction lines, then check article title
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
  }

  // Sample answers
  if (draft.skill !== "WRITING") {
    const sample = [1, 17, 18, 19, 20, 28, 40]
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
  const keysPath = await buildCanonicalKeys();
  const audioUrls = await copyAudio();
  const { listenImgs, writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 4.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-4-listening",
    title: "Test 4 - Listening",
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
    file: path.join(SRC, "Reading 4.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-4-reading",
    title: "Test 4 - Reading",
  });
  stripReadingDoubleHeaders(reading);
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 4.docx"),
    skill: "WRITING",
    slug: "test-4-writing",
    title: "Test 4 - Writing",
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
    "\nDone. Local JSON under data/tests/test-4-{listening,reading,writing}.json",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
