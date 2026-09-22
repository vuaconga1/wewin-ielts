/**
 * Build Test 2 assets: canonical keys, audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-2.ts
 *
 * Reading = Maps version only (paper archived under IELTS/Test 2/_old/).
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

const SRC = path.join(process.cwd(), "IELTS", "Test 2");
const ROOT = process.cwd();

/**
 * Split keys are typed but unnumbered / multi-column Word tables.
 * Reconstruct Key-9 layout explicitly (Listening 40 + Reading Maps 40).
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. Fordyce",
    "2. 07840051963",
    "3. Nurse",
    "4. Primary",
    "5. South",
    "6. Station",
    "7. Park",
    "8. House",
    "9. 2",
    "10. Office",
    "",
    "Section 2",
    "11. C",
    "12. B",
    "13. A",
    "14. B",
    "15. A",
    "16. B",
    "17. C",
    "18. D",
    "19. C",
    "20. E",
    "",
    "Section 3",
    "21. A",
    "22. A",
    "23. C",
    "24. B",
    "25. A",
    "26. C",
    "27. D",
    "28. G",
    "29. E",
    "30. A",
    "",
    "Section 4",
    "31. Commercial",
    "32. Knowledge",
    "33. Lines",
    "34. Photography",
    "35. Advertise",
    "36. Foot",
    "37. Objects",
    "38. Newspapers",
    "39. Packaging",
    "40. mathematics|math|maths",
  ];

  // Passage 1 unnumbered column + numbered P2/P3 from Reading keys (Maps)
  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. Timetable",
    "2. Surface",
    "3. Accommodation",
    "4. Restaurant",
    "5. Region",
    "6. Numbers",
    "7. TRUE",
    "8. TRUE",
    "9. NOT GIVEN",
    "10. FALSE",
    "11. NOT GIVEN",
    "12. FALSE",
    "13. NOT GIVEN",
    "",
    "Passage 2",
    "14. E",
    "15. I",
    "16. A",
    "17. G",
    "18. C",
    "19. F",
    "20. A",
    "21. E",
    "22. A",
    "23. B",
    "24. Sheltered",
    "25. Penguins",
    "26. Permit",
    "",
    "Passage 3",
    "27. v",
    "28. iv",
    "29. vii",
    "30. ii",
    "31. viii",
    "32. vi",
    "33. iii",
    "34. B",
    "35. A",
    "36. C",
    "37. B",
    "38. Food",
    "39. Children",
    "40. Edible",
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

async function buildCanonicalKeys(): Promise<string> {
  // Write numbered Key-9 text as-authored so matching "F" is not rewritten to FALSE
  // in the Word/md artifacts (merge still adapts via adaptKeyAnswerForQuestionType).
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

  const keysMdPath = path.join(ROOT, "public/templates/test-2-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-2-keys.md");
  const key2Path = path.join(SRC, "Key 2.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(text, path.join(ROOT, "public/templates/test-2-keys.docx"));
  await writeMinimalDocx(text, key2Path);
  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 2.docx`);
  return keysMdPath;
}

async function copyAudio(): Promise<string[]> {
  const audioDir = path.join(ROOT, "public/uploads/audio");
  await mkdir(audioDir, { recursive: true });
  const sources = [
    "section-1.mp3",
    "section-2.mp3",
    "section-3.mp3",
    "section-4.mp3",
  ];
  const urls: string[] = [];
  for (let i = 0; i < sources.length; i++) {
    const destName = `test-2-section-${i + 1}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, sources[i]!), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 2.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-2-listening",
    prefix: "test-2-listening",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 2.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-2-writing",
    prefix: "test-2-task1-diagram",
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

function attachListeningAudio(
  draft: ParsedTestDraft,
  audioUrls: string[],
): void {
  draft.audioFiles = audioUrls;
  for (let i = 0; i < draft.parts.length; i++) {
    const part = draft.parts[i]!;
    const audioUrl = audioUrls[i] ?? audioUrls[0];
    part.meta = { ...part.meta, audioUrl };
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

  // Choose TWO / covers check
  const multi = qs.filter((q) => {
    const c = q.content as { selectCount?: number; covers?: number[]; pairedFrom?: number };
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
        `    Q${q.number} type=${q.type} selectCount=${c.selectCount ?? "-"} covers=${JSON.stringify(c.covers ?? null)} pairedFrom=${c.pairedFrom ?? "-"}`,
      );
    }
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
  const { writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 2.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-2-listening",
    title: "Test 2 - Listening",
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
  attachListeningAudio(listening, audioUrls);
  summarize(listening);
  await saveTestDraft(listening);

  let reading = await importSkill({
    file: path.join(SRC, "Reading 2.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-2-reading",
    title: "Test 2 - Reading",
  });
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 2.docx"),
    skill: "WRITING",
    slug: "test-2-writing",
    title: "Test 2 - Writing",
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

  console.log("\nDone. Local JSON under data/tests/test-2-{listening,reading,writing}.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
