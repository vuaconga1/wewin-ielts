/**
 * Import Academic papers that are in DE-IELTS/IELTS_COMPLETE_TESTS_FINAL
 * but not yet on the site:
 *   Speaking 7–14, Listening/Writing 12, Listening/Reading/Writing 14.
 *
 * Usage: npx tsx scripts/build-missing-academic.ts
 */
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { extractFileWithMeta, normalizeExtractedText } from "../src/lib/import/docx";
import { extractDocxImagesToUploads } from "../src/lib/import/extract-docx-images";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import type { ParsedTestDraft } from "../src/lib/import/schemas";
import { saveTestDraft } from "../src/lib/store/test-store";

const ROOT = process.cwd();
const PACK = path.join(ROOT, "DE-IELTS", "IELTS_COMPLETE_TESTS_FINAL");

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function student(n: number, skill: string): string {
  return path.join(PACK, `Test_${pad(n)}`, "STUDENT", `Test_${pad(n)}_${skill}.docx`);
}

function teacherKey(n: number): string {
  return path.join(PACK, `Test_${pad(n)}`, "TEACHER", `Test_${pad(n)}_Answer_Key.docx`);
}

async function docxLines(filePath: string): Promise<string[]> {
  const buffer = await readFile(filePath);
  const html = await mammoth.convertToHtml({ buffer });
  const text = html.value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\u0007/g, "\n");
  return text
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitSpeakingParts(lines: string[]): Record<1 | 2 | 3, string[]> {
  const buckets: Record<1 | 2 | 3, string[]> = { 1: [], 2: [], 3: [] };
  let current: 1 | 2 | 3 | null = null;
  for (const line of lines) {
    const hit = line.match(/^PART\s+([123])\b/i);
    if (hit) {
      current = Number(hit[1]) as 1 | 2 | 3;
      continue;
    }
    if (current) buckets[current].push(line);
  }
  return buckets;
}

function topicFrom(lines: string[]): string | undefined {
  const line = lines.find((item) => /^topic\s*:/i.test(item));
  return line?.replace(/^topic\s*:\s*/i, "").trim() || undefined;
}

function questionsEndingWithMark(lines: string[]): string[] {
  return lines
    .filter((line) => {
      if (/^topic\s*:/i.test(line)) return false;
      if (/^part\s+[123]\b/i.test(line)) return false;
      return /\?\s*$/.test(line);
    })
    .map((line) => line.replace(/^[•●▪]\s*/, "").trim());
}

function cueCardStem(lines: string[]): string {
  const body = lines.filter((line) => !/^topic\s*:/i.test(line));
  return body.join("\n").trim();
}

async function buildSpeaking(n: number): Promise<ParsedTestDraft> {
  const lines = await docxLines(student(n, "Speaking"));
  const parts = splitSpeakingParts(lines);
  for (const kind of [1, 2, 3] as const) {
    if (parts[kind].length === 0) {
      throw new Error(`Speaking ${n}: Part ${kind} is empty`);
    }
  }
  const part1 = questionsEndingWithMark(parts[1]);
  const part3 = questionsEndingWithMark(parts[3]);
  const card = cueCardStem(parts[2]);
  if (part1.length < 2) throw new Error(`Speaking ${n}: Part 1 has ${part1.length} questions`);
  if (part3.length < 2) throw new Error(`Speaking ${n}: Part 3 has ${part3.length} questions`);
  if (!/describe/i.test(card) || !/you should say/i.test(card)) {
    throw new Error(`Speaking ${n}: Part 2 cue card is incomplete`);
  }
  const topic1 = topicFrom(parts[1]);
  const topic3 = topicFrom(parts[3]);
  let number = 1;
  const prompt = (
    stem: string,
    speakingPart: 1 | 2 | 3,
    topic?: string,
  ) => {
    const item = {
      number,
      order: number - 1,
      type: "SPEAKING_PROMPT" as const,
      content: {
        stem,
        speakingPart,
        ...(topic ? { topic } : {}),
      },
    };
    number += 1;
    return item;
  };
  const part1Questions = part1.map((stem, order) => {
    const q = prompt(stem, 1, topic1);
    q.order = order;
    return q;
  });
  const cardQuestion = prompt(card, 2);
  cardQuestion.order = 0;
  const part3Questions = part3.map((stem, order) => {
    const q = prompt(stem, 3, topic3);
    q.order = order;
    return q;
  });

  return {
    title: `Speaking Test ${n}`,
    slug: `test-${n}-speaking`,
    skill: "SPEAKING",
    examType: "ACADEMIC",
    timeLimitMinutes: 15,
    tags: ["#IELTS Academic", "#Speaking"],
    sourceFolder: path.dirname(student(n, "Speaking")),
    description: `IELTS Academic Speaking practice set ${n} (Part 1 · Part 2 · Part 3).`,
    parts: [
      { title: "Part 1", order: 0, questions: part1Questions },
      { title: "Part 2", order: 1, questions: [cardQuestion] },
      { title: "Part 3", order: 2, questions: part3Questions },
    ],
  };
}

