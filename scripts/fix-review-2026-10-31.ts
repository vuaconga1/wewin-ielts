/**
 * Content fixes from the teacher review ("lỗi nha.docx", 2026-10-31):
 * - Test 6 Reading P3: drop the scanned figure numbered 11–14 (the bow chart is rendered as text).
 * - Test 8 Reading P1: the heading list is i–x, not i–xi.
 * - Test 10 Reading P1: "•" alone on a line rendered as empty bullets in the notes.
 * - Writing: drop the "Write about the following topic:" line.
 *
 * Updates Postgres and data/tests/*.json.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/fix-review-2026-10-31.ts --dry-run
 *   npx tsx --env-file=.env scripts/fix-review-2026-10-31.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const DRY_RUN = process.argv.includes("--dry-run");

const WRITE_ABOUT = /^[ \t]*Write about the following topic:?[ \t]*(?:\r?\n)?/gim;

function stripWriteAbout(text: string): string {
  return text.replace(WRITE_ABOUT, "");
}

/** Deep-maps every string inside a JSON value. */
function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]),
    ) as T;
  }
  return value;
}

/** Joins "•" lines with their text, and wrapped continuations ("6 ……", lowercase) onto the bullet. */
function fixTest10Notes(content: string): string {
  const start = content.indexOf("Questions 6-13");
  if (start < 0) return content;
  const nextHeader = content.slice(start + 1).search(/\nQuestions\s+\d/);
  const end = nextHeader < 0 ? content.length : start + 1 + nextHeader;
  const block = content.slice(start, end).replace(/•[ \t]*\r?\n+/g, "• ");
  const out: string[] = [];
  for (const line of block.split("\n")) {
    const prev = out[out.length - 1];
    if (prev?.startsWith("• ") && /^(\d{1,2}\s*\.{3,}|[a-z])/.test(line.trim())) {
      out[out.length - 1] = `${prev.trimEnd()} ${line.trim()}`;
    } else out.push(line);
  }
  return content.slice(0, start) + out.join("\n") + content.slice(end);
}

function fixTest8Headings(content: string): string {
  return content.replace(
    "Write the correct number, i-xi, in boxes 1-8.On your answer sheet.",
    "Write the correct number, i-x, in boxes 1-8 on your answer sheet.",
  );
}

type JsonQuestion = { number: number; content: Record<string, unknown>; mediaUrl?: string | null };
type JsonPart = { order: number; content?: string; meta?: Record<string, unknown> | null; questions: JsonQuestion[] };
type JsonTest = { slug: string; skill: string; parts: JsonPart[] };

const FIGURE_SLUG = "test-6-reading";
const FIGURE_ORDER = 2;
const FIGURE_QUESTIONS = new Set([37, 38, 39, 40]);

function dropFigure<T extends { imageUrl?: unknown; mediaUrl?: unknown }>(obj: T | null | undefined): T | null | undefined {
  if (!obj) return obj;
  const { imageUrl: _i, mediaUrl: _m, ...rest } = obj;
  return rest as T;
}

async function fixDb() {
  let changed = 0;

  const sections = await prisma.testSection.findMany({
    where: {
      OR: [
        { test: { slug: FIGURE_SLUG }, order: FIGURE_ORDER },
        { test: { slug: "test-8-reading" }, order: 0 },
        { test: { slug: "test-10-reading" }, order: 0 },
        { content: { contains: "Write about the following topic", mode: "insensitive" } },
        { questions: { some: { content: { path: ["stem"], string_contains: "Write about the following topic" } } } },
      ],
    },
    select: {
      id: true,
      order: true,
      content: true,
      meta: true,
      test: { select: { slug: true, skill: true } },
      questions: { select: { id: true, number: true, content: true, mediaUrl: true } },
    },
  });

  for (const s of sections) {
    const slug = s.test.slug;
    let content = s.content ?? "";
    let meta = s.meta as Record<string, unknown> | null;
    if (slug === "test-8-reading" && s.order === 0) content = fixTest8Headings(content);
    if (slug === "test-10-reading" && s.order === 0) content = fixTest10Notes(content);
    if (s.test.skill === "WRITING") content = stripWriteAbout(content);
    const figure = slug === FIGURE_SLUG && s.order === FIGURE_ORDER;
    if (figure) meta = dropFigure(meta) ?? null;

    if (content !== (s.content ?? "") || JSON.stringify(meta) !== JSON.stringify(s.meta)) {
      changed++;
      console.log(`section ${slug}#${s.order}`);
      if (!DRY_RUN) {
        await prisma.testSection.update({
          where: { id: s.id },
          data: { content, meta: (meta ?? undefined) as any },
        });
      }
    }

    for (const q of s.questions) {
      let qc = q.content as Record<string, unknown>;
      let mediaUrl = q.mediaUrl;
      if (s.test.skill === "WRITING") qc = mapStrings(qc, stripWriteAbout);
      if (figure && FIGURE_QUESTIONS.has(q.number)) {
        qc = dropFigure(qc)!;
        mediaUrl = null;
      }
      if (JSON.stringify(qc) !== JSON.stringify(q.content) || mediaUrl !== q.mediaUrl) {
        changed++;
        console.log(`  question ${slug} Q${q.number}`);
        if (!DRY_RUN) {
          await prisma.question.update({ where: { id: q.id }, data: { content: qc as object, mediaUrl } });
        }
      }
    }
  }
  console.log(`${DRY_RUN ? "[dry-run] " : ""}DB rows changed: ${changed}`);
}

async function fixJson(slugs: string[]) {
  let files = 0;
  for (const slug of slugs) {
    const file = path.resolve("data/tests", `${slug}.json`);
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch {
      continue;
    }
    const test = JSON.parse(raw) as JsonTest;
    for (const part of test.parts) {
      if (typeof part.content === "string") {
        if (slug === "test-8-reading" && part.order === 0) part.content = fixTest8Headings(part.content);
        if (slug === "test-10-reading" && part.order === 0) part.content = fixTest10Notes(part.content);
        if (test.skill === "WRITING") part.content = stripWriteAbout(part.content);
      }
      const figure = slug === FIGURE_SLUG && part.order === FIGURE_ORDER;
      if (figure) part.meta = dropFigure(part.meta) ?? null;
      for (const q of part.questions) {
        if (test.skill === "WRITING") q.content = mapStrings(q.content, stripWriteAbout);
        if (figure && FIGURE_QUESTIONS.has(q.number)) {
          q.content = dropFigure(q.content)!;
          delete q.mediaUrl;
        }
      }
    }
    const eol = raw.includes("\r\n") ? "\r\n" : "\n";
    let next = JSON.stringify(test, null, 2).replace(/\n/g, eol);
    if (/\r?\n$/.test(raw)) next += eol;
    if (next !== raw) {
      files++;
      if (!DRY_RUN) await writeFile(file, next, "utf8");
    }
  }
  console.log(`${DRY_RUN ? "[dry-run] " : ""}JSON files changed: ${files}`);
}

async function main() {
  await fixDb();
  const writing = await prisma.test.findMany({ where: { skill: "WRITING" }, select: { slug: true } });
  await fixJson([FIGURE_SLUG, "test-8-reading", "test-10-reading", ...writing.map((w) => w.slug)]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
