/**
 * Download the 24 WEWIN Basic dictation lessons into one folder per lesson.
 * Each lesson contains: audio.mp3, questions.txt, and answer-key.txt.
 */
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("WEWIN_Basic_Lessons_01-24");
const baseUrl = "https://wewin.edu.vn/luyen-nghe-chep-chinh-ta-level-basic-lession-";
const headers = { "user-agent": "Mozilla/5.0 (compatible; WEWINLessonDownloader/1.0)" };

function decodeHtml(value) {
  const named = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" };
  return value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, entity) => String.fromCodePoint(entity[0].toLowerCase() === "x" ? parseInt(entity.slice(1), 16) : Number(entity)))
    .replace(/&([a-z]+);/gi, (_, entity) => named[entity.toLowerCase()] ?? `&${entity};`);
}

function htmlToText(html) {
  return decodeHtml(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function lessonContent(page) {
  const articleStart = page.search(/<article\b/i);
  const articleEnd = page.search(/<\/article\s*>/i);
  const article = articleStart >= 0 && articleEnd > articleStart ? page.slice(articleStart, articleEnd) : page;
  const contentStart = article.search(/<div\b[^>]*\bclass=(['"])[^'"]*\bentry-content\b[^'"]*\1[^>]*>/i);
  const content = contentStart >= 0 ? article.slice(contentStart) : article;
  const noMedia = content
    .replace(/<audio\b[\s\S]*?<\/audio\s*>/gi, "")
    .replace(/<(?:script|style|noscript|iframe)\b[\s\S]*?<\/(?:script|style|noscript|iframe)\s*>/gi, "");
  const text = htmlToText(noMedia);
  const marker = /\banswer\s*key\b/i.exec(text);
  if (!marker) throw new Error("Không tìm thấy phần Answer Key");
  const questions = text.slice(0, marker.index).trim();
  const answerText = text.slice(marker.index).replace(/^answer\s*key\s*/i, "").trim();
  // The WordPress template appends its footer inside the article. Answer rows
  // start with a question number, whereas the following footer does not.
  const answers = answerText
    .split("\n")
    .filter(line => /^\s*\(\d+\)/.test(line))
    .join("\n")
    .trim();
  if (!questions || !answers) throw new Error("Nội dung câu hỏi hoặc đáp án trống");
  return { questions, answers };
}

function audioUrl(page) {
  const source = /<source\b[^>]*\bsrc=(['"])([^'"]+?\.mp3(?:\?[^'"]*)?)\1/i.exec(page);
  const anyMp3 = /https?:[^'"\s<>]+?\.mp3(?:\?[^'"\s<>]*)?/i.exec(page);
  const value = source?.[2] ?? anyMp3?.[0];
  if (!value) throw new Error("Không tìm thấy liên kết MP3");
  return value.replace(/&amp;/g, "&");
}

async function fetchWithRetry(url, binary = false) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return binary ? Buffer.from(await response.arrayBuffer()) : await response.text();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function main() {
  await mkdir(root, { recursive: true });
  const results = [];
  for (let lesson = 1; lesson <= 24; lesson++) {
    const number = String(lesson).padStart(2, "0");
    const folder = path.join(root, `Lesson-${number}`);
    const pageUrl = `${baseUrl}${lesson}/`;
    try {
      const page = await fetchWithRetry(pageUrl);
      const { questions, answers } = lessonContent(page);
      const mp3 = await fetchWithRetry(audioUrl(page), true);
      if (mp3.length < 1024) throw new Error("Audio tải về nhỏ bất thường");
      await mkdir(folder, { recursive: true });
      await writeFile(path.join(folder, "audio.mp3"), mp3);
      await writeFile(path.join(folder, "questions.txt"), `${questions}\n`, "utf8");
      await writeFile(path.join(folder, "answer-key.txt"), `${answers}\n`, "utf8");
      results.push({ lesson, status: "OK", bytes: mp3.length, pageUrl });
      console.log(`[OK] Lesson ${number}: ${mp3.length.toLocaleString()} bytes`);
    } catch (error) {
      await rm(folder, { recursive: true, force: true });
      results.push({ lesson, status: "FAILED", error: String(error.message ?? error), pageUrl });
      console.error(`[FAILED] Lesson ${number}: ${error.message ?? error}`);
    }
  }
  const complete = results.filter(item => item.status === "OK");
  const manifest = [
    "WEWIN Basic Dictation — Lessons 01–24",
    `Created: ${new Date().toISOString()}`,
    `Completed: ${complete.length}/24 lessons`,
    "",
    ...results.map(item => item.status === "OK"
      ? `Lesson ${String(item.lesson).padStart(2, "0")}: OK — ${item.bytes} bytes — ${item.pageUrl}`
      : `Lesson ${String(item.lesson).padStart(2, "0")}: FAILED — ${item.error} — ${item.pageUrl}`),
    "",
    "Each completed lesson has audio.mp3, questions.txt, and answer-key.txt.",
  ].join("\n");
  await writeFile(path.join(root, "README.txt"), manifest, "utf8");
  console.log(`\nHoàn tất: ${complete.length}/24 lessons — ${root}`);
  if (complete.length !== 24) process.exitCode = 1;
}

await main();