async function copySectionAudio(n: number): Promise<string[]> {
  const dir = path.join(PACK, `Test_${pad(n)}`, "STUDENT", "AUDIO");
  const outDir = path.join(ROOT, "public", "uploads", "audio");
  await mkdir(outDir, { recursive: true });
  const urls: string[] = [];
  for (let section = 1; section <= 4; section += 1) {
    const src = path.join(dir, `Test_${pad(n)}_Listening_Section_${section}.mp3`);
    const name = `test-${n}-section-${section}.mp3`;
    await copyFile(src, path.join(outDir, name));
    urls.push(`/uploads/audio/${name}`);
  }
  return urls;
}

function attachAudio(draft: ParsedTestDraft, urls: string[]) {
  draft.audioFiles = urls;
  draft.parts.forEach((part, index) => {
    const audioUrl = urls[index];
    if (audioUrl) part.meta = { ...part.meta, audioUrl };
  });
}

function attachListeningFigure(draft: ParsedTestDraft, url: string) {
  const mapPart =
    draft.parts.find((part) =>
      /map|plan|diagram/i.test(`${part.title}\n${part.content ?? ""}`),
    ) ?? draft.parts[1];
  if (!mapPart) throw new Error(`${draft.slug}: no section for the listening figure`);
  mapPart.meta = { ...mapPart.meta, imageUrl: url, mediaUrl: url };
  for (const question of mapPart.questions) {
    question.mediaUrl = url;
    (question.content as Record<string, unknown>).imageUrl = url;
  }
  console.log(`  figure → ${mapPart.title} (${url})`);
}

type Choice = { label: string; text: string };

function setMatching(
  draft: ParsedTestDraft,
  from: number,
  to: number,
  options: Choice[],
) {
  for (const part of draft.parts) {
    for (const question of part.questions) {
      if (question.number < from || question.number > to) continue;
      question.type = "MATCHING";
      const content = question.content as Record<string, unknown>;
      content.options = options;
      content.blank = true;
    }
  }
}

function replaceQuestion(
  draft: ParsedTestDraft,
  number: number,
  question: ParsedTestDraft["parts"][0]["questions"][0],
) {
  for (const part of draft.parts) {
    const numbers = part.questions.map((item) => item.number);
    if (!numbers.length) continue;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    if (number < min - 1 || number > max + 1) continue;
    const index = part.questions.findIndex((item) => item.number === number);
    if (index >= 0) part.questions[index] = question;
    else part.questions.push(question);
    part.questions.sort((a, b) => a.number - b.number);
    part.questions.forEach((item, order) => {
      item.order = order;
    });
    return;
  }
  throw new Error(`${draft.slug}: no part owns question ${number}`);
}

