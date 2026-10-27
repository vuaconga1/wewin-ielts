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
import { normalizeAnswer, tokenizeTranscript, validateGaps } from "../src/lib/dictation/fill-blank";
import { getDictationRepo, type ExerciseData } from "../src/lib/dictation/repo";
import { DEFAULT_DICTATION_SETTINGS, type FillBlankGap } from "../src/lib/dictation/types";
import { loadWewinLessons, publishLessonAudio, type WewinLesson } from "./lib/wewin-lessons";

const DRY_RUN = process.argv.includes("--dry-run");
const SLUG = process.argv.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);

const EXTRA_ACCEPTED_ANSWERS: Record<string, Record<string, string[]>> = {
  "wewin-basic-01": {
    g10: ["more glamorous", "to be more glamorous", "more glamour", "to be more glamour"],
  },
};

function buildGaps(lesson: WewinLesson): FillBlankGap[] {
  const { transcript, spans } = lesson;
  const tokens = tokenizeTranscript(transcript);
  let offset = 0;
  const tokenStarts = tokens.map((t) => {
    const s = transcript.indexOf(t.raw, offset);
    offset = s + t.raw.length;
    return s;
  });
  const gaps = spans.map((span) => {
    const startToken = tokenStarts.findIndex((s, i) => s + tokens[i].raw.length > span.start);
    let endToken = startToken;
    while (endToken < tokens.length && tokenStarts[endToken] < span.end) endToken++;
    const expected = transcript.slice(tokens[startToken].coreStart, tokens[endToken - 1].coreEnd);
    const extra = EXTRA_ACCEPTED_ANSWERS[lesson.slug]?.[span.id] ?? [];
    const baseAccepted = normalizeAnswer(expected) === normalizeAnswer(span.answer) ? [] : [span.answer];
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
  const built = lessons.map((lesson) => ({ lesson, gaps: buildGaps(lesson) }));
  console.log(`Parsed ${built.length} lesson(s).`);

  if (DRY_RUN) {
    for (const { lesson, gaps } of built) {
      console.log(`\n=== ${lesson.slug} — ${lesson.title} (${gaps.length} gaps)`);
      console.log(lesson.spans.map((s) => `  (${s.id.slice(1)}) ${s.answer}`).join("\n"));
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
