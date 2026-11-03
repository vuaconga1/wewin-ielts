/**
 * Import, export, or auto-fill IPA for shadowing sentence annotations (IPA and Vietnamese translations).
 * Does not call any paid translation APIs.
 *
 * Usage:
 *   npx tsx scripts/shadowing-annotations.ts --slug <slug> --export tmp/<slug>.json
 *   npx tsx scripts/shadowing-annotations.ts --slug <slug> --import tmp/<slug>.json
 *   npx tsx scripts/shadowing-annotations.ts --slug <slug> --fill-ipa
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getShadowingRepo, type ExerciseData } from "../src/lib/shadowing/repo";
import { transcriptLines } from "../src/lib/shadowing/transcript";
import { annotationsFor, normalizeAnnotations } from "../src/lib/shadowing/annotations";
import { sentenceIpa } from "../src/lib/shadowing/ipa";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (flag: string) => process.argv.includes(flag);

async function main() {
  const slug = arg("--slug");
  if (!slug) throw new Error("Missing --slug <slug>");

  const repo = await getShadowingRepo();
  if (!repo) throw new Error("No shadowing storage available (DB unreachable).");

  const exercise = await repo.findExercise({ slug });
  if (!exercise) throw new Error(`Exercise "${slug}" not found.`);

  const lines = transcriptLines(exercise.transcript);
  const currentAnn = annotationsFor(exercise.annotations, exercise.transcript);

  const exportPath = arg("--export");
  const importPath = arg("--import");
  const fillIpa = has("--fill-ipa");

  if (!exportPath && !importPath && !fillIpa) {
    throw new Error("Specify at least one action: --export <path>, --import <path>, or --fill-ipa");
  }

  // 1. Fill IPA
  if (fillIpa) {
    console.log(`Generating IPA for "${slug}" (${lines.length} sentences)…`);
    const rows = lines.map((l, i) => {
      const existing = currentAnn?.[i];
      const ipa = existing?.ipa || sentenceIpa(l.text);
      const translation = existing?.translation || undefined;
      return { text: l.text, ipa, translation };
    });

    const data: ExerciseData = {
      title: exercise.title,
      level: exercise.level,
      instructions: exercise.instructions,
      audioUrl: exercise.audioUrl,
      videoUrl: exercise.videoUrl,
      transcript: exercise.transcript,
      maxRecordSeconds: exercise.maxRecordSeconds,
      status: exercise.status,
      order: exercise.order,
      annotations: normalizeAnnotations(rows),
    };
    await repo.updateExercise(exercise.id, data);
    console.log(`Updated annotations for "${slug}" with IPA. Live pages update within 5 minutes (ISR).`);
  }

  // 2. Export
  if (exportPath) {
    // Refresh annotations in case fillIpa ran before export
    const freshEx = await repo.findExercise({ slug });
    const freshAnn = annotationsFor(freshEx?.annotations, exercise.transcript);
    const rows = lines.map((l, i) => ({
      text: l.text,
      ipa: freshAnn?.[i]?.ipa ?? "",
      translation: freshAnn?.[i]?.translation ?? "",
    }));

    const absPath = path.isAbsolute(exportPath) ? exportPath : path.join(process.cwd(), exportPath);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, JSON.stringify(rows, null, 2), "utf8");
    console.log(`Exported ${rows.length} sentence annotations to ${exportPath}`);
  }

  // 3. Import
  if (importPath) {
    const absPath = path.isAbsolute(importPath) ? importPath : path.join(process.cwd(), importPath);
    if (!existsSync(absPath)) throw new Error(`File not found: ${absPath}`);

    const raw = JSON.parse(await readFile(absPath, "utf8")) as unknown;
    const normalized = normalizeAnnotations(raw);

    const data: ExerciseData = {
      title: exercise.title,
      level: exercise.level,
      instructions: exercise.instructions,
      audioUrl: exercise.audioUrl,
      videoUrl: exercise.videoUrl,
      transcript: exercise.transcript,
      maxRecordSeconds: exercise.maxRecordSeconds,
      status: exercise.status,
      order: exercise.order,
      annotations: normalized,
    };
    await repo.updateExercise(exercise.id, data);
    console.log(`Imported annotations for "${slug}". Live pages update within 5 minutes (ISR).`);
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));