function repairListening(draft: ParsedTestDraft) {
  if (draft.slug === "test-12-listening") {
    setMatching(draft, 16, 20, [
      { label: "A", text: "Victorian Shipyard Workshop" },
      { label: "B", text: "Aquarium Nursery" },
      { label: "C", text: "Audio-Visual Theatre" },
      { label: "D", text: "Navigation Simulator" },
      { label: "E", text: "Seabird Observation Deck" },
      { label: "F", text: "Gift & Book Shop" },
      { label: "G", text: "Lighthouse Lantern Room" },
      { label: "H", text: "Model Boat Basin" },
    ]);
    setMatching(draft, 26, 30, [
      { label: "A", text: "Jack" },
      { label: "B", text: "Chloe" },
      { label: "C", text: "Both Jack and Chloe" },
    ]);
  }
  if (draft.slug !== "test-14-listening") return;

  for (const part of draft.parts) {
    for (const question of part.questions) {
      if (question.number < 16 || question.number > 20) continue;
      question.type = "MAP_LABELING";
      question.content = {
        stem: "",
        blank: true,
        imageUrl: part.meta?.imageUrl,
      };
    }
  }

  const tools: Choice[] = [
    { label: "A", text: "Sandstone block" },
    { label: "B", text: "Plant glue" },
    { label: "C", text: "Stone scoring tool" },
    { label: "D", text: "Bone point" },
    { label: "E", text: "Stick drill" },
  ];
  const comments: Choice[] = [
    { label: "A", text: "People there are friendlier" },
    { label: "B", text: "People there are healthier" },
    { label: "C", text: "It is less crowded" },
    { label: "D", text: "It is more convenient" },
    { label: "E", text: "People there are happier" },
    { label: "F", text: "There are some similarities" },
  ];
  const matching = (
    number: number,
    stem: string,
    options: Choice[],
    answer: string,
  ) =>
    replaceQuestion(draft, number, {
      number,
      order: 0,
      type: "MATCHING",
      content: { stem, options, blank: true },
      correctAnswer: answer,
    });

  replaceQuestion(draft, 25, {
    number: 25,
    order: 0,
    type: "MULTIPLE_CHOICE",
    content: {
      stem: "How can modern reproductions be easily distinguished from genuine Maori carvings?",
      options: [
        { label: "A", text: "The materials differ." },
        { label: "B", text: "They are too regular in shape." },
        { label: "C", text: "They are of different sizes." },
      ],
    },
    correctAnswer: "B",
  });
  matching(26, "creating a blank", tools, "C");
  matching(27, "smoothing the surface", tools, "A");
  matching(28, "carving details", tools, "D");
  matching(29, "making holes", tools, "E");
  matching(30, "fixing coloured decorations", tools, "B");
  matching(37, "Jack Simons", comments, "B");
  matching(38, "Ellen Simpson", comments, "C");
  matching(39, "Robert Gregory", comments, "F");
  matching(40, "Sarah Godfrey", comments, "E");
}

function assertScored(draft: ParsedTestDraft, expectedParts: number, expectedQuestions: number) {
  const count = draft.parts.reduce((sum, part) => sum + part.questions.length, 0);
  const missing = draft.parts.flatMap((part) =>
    part.questions
      .filter((q) => q.correctAnswer === undefined || q.correctAnswer === null || q.correctAnswer === "")
      .map((q) => q.number),
  );
  console.log(
    `  ${draft.slug}: ${draft.parts.length} parts, ${count} questions, missing keys=${missing.length}`,
  );
  for (const part of draft.parts) {
    console.log(`    ${part.title}: ${part.questions.length}q`);
  }
  if (draft.parts.length !== expectedParts) {
    throw new Error(`${draft.slug}: expected ${expectedParts} parts, got ${draft.parts.length}`);
  }
  if (count !== expectedQuestions) {
    throw new Error(`${draft.slug}: expected ${expectedQuestions} questions, got ${count}`);
  }
  if (missing.length) {
    throw new Error(`${draft.slug}: missing answers for ${missing.join(", ")}`);
  }
  const synthetic = draft.parts.flatMap((part) =>
    part.questions
      .filter((q) => (q.content as { synthetic?: boolean }).synthetic)
      .map((q) => q.number),
  );
  if (synthetic.length) {
    throw new Error(`${draft.slug}: synthetic questions ${synthetic.join(", ")}`);
  }
}

async function listeningMarkdown(n: number): Promise<string> {
  const meta = await extractFileWithMeta(student(n, "Listening"), {
    preserveContentTables: true,
  });
  // A pound sign glued to the question number (£10 ……) hides the blank.
  const text = normalizeExtractedText(meta.text)
    .replace(/£(\d{1,2})(\s*[.\u2026]{3,})/g, "$1$2")
    .replace(/Contact\s*\n+\s*phone/gi, "Contact phone")
    .replace(/Tele\s*\n+\s*phone/gi, "Telephone");
  const out = path.join(ROOT, "tmp", `test-${n}-listening.md`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, text, "utf8");
  return out;
}

