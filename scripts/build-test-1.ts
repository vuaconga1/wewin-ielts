/**
 * Build Test 1 assets: canonical keys, audio, images, JSON drafts.
 *
 * Usage: npx tsx scripts/build-test-1.ts
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { extractDocxWithMeta } from "../src/lib/import/docx";
import {
  normalizeKeysToCanonical,
  parseKeysCanonical,
} from "../src/lib/import/normalize-keys";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import { extractDocxImagesToUploads } from "../src/lib/import/extract-docx-images";
import { stripFilledListeningAnswers } from "../src/lib/import/strip-filled-answers";
import { mergeKeysIntoQuestions } from "../src/lib/import/parse-keys";
import { saveTestDraft } from "../src/lib/store/test-store";
import type { ParsedTestDraft } from "../src/lib/import/schemas";

const SRC = "E:/Wewin/IELTS/Test 1";
const ROOT = process.cwd();

async function buildCanonicalKeys(): Promise<string> {
  const listenBuf = await readFile(path.join(SRC, "Listening Test Keys.docx"));
  const readBuf = await readFile(path.join(SRC, "Reading keys.docx"));
  const listenMeta = await extractDocxWithMeta(listenBuf, { includeTables: true });
  const readMeta = await extractDocxWithMeta(readBuf, { includeTables: true });

  const mergedRaw = ["Listening", "", listenMeta.text, "", "Reading", "", readMeta.text].join(
    "\n",
  );
  const canonical = normalizeKeysToCanonical(mergedRaw);
  console.log(
    `Keys: listening=${canonical.listeningCount} reading=${canonical.readingCount} rewritten=${canonical.rewritten}`,
  );

  const keysMdPath = path.join(ROOT, "public/templates/test-1-keys.md");
  const keysDataPath = path.join(ROOT, "data/keys/test-1-keys.md");
  await mkdir(path.dirname(keysDataPath), { recursive: true });
  await writeFile(keysMdPath, canonical.text + "\n", "utf8");
  await writeFile(keysDataPath, canonical.text + "\n", "utf8");

  // Minimal .docx (text only) so admin can download a Word keys file
  const docxPath = path.join(ROOT, "public/templates/test-1-keys.docx");
  await writeMinimalDocx(canonical.text, docxPath);
  console.log(`Wrote keys → ${keysMdPath}, ${keysDataPath}, ${docxPath}`);
  return keysMdPath;
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

async function copyAudio(): Promise<string[]> {
  const audioDir = path.join(ROOT, "public/uploads/audio");
  await mkdir(audioDir, { recursive: true });
  const sources = [
    "AudioTrack 01 (4).mp3",
    "AudioTrack 02 (4).mp3",
    "AudioTrack 03 (4).mp3",
    "AudioTrack 04 (4).mp3",
  ];
  const urls: string[] = [];
  for (let i = 0; i < sources.length; i++) {
    const destName = `test-1-section-${i + 1}.mp3`;
    const dest = path.join(audioDir, destName);
    await copyFile(path.join(SRC, sources[i]!), dest);
    urls.push(`/uploads/audio/${destName}`);
    console.log(`Audio → ${destName}`);
  }
  return urls;
}

async function extractMedia() {
  const listenBuf = await readFile(path.join(SRC, "Listening 1 .docx"));
  const mapUrls = await extractDocxImagesToUploads(listenBuf, {
    slug: "test-1-listening",
    prefix: "test-1-listening-map",
    subdir: "images",
  });
  console.log("Listening map images:", mapUrls);

  const writeBuf = await readFile(path.join(SRC, "Writing 1.docx"));
  const writeUrls = await extractDocxImagesToUploads(writeBuf, {
    slug: "test-1-writing",
    prefix: "test-1-task1-diagram",
    subdir: "writing",
  });
  console.log("Writing images:", writeUrls);
  return { mapUrls, writeUrls };
}

const FOREIGN_STEMS: Record<number, RegExp> = {
  36: /mapmaking|map.?making/i,
  37: /satellite\s+mapping/i,
};

function repairListeningSection2Mcq(draft: ParsedTestDraft): void {
  const part = draft.parts.find((p) => /section\s*2/i.test(p.title));
  if (!part) return;

  const mcqs: Array<{
    number: number;
    stem: string;
    options: { label: string; text: string }[];
  }> = [
    {
      number: 11,
      stem: "What do participants need to take to the registration desk?",
      options: [
        { label: "A", text: "a form of identification (I.D)" },
        { label: "B", text: "a competitor number" },
        { label: "C", text: "cash for the entrance fee" },
      ],
    },
    {
      number: 12,
      stem: "What does the entrance fee to the competition include?",
      options: [
        { label: "A", text: "equipment for fishing" },
        { label: "B", text: "all food for both days" },
        { label: "C", text: "fuel for the fishing" },
      ],
    },
    {
      number: 13,
      stem: "Participants without a fishing license are recommended to apply for one",
      options: [
        { label: "A", text: "at the registration desk." },
        { label: "B", text: "over the phone." },
        { label: "C", text: "on the internet." },
      ],
    },
    {
      number: 14,
      stem: "What will happen at 6pm on Sunday?",
      options: [
        { label: "A", text: "The time allocated for fishing will end." },
        { label: "B", text: "The fish caught will be judged." },
        { label: "C", text: "The prizes will be awarded to the winners." },
      ],
    },
  ];

  const byNum = new Map(part.questions.map((q) => [q.number, q]));
  for (const m of mcqs) {
    const existing = byNum.get(m.number);
    const answer = existing?.correctAnswer;
    byNum.set(m.number, {
      number: m.number,
      order: m.number - 1,
      type: "MULTIPLE_CHOICE",
      content: { stem: m.stem, options: m.options },
      ...(answer !== undefined ? { correctAnswer: answer } : {}),
      ...(existing?.acceptableAnswers
        ? { acceptableAnswers: existing.acceptableAnswers }
        : {}),
    });
  }
  // Keep map Q15-20 and any others
  for (const q of part.questions) {
    if (q.number >= 15 && q.number <= 20) byNum.set(q.number, q);
  }
  part.questions = [...byNum.values()].sort((a, b) => a.number - b.number);
  part.questions.forEach((q, i) => {
    q.order = i;
  });
  console.log("Repaired Listening Section 2 MCQ Q11-14 from Word source");
}

function repairListeningSection3Mcq(draft: ParsedTestDraft): void {
  const part = draft.parts.find((p) => /section\s*3/i.test(p.title));
  if (!part) return;
  const q21 = part.questions.find((q) => q.number === 21);
  if (!q21) return;
  const stem = String((q21.content as { stem?: string }).stem ?? "");
  if (stem.length < 80 && (q21.content as { options?: unknown[] }).options?.length === 3) {
    return;
  }
  // First MCQ often flattened in Word — restore from source
  q21.type = "MULTIPLE_CHOICE";
  q21.content = {
    stem: "Max and Abby agree that in the art exhibition they are looking forward to",
    options: [
      { label: "A", text: "showing people their work." },
      { label: "B", text: "getting feedback from their tutor." },
      { label: "C", text: "talking to other students about their displays." },
    ],
  };
  console.log("Repaired Listening Section 3 Q21 stem/options");
}

function cleanListeningNotes(draft: ParsedTestDraft): void {
  for (const part of draft.parts) {
    if (!part.content) continue;
    // Remove leftover answer text glued after dots (second pass)
    const cleaned = stripFilledListeningAnswers(part.content);
    part.content = cleaned.text
      // Trailing dots residue after strip
      .replace(/(\d{1,2}\s*(?:[$£€]\s*)?\.{3,})\.{2,}/g, "$1")
      .replace(/\.{6,}/g, "........");
  }
}

function fixReadingQ36_37(draft: ParsedTestDraft): void {
  const recovered: Record<number, string> = {
    36: "the fundamental aims of mapmaking remain unchanged.",
    37: "the possibilities of satellite mapping are infinite.",
  };
  for (const part of draft.parts) {
    for (const q of part.questions) {
      if (q.number !== 36 && q.number !== 37) continue;
      const stem = String((q.content as { stem?: string }).stem ?? "");
      const full = recovered[q.number]!;
      const looksForeign =
        FOREIGN_STEMS[q.number]?.test(stem) ||
        FOREIGN_STEMS[q.number]?.test(full) ||
        /satel/i.test(stem);
      if (looksForeign) {
        (q.content as Record<string, unknown>).stem =
          `[Source stem looks copy-pasted from another passage — original Word text kept for recovery] ${full}`;
        (q.content as Record<string, unknown>).notesFlag = "FOREIGN_STEM";
        console.log(`Flagged Reading Q${q.number} foreign stem`);
      }
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
    if (mapUrl && /section\s*2/i.test(part.title)) {
      part.meta = { ...part.meta, imageUrl: mapUrl, mediaUrl: mapUrl };
      for (const q of part.questions) {
        if (q.type === "MAP_LABELING" || (q.number >= 15 && q.number <= 20)) {
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
  for (const issue of issues.slice(0, 40)) {
    console.log(`[${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (issues.length > 40) console.log(`... +${issues.length - 40} more`);
  if (!draft) throw new Error(`Parse failed for ${opts.slug}`);
  return draft;
}

async function main() {
  const keysPath = await buildCanonicalKeys();
  const audioUrls = await copyAudio();
  const { mapUrls, writeUrls } = await extractMedia();

  // Listening
  let listening = await importSkill({
    file: path.join(SRC, "Listening 1 .docx"),
    keys: keysPath,
    skill: "LISTENING",
    slug: "test-1-listening",
    title: "Test 1 - Listening",
    audioFiles: audioUrls,
  });
  repairListeningSection2Mcq(listening);
  repairListeningSection3Mcq(listening);
  cleanListeningNotes(listening);
  // Re-merge keys after MCQ repair (answers may have been on replaced rows)
  {
    const keysText = await readFile(keysPath, "utf8");
    const { map } = parseKeysCanonical(keysText, { skill: "LISTENING" });
    for (const part of listening.parts) {
      part.questions = mergeKeysIntoQuestions(part.questions, map);
    }
  }
  attachListeningAudioAndMap(listening, audioUrls, mapUrls[0]);
  summarize(listening);
  await saveTestDraft(listening);

  // Reading
  let reading = await importSkill({
    file: path.join(SRC, "Reading.docx"),
    keys: keysPath,
    skill: "READING",
    slug: "test-1-reading",
    title: "Test 1 - Reading",
  });
  fixReadingQ36_37(reading);
  summarize(reading);
  await saveTestDraft(reading);

  // Writing
  let writing = await importSkill({
    file: path.join(SRC, "Writing 1.docx"),
    skill: "WRITING",
    slug: "test-1-writing",
    title: "Test 1 - Writing",
  });
  // Ensure diagram URL even if pipeline order differs
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

  console.log("\nDone. Local JSON under data/tests/test-1-*.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
