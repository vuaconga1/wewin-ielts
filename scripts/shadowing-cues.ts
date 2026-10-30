/**
 * Compute sentence timings (cues) for shadowing exercises with stable-ts forced alignment
 * (free, runs locally on CPU) and store them in ShadowingExercise.cues.
 *
 * One-time setup (Python 3.10+):
 *   python -m venv .venv-align
 *   .venv-align\Scripts\python -m pip install --index-url https://download.pytorch.org/whl/cpu torch torchaudio
 *   .venv-align\Scripts\python -m pip install -e ./stable-ts-main faster-whisper imageio-ffmpeg
 *
 * Usage:
 *   npm run shadowing:cues                      # exercises without valid cues
 *   npx tsx scripts/shadowing-cues.ts --slug my-lesson  # one exercise (repeatable)
 *   npx tsx scripts/shadowing-cues.ts --all             # re-align everything
 *   npx tsx scripts/shadowing-cues.ts --dry-run         # align and print, do not save
 * (PowerShell drops arguments after `npm run … --`, so call tsx directly when passing flags.)
 *   options: --model small.en  --engine faster-whisper  --python <path>
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { mediaUrl } from "../src/lib/media/url";
import { prisma } from "../src/lib/prisma";
import { getShadowingRepo } from "../src/lib/shadowing/repo";
import { transcriptLines } from "../src/lib/shadowing/transcript";
import { validCueTimings, type StoredCueSet } from "../src/lib/shadowing/cues";

const WORK_DIR = path.join(process.cwd(), "tmp", "shadowing-align");
const PUBLIC_DIR = path.join(process.cwd(), "public");

type Job = { id: string; slug: string; audio: string; lines: string[] };
type Result = {
  id: string;
  slug: string;
  ok: boolean;
  lines: StoredCueSet["lines"];
  missing?: number;
  engine?: string;
  error?: string;
};

function argValues(flag: string): string[] {
  const out: string[] = [];
  process.argv.forEach((a, i) => {
    if (a === flag && process.argv[i + 1]) out.push(process.argv[i + 1]);
  });
  return out;
}

function defaultPython(): string {
  const venv = path.join(process.cwd(), ".venv-align");
  const bin = process.platform === "win32" ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");
  return existsSync(bin) ? bin : "python";
}

/** Local `public/` file when present, else the public (R2/CDN) URL. */
function audioSource(audioUrl: string): string | null {
  if (/^https?:\/\//i.test(audioUrl)) return audioUrl;
  const local = path.join(PUBLIC_DIR, audioUrl.replace(/^\/+/, ""));
  if (existsSync(local)) return local;
  const url = mediaUrl(audioUrl);
  return /^https?:\/\//i.test(url) ? url : null;
}

async function main() {
  const slugs = new Set(argValues("--slug"));
  const all = process.argv.includes("--all");
  const dryRun = process.argv.includes("--dry-run");
  const model = argValues("--model")[0] ?? "base.en";
  const engine = argValues("--engine")[0] ?? "whisper";
  const python = argValues("--python")[0] ?? defaultPython();

  const repo = await getShadowingRepo();
  if (!repo) throw new Error("No shadowing storage available (DB unreachable or migration not applied).");

  const rows = await repo.listExercises(false);
  const jobs: Job[] = [];
  for (const row of rows) {
    if (slugs.size > 0 && !slugs.has(row.slug)) continue;
    const ex = await repo.findExercise({ id: row.id });
    if (!ex) continue;
    if (!all && slugs.size === 0 && validCueTimings(ex.cues, ex.transcript, ex.audioUrl)) continue;
    const audio = audioSource(ex.audioUrl);
    if (!audio) {
      console.warn(`skip ${ex.slug}: audio not found locally and no public URL (${ex.audioUrl})`);
      continue;
    }
    jobs.push({ id: ex.id, slug: ex.slug, audio, lines: transcriptLines(ex.transcript).map((l) => l.text) });
  }

  if (jobs.length === 0) {
    console.log("Nothing to align: every selected exercise already has up-to-date cues.");
    return;
  }

  await mkdir(WORK_DIR, { recursive: true });
  const jobsFile = path.join(WORK_DIR, "jobs.json");
  const resultsFile = path.join(WORK_DIR, "results.json");
  await writeFile(jobsFile, JSON.stringify(jobs, null, 2), "utf8");

  console.log(`Aligning ${jobs.length} exercise(s) with stable-ts (${engine}, ${model})…`);
  const run = spawnSync(
    python,
    [
      "-W",
      "ignore::SyntaxWarning",
      path.join("scripts", "align-shadowing.py"),
      jobsFile,
      resultsFile,
      "--model",
      model,
      "--engine",
      engine,
    ],
    { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } },
  );
  if (run.error || run.status !== 0) {
    throw new Error(`Python aligner failed (${run.error?.message ?? `exit ${run.status}`}). Python: ${python}`);
  }

  const results = JSON.parse(await readFile(resultsFile, "utf8")) as Result[];
  let saved = 0;
  for (const r of results) {
    if (!r.ok) continue;
    const ex = await repo.findExercise({ id: r.id });
    if (!ex) continue;
    const cueSet: StoredCueSet = {
      version: 1,
      aligner: `stable-ts/${r.engine ?? engine}/${model}`,
      audioUrl: ex.audioUrl,
      lines: r.lines,
    };
    if (!validCueTimings(cueSet, ex.transcript, ex.audioUrl)) {
      console.warn(`skip ${r.slug}: aligned sentences do not match the current transcript`);
      continue;
    }
    if (dryRun) {
      console.log(`\n${r.slug}`);
      for (const c of r.lines) console.log(`  ${c.start.toFixed(2)}–${c.end.toFixed(2)}  ${c.text}`);
      continue;
    }
    await repo.setCues(ex.id, cueSet);
    saved++;
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(
    dryRun
      ? `\nDry run: ${results.length - failed} aligned, ${failed} failed, nothing saved.`
      : `\nSaved cues for ${saved} exercise(s); ${failed} failed. Live pages pick them up within 5 minutes (ISR).`,
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));