async function buildListening(n: number) {
  const audio = await copySectionAudio(n);
  const { draft, issues } = await parseTestFromFiles({
    contentPath: await listeningMarkdown(n),
    keysPath: teacherKey(n),
    skill: "LISTENING",
    title: `Test ${n} - Listening`,
    slug: `test-${n}-listening`,
    sourceFolder: path.dirname(student(n, "Listening")),
    examType: "ACADEMIC",
    tags: ["#IELTS Academic", "#Listening"],
    audioFiles: audio,
  });
  for (const issue of issues) {
    console.log(`  [${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (!draft) throw new Error(`Listening ${n} did not parse`);
  attachAudio(draft, audio);
  const buffer = await readFile(student(n, "Listening"));
  const images = await extractDocxImagesToUploads(buffer, {
    slug: `test-${n}-listening`,
    prefix: `test-${n}-listening-map`,
    subdir: "images",
  });
  if (images.length !== 1 && n === 14) {
    throw new Error(`Listening 14 expected 1 map image, got ${images.length}`);
  }
  if (images[0]) attachListeningFigure(draft, images[0]);
  repairListening(draft);
  assertScored(draft, 4, 40);
  await saveTestDraft(draft);
}

async function buildReading(n: number) {
  const { draft, issues } = await parseTestFromFiles({
    contentPath: student(n, "Reading"),
    keysPath: teacherKey(n),
    skill: "READING",
    title: `Test ${n} - Reading`,
    slug: `test-${n}-reading`,
    sourceFolder: path.dirname(student(n, "Reading")),
    examType: "ACADEMIC",
    tags: ["#IELTS Academic", "#Reading"],
  });
  for (const issue of issues) {
    console.log(`  [${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (!draft) throw new Error(`Reading ${n} did not parse`);
  const buffer = await readFile(student(n, "Reading"));
  const images = await extractDocxImagesToUploads(buffer, {
    slug: `test-${n}-reading`,
    subdir: "images",
  });
  if (images.length) {
    throw new Error(`Reading ${n} has ${images.length} images that are not attached yet`);
  }
  assertScored(draft, 3, 40);
  await saveTestDraft(draft);
}

async function buildWriting(n: number) {
  const { draft, issues } = await parseTestFromFiles({
    contentPath: student(n, "Writing"),
    skill: "WRITING",
    title: `Test ${n} - Writing`,
    slug: `test-${n}-writing`,
    sourceFolder: path.dirname(student(n, "Writing")),
    examType: "ACADEMIC",
    tags: ["#IELTS Academic", "#Writing"],
  });
  for (const issue of issues) {
    console.log(`  [${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (!draft) throw new Error(`Writing ${n} did not parse`);
  if (draft.parts.length !== 2) {
    throw new Error(`Writing ${n}: expected 2 tasks, got ${draft.parts.length}`);
  }
  const task1 = draft.parts[0]!;
  const image = task1.meta?.imageUrl ?? task1.questions[0]?.content?.imageUrl;
  if (typeof image !== "string" || !image) {
    throw new Error(`Writing ${n}: Task 1 image is missing`);
  }
  const words1 = (task1.questions[0]?.content as { minWords?: number } | undefined)?.minWords;
  const words2 = (draft.parts[1]?.questions[0]?.content as { minWords?: number } | undefined)?.minWords;
  console.log(`  ${draft.slug}: image=${image} minWords=${words1}/${words2}`);
  if (words1 !== 150 || words2 !== 250) {
    throw new Error(`Writing ${n}: expected 150/250 words, got ${words1}/${words2}`);
  }
  await saveTestDraft(draft);
}

async function main() {
  for (const n of [7, 8, 9, 10, 11, 12, 13, 14]) {
    const draft = await buildSpeaking(n);
    const counts = draft.parts.map((part) => part.questions.length).join("+");
    console.log(`${draft.slug}: ${counts}`);
    await saveTestDraft(draft);
  }
  console.log("--- listening / reading / writing ---");
  await buildListening(12);
  await buildWriting(12);
  await buildListening(14);
  await buildReading(14);
  await buildWriting(14);
  console.log("saved missing academic drafts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
