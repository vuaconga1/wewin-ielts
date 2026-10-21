/**
 * Import the WEWIN Basic / Intermediate lessons into the other listening games:
 *   - dictation  (FULL_TEXT, slug <lesson>-dictation): spoken words only, no speaker labels
 *   - qa         (QUESTION_ANSWER, slug <lesson>-qa): questions from listen-questions.json
 *   - shadowing  (slug <lesson>): spoken words only, graded with speech-tolerant matching
 *
 * Every game reuses the audio uploaded for the fill-blank import. Upserts by slug.
 *
 * Usage:
 *   npx tsx scripts/import-wewin-listening-games.ts --dry-run
 *   npx tsx scripts/import-wewin-listening-games.ts [--only=dictation,qa,shadowing]
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateQuestions } from "../src/lib/dictation/listen-answer";
import { getDictationRepo, type ExerciseData } from "../src/lib/dictation/repo";
import { DEFAULT_DICTATION_SETTINGS, type ListenQuestion } from "../src/lib/dictation/types";
import { getShadowingRepo } from "../src/lib/shadowing/repo";
import { MAX_RECORD_SECONDS } from "../src/lib/shadowing/types";
import {
  loadWewinLessons,
  mp3DurationSeconds,
  publishLessonAudio,
  type WewinLesson,
} from "./lib/wewin-lessons";

const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length)
  .split(/[,\s]+/);
const wants = (game: string) => !ONLY || ONLY.includes(game);

const DICTATION_DIALOGUE_INSTRUCTIONS =
  "Nghe và chép lại toàn bộ đoạn hội thoại. Không cần ghi tên người nói (A:, B:, Man:, Woman:…) và không cần xuống dòng khi đổi người nói.";

const SHADOWING_INSTRUCTIONS =
  "Nghe audio mẫu, sau đó ghi âm và đọc lại toàn bộ nội dung thật giống. Không cần đọc tên người nói.";


async function loadQuestions(lesson: WewinLesson): Promise<ListenQuestion[] | null> {
  let raw: string;
  try {
    raw = await readFile(path.join(lesson.dir, "listen-questions.json"), "utf8");
  } catch {
    return null;
  }
  const list = JSON.parse(raw) as Record<string, unknown>[];
  return validateQuestions(list.slice(0, 5).map((q, i) => ({ ...q, id: `q${i + 1}` })));
}

async function main() {
  const lessons = await loadWewinLessons();
  console.log(`Parsed ${lessons.length} lesson(s).`);
  const questions = new Map<string, ListenQuestion[]>();
  for (const lesson of lessons) {
    try {
      const qs = await loadQuestions(lesson);
      if (qs) questions.set(lesson.slug, qs);
      else if (wants("qa")) console.warn(`! ${lesson.slug}: no listen-questions.json`);
    } catch (err) {
      console.error(`✗ ${lesson.slug} questions: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (DRY_RUN) {
    for (const lesson of lessons) {
      console.log(`\n=== ${lesson.slug} — ${lesson.title}${lesson.dialogue ? " (dialogue)" : ""}`);
      console.log(`--- dictation / shadowing text\n${lesson.plainTranscript}`);
      for (const q of questions.get(lesson.slug) ?? []) {
        console.log(`  Q ${q.prompt}  →  ${q.answers.join(" | ")}`);
      }
    }
    return;
  }

  const dictation = await getDictationRepo();
  const shadowing = await getShadowingRepo();
  if (!dictation || !shadowing) throw new Error("No backend available (DB / migration missing)");

  for (const lesson of lessons) {
    const audioUrl = await publishLessonAudio(lesson);
    const done: string[] = [];

    const upsertDictation = async (slug: string, data: ExerciseData) => {
      const existing = await dictation.findExercise({ slug });
      if (existing) await dictation.updateExercise(existing.id, data);
      else await dictation.createExercise(slug, data);
    };
    const base = {
      title: lesson.title,
      level: lesson.level,
      audioUrl,
      settings: DEFAULT_DICTATION_SETTINGS,
      status: "PUBLISHED" as const,
      order: lesson.order,
    };

    if (wants("dictation")) {
      await upsertDictation(`${lesson.slug}-dictation`, {
        ...base,
        instructions: lesson.dialogue ? DICTATION_DIALOGUE_INSTRUCTIONS : null,
        transcript: lesson.plainTranscript,
        mode: "FULL_TEXT",
        gaps: null,
        questions: null,
      });
      done.push("dictation");
    }

    const qs = questions.get(lesson.slug);
    if (wants("qa") && qs) {
      await upsertDictation(`${lesson.slug}-qa`, {
        ...base,
        instructions: null,
        transcript: lesson.transcript,
        mode: "QUESTION_ANSWER",
        gaps: null,
        questions: qs,
      });
      done.push(`qa(${qs.length})`);
    }

    if (wants("shadowing")) {
      const seconds = await mp3DurationSeconds(lesson.audioFile);
      const data = {
        title: lesson.title,
        level: lesson.level,
        instructions: SHADOWING_INSTRUCTIONS,
        audioUrl,
        transcript: lesson.transcript.replace(/\s+([.,!?;:])/g, "$1"),
        maxRecordSeconds: Math.min(MAX_RECORD_SECONDS, Math.ceil(seconds * 1.2 + 15)),
        status: "PUBLISHED" as const,
        order: lesson.order,
      };
      const existing = await shadowing.findExercise({ slug: lesson.slug });
      if (existing) await shadowing.updateExercise(existing.id, data);
      else await shadowing.createExercise(lesson.slug, data);
      done.push(`shadowing(${data.maxRecordSeconds}s)`);
    }

    console.log(`${lesson.slug}: ${done.join(", ")}`);
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
