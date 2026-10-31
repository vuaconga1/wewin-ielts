/**
 * Import WEWIN "nghe điền từ" lessons (Basic + Intermediate) as FILL_BLANK exercises.
 * The answer-key phrases become the gaps of the complete transcript.
 *
 * Exercises are upserted by slug (wewin-basic-01, wewin-intermediate-01, ...), so re-running is safe.
 *
 * Usage:
 *   npx tsx scripts/import-wewin-fill-blank.ts --dry-run
 *   npx tsx scripts/import-wewin-fill-blank.ts
 */

import "dotenv/config";
import {
  gapExpected,
  normalizeAnswer,
  tokenizeTranscript,
  validateGaps,
  type TranscriptToken,
} from "../src/lib/dictation/fill-blank";
import { getDictationRepo, type ExerciseData } from "../src/lib/dictation/repo";
import { DEFAULT_DICTATION_SETTINGS, type FillBlankGap } from "../src/lib/dictation/types";
import { loadWewinLessons, publishLessonAudio, type WewinLesson } from "./lib/wewin-lessons";

const DRY_RUN = process.argv.includes("--dry-run");
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);
const LEVEL = process.argv.find((a) => a.startsWith("--level="))?.slice("--level=".length).toLowerCase();

/** Levels whose gaps hide one word of the answer-key phrase instead of the whole phrase. */
const SINGLE_WORD_LEVELS = new Set(["Basic"]);

const EXTRA_ACCEPTED_ANSWERS: Record<string, Record<string, string[]>> = {
  "wewin-basic-01": {
    g10: ["glamorous"],
  },
};

/** Function words never chosen as the single hidden word. */
const STOPWORDS = new Set(
  (
    "a an the of to in on at for from with by as and or but so than then that this these those " +
    "i me my we our you your he him his she her it its they them their there what which who " +
    "is are was were be been being am do does did have has had will would can could should must " +
    "very really quite just all any some more most no not up out off about into over"
  ).split(" "),
);

/** Skips tokens glued to the next word in the source text, e.g. `paw..on`. */
const CLEAN_WORD = /^[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*$/u;

/** Picks the most meaningful word of a multi-word answer: the longest non-function word. */
function pickSingleToken(tokens: TranscriptToken[], transcript: string, start: number, end: number): number {
  const word = (i: number) => transcript.slice(tokens[i].coreStart, tokens[i].coreEnd);
  const all = Array.from({ length: end - start }, (_, i) => start + i).filter(
    (i) => tokens[i].coreEnd > tokens[i].coreStart,
  );
  const clean = all.filter((i) => CLEAN_WORD.test(word(i)));
  const range = clean.length ? clean : all;
  const content = range.filter((i) => !STOPWORDS.has(word(i).toLowerCase().replace(/[’']/g, "'")));
  const pool = content.length ? content : range;
  return pool.reduce((best, i) => (word(i).length > word(best).length ? i : best), pool[0]);
}

function buildGaps(lesson: WewinLesson): FillBlankGap[] {
  const { transcript, spans } = lesson;
  const tokens = tokenizeTranscript(transcript);
  let offset = 0;
  const tokenStarts = tokens.map((t) => {
    const s = transcript.indexOf(t.raw, offset);
    offset = s + t.raw.length;
    return s;
  });
  const singleWord = SINGLE_WORD_LEVELS.has(lesson.level);
  const gaps = spans.map((span) => {
    let startToken = tokenStarts.findIndex((s, i) => s + tokens[i].raw.length > span.start);
    let endToken = startToken;
    while (endToken < tokens.length && tokenStarts[endToken] < span.end) endToken++;
    if (singleWord) {
      startToken = pickSingleToken(tokens, transcript, startToken, endToken);
      endToken = startToken + 1;
    }
    const expected = transcript.slice(tokens[startToken].coreStart, tokens[endToken - 1].coreEnd);
    const extra = EXTRA_ACCEPTED_ANSWERS[lesson.slug]?.[span.id] ?? [];
    const baseAccepted =
      singleWord || normalizeAnswer(expected) === normalizeAnswer(span.answer) ? [] : [span.answer];
    const acceptedAnswers = Array.from(new Set([...baseAccepted, ...extra]));
    return acceptedAnswers.length
      ? { id: span.id, startToken, endToken, acceptedAnswers }
      : { id: span.id, startToken, endToken };
  });
  return validateGaps(gaps, transcript);
}

async function main() {
  let lessons = await loadWewinLessons();
  if (SLUG) lessons = lessons.filter((l) => l.slug === SLUG);
  if (LEVEL) lessons = lessons.filter((l) => l.level.toLowerCase() === LEVEL);
  const built = lessons.map((lesson) => ({ lesson, gaps: buildGaps(lesson) }));
  console.log(`Parsed ${built.length} lesson(s).`);

  if (DRY_RUN) {
    for (const { lesson, gaps } of built) {
      console.log(`\n=== ${lesson.slug} — ${lesson.title} (${gaps.length} gaps)`);
      const tokens = tokenizeTranscript(lesson.transcript);
      console.log(
        gaps
          .map((g, i) => `  (${lesson.spans[i].id.slice(1)}) ${lesson.spans[i].answer}  →  [${gapExpected(lesson.transcript, tokens, g)}]`)
          .join("\n"),
      );
    }
    return;
  }

  const repo = await getDictationRepo();
  if (!repo) throw new Error("No dictation backend available (DB / migration missing)");
  console.log(`Backend: ${repo.kind}`);

  for (const { lesson, gaps } of built) {
    const data: ExerciseData = {
      title: lesson.title,
      level: lesson.level,
      instructions: null,
      audioUrl: await publishLessonAudio(lesson),
      transcript: lesson.transcript,
      mode: "FILL_BLANK",
      gaps,
      questions: null,
      settings: DEFAULT_DICTATION_SETTINGS,
      status: "PUBLISHED",
      order: lesson.order,
    };
    const existing = await repo.findExercise({ slug: lesson.slug });
    if (existing) await repo.updateExercise(existing.id, data);
    else await repo.createExercise(lesson.slug, data);
    console.log(`${existing ? "updated" : "created"} ${lesson.slug} (${gaps.length} gaps)`);
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
