/**
 * Shared loader for the WEWIN Basic / Intermediate listening lessons.
 *
 * Each lesson folder holds audio.mp3, questions.txt (passage with numbered blanks) and
 * answer-key.txt. The blanks are filled from the answer key to rebuild the complete transcript.
 */

import { copyFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = process.cwd();

export const LEVELS = [
  { dir: "WEWIN_Basic_Lessons_01-24", level: "Basic", key: "basic", orderBase: 0 },
  { dir: "WEWIN_Intermediate_Lessons", level: "Intermediate", key: "intermediate", orderBase: 100 },
] as const;

/** Typos in the scraped answer keys (the audio says the corrected words). */
const ANSWER_FIXES: Record<string, string> = {
  "Some dairy prducts": "Some dairy products",
  "bondong time": "bonding time",
  "Pick up tennis": "Pick up tennis balls",
  "Teaches my loyalty": "Teaches me loyalty",
};

/** Words that keep their capital letter when the blank sits mid-sentence. */
const PROPER_START = /^(I|I['’]m|I['’]d|Germany|Thursday|English|TV|O['’]clock|June|Bollywood|Hollywood|Facebook)\b/;

const BLANK = /\((\d+)\)\s*[….]{2,}(?:\s+…{2,})*/g;
const HEADING = /^(?:(?:lesson|lession)\s*\d+\s*[:.\-–]|\d+\s+(?=[A-Za-z]))\s*(.+)$/i;
/** "A:", "Man:", "Sales Associate:", "Young Man:" at the start of a line. */
const SPEAKER = /^([A-Z][A-Za-z.'’]*(?: [A-Z][A-Za-z.'’]*){0,2}):\s+/;

export type AnswerSpan = { id: string; start: number; end: number; answer: string };

export type WewinLesson = {
  /** Folder key shared by every game: wewin-basic-01, wewin-intermediate-24, ... */
  slug: string;
  num: number;
  title: string;
  level: string;
  order: number;
  dir: string;
  audioFile: string;
  /** Complete transcript, speaker labels and line breaks kept. */
  transcript: string;
  /** Character ranges of the answer-key phrases inside `transcript`. */
  spans: AnswerSpan[];
  /** Spoken words only: no speaker labels, brackets or line breaks. */
  plainTranscript: string;
  /** True when the passage is a conversation with speaker labels. */
  dialogue: boolean;
};

function parseAnswerKey(text: string): Map<number, string> {
  const out = new Map<number, string>();
  const parts = text.split(/\((\d+)\)/);
  for (let i = 1; i < parts.length; i += 2) {
    let answer = parts[i + 1].replace(/\s+/g, " ").trim();
    answer = ANSWER_FIXES[answer] ?? answer;
    out.set(Number(parts[i]), answer);
  }
  return out;
}

/** Drops the site header / blurb lines up to the "Lesson N: Topic" line; returns topic + passage. */
function splitQuestions(text: string): { topic: string; body: string } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const at = lines.findIndex((l) => HEADING.test(l.trim()));
  if (at < 0) throw new Error("lesson heading not found");
  const topic = HEADING.exec(lines[at].trim())![1].trim();
  return { topic, body: lines.slice(at + 1).join("\n") };
}

function cleanBody(body: string): string {
  return body
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").trim().replace(/^[,;]\s*/, ""))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/\n+(?=[a-z])/g, " ")
    .trim();
}

function fitAnswer(answer: string, before: string, after: string): string {
  let a = answer;
  if (/^[.,!?;:]/.test(after.trimStart())) a = a.replace(/[.,!?;:]+$/, "");
  else if (!/[.!?]$/.test(a) && /^(\s*\n|\s*$|\s*(?!(?:I|Olympics|Mother)\b)[A-Z])/.test(after)) a += ".";
  const prev = before.replace(/\s+$/, "").slice(-1);
  const sentenceStart = prev === "" || /[.!?:"“\n]/.test(prev);
  if (!sentenceStart && !PROPER_START.test(a)) a = a.charAt(0).toLowerCase() + a.slice(1);
  return a;
}

/** Replaces every numbered blank by its answer and records where each answer sits. */
function fillBlanks(body: string, answers: Map<number, string>) {
  const text = cleanBody(body);
  const blanks = [...text.matchAll(BLANK)];
  const numbers = blanks.map((m) => Number(m[1]));
  const expected = [...answers.keys()].sort((a, b) => a - b);
  if (numbers.join(",") !== expected.join(",")) {
    throw new Error(`blanks [${numbers}] do not match answer key [${expected}]`);
  }
  let transcript = "";
  let cursor = 0;
  const spans: AnswerSpan[] = [];
  for (const m of blanks) {
    const idx = m.index ?? 0;
    transcript += text.slice(cursor, idx);
    const after = text.slice(idx + m[0].length);
    const answer = fitAnswer(answers.get(Number(m[1]))!, transcript, after);
    if (transcript && !/\s$/.test(transcript)) transcript += " ";
    const start = transcript.length;
    transcript += answer;
    spans.push({ id: `g${m[1]}`, start, end: transcript.length, answer });
    if (after && /^[\p{L}\p{N}]/u.test(after)) transcript += " ";
    cursor = idx + m[0].length;
  }
  transcript += text.slice(cursor);
  if (/…{2,}|\.{4,}|\(\d+\)/.test(transcript)) throw new Error("leftover blank markers in transcript");
  return { transcript, spans };
}

/** Removes speaker labels and bracketed asides' brackets, then joins everything into one paragraph. */
export function toPlainTranscript(transcript: string): { text: string; dialogue: boolean } {
  let dialogue = false;
  const lines = transcript.split("\n").map((line) => {
    const m = SPEAKER.exec(line);
    if (!m) return line;
    dialogue = true;
    return line.slice(m[0].length);
  });
  const text = lines
    .join(" ")
    .replace(/[[\]]/g, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return { text, dialogue };
}

export async function loadWewinLessons(
  onError: (label: string, err: unknown) => void = (label, err) =>
    console.error(`✗ ${label}: ${err instanceof Error ? err.message : err}`),
): Promise<WewinLesson[]> {
  const lessons: WewinLesson[] = [];
  for (const lvl of LEVELS) {
    const base = path.join(ROOT, lvl.dir);
    const dirs = (await readdir(base, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && /^Lesson-\d+$/.test(d.name))
      .map((d) => d.name)
      .sort();
    for (const name of dirs) {
      const num = Number(name.split("-")[1]);
      const dir = path.join(base, name);
      try {
        const [questions, key] = await Promise.all([
          readFile(path.join(dir, "questions.txt"), "utf8"),
          readFile(path.join(dir, "answer-key.txt"), "utf8"),
        ]);
        await stat(path.join(dir, "audio.mp3"));
        const { topic, body } = splitQuestions(questions);
        const { transcript, spans } = fillBlanks(body, parseAnswerKey(key));
        const plain = toPlainTranscript(transcript);
        const nn = String(num).padStart(2, "0");
        lessons.push({
          slug: `wewin-${lvl.key}-${nn}`,
          num,
          title: `${lvl.level} ${nn}: ${topic}`,
          level: lvl.level,
          order: lvl.orderBase + num,
          dir,
          audioFile: path.join(dir, "audio.mp3"),
          transcript,
          spans,
          plainTranscript: plain.text,
          dialogue: plain.dialogue,
        });
      } catch (err) {
        onError(`${lvl.level} ${name}`, err);
      }
    }
  }
  return lessons;
}

const MPEG1_BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const MPEG2_BITRATES = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
const MPEG1_RATES = [44100, 48000, 32000];

/** Duration in seconds of an MPEG Layer III file (Xing/Info frame count, else CBR estimate). */
export async function mp3DurationSeconds(file: string): Promise<number> {
  const buf = await readFile(file);
  let o = 0;
  if (buf.toString("latin1", 0, 3) === "ID3") {
    o = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  }
  while (o < buf.length - 4 && !(buf[o] === 0xff && (buf[o + 1] & 0xe0) === 0xe0)) o++;
  const version = (buf[o + 1] >> 3) & 3;
  const mpeg1 = version === 3;
  const bitrate = (mpeg1 ? MPEG1_BITRATES : MPEG2_BITRATES)[buf[o + 2] >> 4] * 1000;
  const baseRate = MPEG1_RATES[(buf[o + 2] >> 2) & 3];
  const sampleRate = mpeg1 ? baseRate : version === 2 ? baseRate / 2 : baseRate / 4;
  const xing = [buf.indexOf("Xing", o), buf.indexOf("Info", o)].find((i) => i > 0 && i < o + 64);
  if (xing && buf.readUInt32BE(xing + 4) & 1) {
    return (buf.readUInt32BE(xing + 8) * (mpeg1 ? 1152 : 576)) / sampleRate;
  }
  return ((buf.length - o) * 8) / bitrate;
}

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

let r2: ReturnType<typeof r2Client> | undefined;

/**
 * Copies the lesson audio to public/uploads/audio/dictation/<slug>.mp3 and uploads it to R2
 * when configured. Every game shares this one file. Returns the stored `/uploads/...` path.
 */
export async function publishLessonAudio(lesson: WewinLesson): Promise<string> {
  if (r2 === undefined) r2 = r2Client();
  const key = `uploads/audio/dictation/${lesson.slug}.mp3`;
  const localPath = path.join(ROOT, "public", ...key.split("/"));
  await mkdir(path.dirname(localPath), { recursive: true });
  await copyFile(lesson.audioFile, localPath);
  if (r2) {
    const { client, bucket } = r2;
    const exists = await client
      .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      const body = await readFile(lesson.audioFile);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: "audio/mpeg",
          ContentLength: body.length,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
    }
  }
  return `/${key}`;
}
