/**
 * Writes transcript.txt (questions.txt with every blank filled from answer-key.txt) into
 * each WEWIN lesson folder.
 *
 * Usage:
 *   npx tsx scripts/export-wewin-transcripts.ts
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadWewinLessons, mp3DurationSeconds } from "./lib/wewin-lessons";

async function main() {
  const lessons = await loadWewinLessons();
  for (const lesson of lessons) {
    await writeFile(path.join(lesson.dir, "transcript.txt"), `${lesson.title}\n\n${lesson.transcript}\n`, "utf8");
    const seconds = await mp3DurationSeconds(lesson.audioFile);
    const words = lesson.plainTranscript.split(" ").length;
    console.log(
      `${lesson.slug.padEnd(22)} ${String(Math.round(seconds)).padStart(4)}s ${String(words).padStart(4)} words${lesson.dialogue ? "  dialogue" : ""}`,
    );
  }
  console.log(`Wrote transcript.txt for ${lessons.length} lesson(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
