// Parse the FLYER "5000 từ vựng IELTS thông dụng" markdown export into flashcard topics.
// Usage: node scripts/extract-flyer-vocab.mjs <path-to-markdown>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SRC = process.argv[2];
if (!SRC) {
  console.error("Usage: node scripts/extract-flyer-vocab.mjs <markdown file>");
  process.exit(1);
}
const OUT = path.join("src", "lib", "learn", "data", "flyer-vocab-topics.json");
const LAST_TOPIC = 33;

function clean(s) {
  return s
    .replace(/\\([.\-*_()[\]|])/g, "$1")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeIpa(s) {
  if (!s) return undefined;
  const v = s.replace(/^\/+|\/+$/g, "").trim();
  return v ? `/${v}/` : undefined;
}

const lines = readFileSync(SRC, "utf8").split(/\r?\n/);
const topics = [];
let current = null;

for (const raw of lines) {
  const heading = raw.match(/^##\s+(\d+)\\?\.\s+(.+?)\s*\((.+)\)\s*$/);
  if (heading) {
    const n = Number(heading[1]);
    current = null;
    if (n >= 1 && n <= LAST_TOPIC) {
      const en = clean(heading[2]);
      const vi = clean(heading[3]);
      current = {
        slug: `flyer-${String(n).padStart(2, "0")}-${slugify(en)}`,
        order: 100 + n,
        title: { vi: en, en },
        summary: { vi, en: `Common IELTS words — ${en}` },
        words: [],
        seen: new Set(),
      };
      topics.push(current);
    }
    continue;
  }
  if (/^##\s/.test(raw)) {
    current = null;
    continue;
  }
  if (!current || !raw.startsWith("|")) continue;

  const cells = raw.split("|").slice(1, -1).map(clean);
  if (cells.length < 3) continue;
  const [word, ipa, meaningVi] = cells;
  if (!word || /^-+$/.test(word) || /^từ vựng$/i.test(word)) continue;
  if (!meaningVi) continue;

  const key = word.toLowerCase();
  if (current.seen.has(key)) continue;
  current.seen.add(key);
  current.words.push({ word, ipa: normalizeIpa(ipa), meaningVi });
}

const out = {
  source: "FLYER — 5000 từ vựng IELTS thông dụng",
  sourceUrl: "https://flyer.vn/5000-tu-vung-ielts-thong-dung/",
  topics: topics.map(({ seen, ...t }) => t),
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
const total = out.topics.reduce((n, t) => n + t.words.length, 0);
console.log(`Wrote ${out.topics.length} topics, ${total} words → ${OUT}`);
for (const t of out.topics) console.log(`  ${t.slug}: ${t.words.length}`);
