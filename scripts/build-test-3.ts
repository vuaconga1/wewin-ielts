/**
 * Build Test 3 assets: canonical keys, audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-3.ts
 *
 * Keys source is typed but two-column / alternating-number layout; auto
 * normalizeKeysToCanonical mis-assigns Reading→Listening — write Key-9
 * text explicitly (same approach as Test 2).
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

const SRC = path.join(process.cwd(), "IELTS", "Test 3");
const ROOT = process.cwd();

/**
 * From `Reading + Listening 3 keys_.docx` (typed text).
 * Keep matching letter F as F (not FALSE). Prefer WEWIN key over OE alt.
 */
function buildManualCanonicalKeysText(): string {
  const listening = [
    "Listening",
    "",
    "Section 1",
    "1. fifth",
    "2. view",
    "3. 35",
    "4. Saturday",
    "5. Limerick",
    "6. business",
    "7. garden",
    "8. week",
    "9. 65",
    "10. 44298611",
    "",
    "Section 2",
    "11. B",
    "12. E",
    "13. F",
    "14. I",
    "15. C",
    "16. A",
    "17. A",
    "18. B",
    "19. A",
    "20. A",
    "",
    "Section 3",
    "21. A",
    "22. B",
    "23. A",
    "24. C",
    "25. B",
    "26. C",
    "27. B",
    "28. E",
    "29. A",
    "30. D",
    "",
    "Section 4",
    "31. breathing",
    "32. common",
    "33. face",
    "34. tears",
    "35. fire",
    "36. relatives",
    "37. number",
    "38. contrast",
    "39. time",
    "40. pilots",
  ];

  const reading = [
    "Reading",
    "",
    "Passage 1",
    "1. iii",
    "2. v",
    "3. i",
    "4. vi",
    "5. A",
    "6. B",
    "7. B",
    "8. C",
    "9. C",
    "10. A",
    "11. B",
    "12. A",
    "13. D",
    "",
    "Passage 2",
    "14. B",
    "15. G",
    "16. A",
    "17. H",
    "18. D",
    "19. C",
    "20. C",
    "21. TRUE",
    "22. FALSE",
    "23. FALSE",
    "24. TRUE",
    "25. NOT GIVEN",
    "26. FALSE",
    "",
    "Passage 3",
    "27. C",
    "28. F",
    "29. A",
    "30. E",
    "31. B",
    "32. D",
    "33. flames",
    "34. inscribed",
    "35. light",
    "36. carbon",
    "37. cheaper",
    "38. weather condition / severe weather",
    "39. orange flame",
    "40. Pilot light",
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
  // Guard: Passage 3 Q28 must stay matching letter F, not FALSE
  if (!/^28\.\s*F\s*$/m.test(text) || !/^28\.\s*F\s*$/m.test(check.text)) {
    console.warn(
      "Note: normalize may rewrite Reading Q28 F→FALSE; using authored text for artifacts",
    );
  }

  const keysMdPath = path.join(ROOT, "public/templates/test-3-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-3-keys.md");
  const key3Path = path.join(SRC, "Key 3.docx");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await writeFile(keysMdPath, text + "\n", "utf8");
  await writeFile(keysDataPath, text + "\n", "utf8");
  await writeMinimalDocx(text, path.join(ROOT, "public/templates/test-3-keys.docx"));
  await writeMinimalDocx(text, key3Path);

  // Archive combined keys filename
  const oldKeys = path.join(SRC, "Reading + Listening 3 keys_.docx");
  const oldDir = path.join(SRC, "_old");
  await mkdir(oldDir, { recursive: true });
  try {
    await rename(oldKeys, path.join(oldDir, "Reading + Listening 3 keys_.docx"));
    console.log("Archived Reading + Listening 3 keys_.docx → _old/");
  } catch {
    /* already archived */
  }

  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, Key 3.docx`);
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
    const destName = `test-3-section-${i + 1}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, sources[i]!), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 3.docx"));
  const listenImgs = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-3-listening",
    prefix: "test-3-listening-map",
    subdir: "images",
  });
  console.log("Listening images:", listenImgs);

  const writeBuf = await readFile(path.join(SRC, "Writing 3.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-3-writing",
    prefix: "test-3-task1-diagram",
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
  const { listenImgs, writeUrls } = await extractMedia();

  let listening = await importSkill({
    file: path.join(SRC, "Listening 3.docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-3-listening",
    title: "Test 3 - Listening",
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
    file: path.join(SRC, "Reading 3.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-3-reading",
    title: "Test 3 - Reading",
  });
  summarize(reading);
  await saveTestDraft(reading);

  let writing = await importSkill({
    file: path.join(SRC, "Writing 3.docx"),
    skill: "WRITING",
    slug: "test-3-writing",
    title: "Test 3 - Writing",
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

  // Mirror Key 3.docx to absolute IELTS folder if different
  const absKey = "E:/Wewin/IELTS/Test 3/Key 3.docx";
  try {
    await copyFile(path.join(SRC, "Key 3.docx"), absKey);
    const absOld = "E:/Wewin/IELTS/Test 3/_old/Reading + Listening 3 keys_.docx";
    try {
      await rename(
        "E:/Wewin/IELTS/Test 3/Reading + Listening 3 keys_.docx",
        absOld,
      );
    } catch {
      /* ok */
    }
  } catch {
    /* same folder or missing */
  }

  console.log(
    "\nDone. Local JSON under data/tests/test-3-{listening,reading,writing}.json",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
