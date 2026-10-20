/**
 * Seed (or refresh) the sample listening exercises:
 * - "Nghe điền từ" (FILL_BLANK) reusing the shadowing sample audio
 * - "Nghe chép chính tả" (FULL_TEXT) Riverside Community Centre
 * Idempotent: updates rows whose slug already exists.
 *
 * Usage:
 *   npx tsx scripts/seed-listening-samples.ts
 *   npm run seed:listening-samples
 */

import "dotenv/config";
import { getDictationRepo, type DictationRepo, type ExerciseData } from "../src/lib/dictation/repo";
import { gapExpected, tokenizeTranscript, validateGaps } from "../src/lib/dictation/fill-blank";
import { DEFAULT_DICTATION_SETTINGS } from "../src/lib/dictation/types";
import { prisma } from "../src/lib/prisma";

const FILL_SLUG = "fill-blank-01-city-library";
const FILL_TRANSCRIPT =
  "Good morning, and welcome to the city library. Today I'd like to tell you about our new opening hours, and a few changes to the way you can borrow books.";
/** Phrase to hide → occurrence in the transcript (token ranges are derived, not hand-counted). */
const GAP_PHRASES = ["city library", "I'd like to", "opening hours", "changes", "borrow books"];

const DICTATION_SLUG = "dictation-01-riverside-community-centre";
const DICTATION_TRANSCRIPT =
  "Good morning, and welcome to the Riverside Community Centre. My name is Sarah, and I will be your guide today. The centre opens at eight thirty every morning and closes at nine in the evening. On the ground floor, you will find the reception desk, a small cafe and the children's library. The swimming pool is on the first floor, and lessons for beginners take place every Tuesday and Thursday. If you would like to join the photography club, please fill in a form at reception. The monthly fee is twelve pounds, and members can borrow cameras for free at weekends.";

function gapsFor(transcript: string) {
  const tokens = tokenizeTranscript(transcript);
  const cores = tokens.map((t) => transcript.slice(t.coreStart, t.coreEnd));
  return GAP_PHRASES.map((phrase, i) => {
    const words = phrase.split(" ");
    const start = cores.findIndex((_, k) => words.every((w, j) => cores[k + j] === w));
    if (start < 0) throw new Error(`Phrase not found in transcript: ${phrase}`);
    return { id: `g${i + 1}`, startToken: start, endToken: start + words.length };
  });
}

async function upsert(repo: DictationRepo, slug: string, data: ExerciseData) {
  const existing = await repo.findExercise({ slug });
  const row = existing
    ? await repo.updateExercise(existing.id, data)
    : await repo.createExercise(slug, data);
  console.log(`[${repo.kind}] ${existing ? "Updated" : "Created"} ${row.slug}`);
}

async function main() {
  const repo = await getDictationRepo();
  if (!repo) throw new Error("No dictation backend (DB unavailable in production mode)");

  const gaps = validateGaps(gapsFor(FILL_TRANSCRIPT), FILL_TRANSCRIPT);
  await upsert(repo, FILL_SLUG, {
    title: "Nghe điền từ 01: Welcome to the city library",
    level: "B1",
    instructions:
      "Nghe thông báo tại thư viện và điền từ hoặc cụm từ còn thiếu vào mỗi ô trống. Có thể nghe lại nhiều lần và giảm tốc độ phát.",
    audioUrl: "/audio/shadowing/sample-city-library.wav",
    transcript: FILL_TRANSCRIPT,
    mode: "FILL_BLANK",
    gaps,
    settings: DEFAULT_DICTATION_SETTINGS,
    status: "PUBLISHED",
    order: 1,
  });
  const tokens = tokenizeTranscript(FILL_TRANSCRIPT);
  gaps.forEach((g, i) => console.log(`  ${i + 1}. ${gapExpected(FILL_TRANSCRIPT, tokens, g)}`));

  await upsert(repo, DICTATION_SLUG, {
    title: "Dictation 01: Riverside Community Centre",
    level: "B1",
    instructions: null,
    audioUrl: "/uploads/audio/dictation/dictation-sample-community-centre.mp3",
    transcript: DICTATION_TRANSCRIPT,
    mode: "FULL_TEXT",
    gaps: null,
    settings: DEFAULT_DICTATION_SETTINGS,
    status: "PUBLISHED",
    order: 1,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));
