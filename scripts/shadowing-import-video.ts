/**
 * Create a video shadowing exercise from a YouTube link (videos WEWIN is licensed to use).
 * Everything runs locally and is free: yt-dlp downloads the video + English subtitles, FFmpeg
 * compresses it to 720p and extracts the audio, both go to R2, then stable-ts aligns each
 * sentence (scripts/shadowing-cues.ts). Without human-made subtitles, Whisper transcribes locally.
 *
 * Setup: the stable-ts venv from scripts/shadowing-cues.ts, plus
 *   .venv-align\Scripts\python -m pip install yt-dlp
 *
 * Usage (PowerShell drops arguments after `npm run … --`, so call tsx directly):
 *   npx tsx scripts/shadowing-import-video.ts --url https://youtu.be/XXXX [--title "…"] [--slug my-lesson] [--level B1]
 *   options: --transcript file.txt   use this transcript instead of subtitles / Whisper
 *            --whisper               ignore subtitles and transcribe with Whisper
 *            --model small.en        Whisper model for transcription
 *            --update                replace media + transcript of the existing exercise with this slug
 *            --publish               publish right away (default: DRAFT for review in /admin/shadowing)
 *            --dry-run               download + transcode + print the transcript; no upload, no DB
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { getShadowingRepo, type ExerciseData } from "../src/lib/shadowing/repo";
import { transcriptLines } from "../src/lib/shadowing/transcript";
import { DEFAULT_MAX_RECORD_SECONDS, MAX_RECORD_SECONDS } from "../src/lib/shadowing/types";

const WORK_ROOT = path.join(process.cwd(), "tmp", "shadowing-video");
/** Subtitles with fewer sentence breaks than this are treated as unpunctuated (auto-captions style). */
const MAX_WORDS_PER_SENTENCE = 40;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (flag: string) => process.argv.includes(flag);

function defaultPython(): string {
  const venv = path.join(process.cwd(), ".venv-align");
  const bin = process.platform === "win32" ? path.join(venv, "Scripts", "python.exe") : path.join(venv, "bin", "python");
  return existsSync(bin) ? bin : "python";
}

function run(cmd: string, args: string[], label: string) {
  const res = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (res.error || res.status !== 0) throw new Error(`${label} failed (${res.error?.message ?? `exit ${res.status}`})`);
}

function output(cmd: string, args: string[]): string {
  const res = spawnSync(cmd, args, { encoding: "utf8" });
  if (res.error || res.status !== 0) throw new Error(`${cmd} failed: ${res.stderr || res.error?.message}`);
  return res.stdout.trim();
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Spoken text of a WebVTT file: tags, sound cues ([Music]) and dialogue dashes removed. */
function vttText(vtt: string): string {
  const out: string[] = [];
  for (const block of vtt.replace(/\r/g, "").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) continue;
    const text = decodeEntities(lines.slice(at + 1).join(" ").replace(/<[^>]+>/g, ""))
      .replace(/\[[^\]]*\]|\([^)]*\)|♪/g, " ")
      .replace(/(^|\s)(?:-|>>)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text && text !== out[out.length - 1]) out.push(text);
  }
  return out.join(" ");
}

function wellPunctuated(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean).length;
  const breaks = (text.match(/[.!?]+(\s|$)/g) ?? []).length;
  return words > 0 && words / Math.max(1, breaks) <= MAX_WORDS_PER_SENTENCE;
}

/** One sentence per line, as the admin form and the aligner expect. */
function formatTranscript(text: string): string {
  return transcriptLines(text.replace(/\s+/g, " ").trim())
    .map((l) => l.text)
    .join("\n");
}

async function findFile(dir: string, pattern: RegExp): Promise<string | null> {
  const name = (await readdir(dir)).find((f) => pattern.test(f));
  return name ? path.join(dir, name) : null;
}

async function upload(local: string, key: string, contentType: string): Promise<string> {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (accountId && accessKeyId && secretAccessKey && bucket && publicBase) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const body = await readFile(local);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: body.length,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${publicBase}/${key}`;
  }
  const dest = path.join(process.cwd(), "public", key);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(local, dest);
  return `/${key}`;
}

const mb = async (file: string) => ((await stat(file)).size / 1024 / 1024).toFixed(1);

async function main() {
  const url = arg("--url");
  if (!url) throw new Error("Missing --url <YouTube link>");
  const dryRun = has("--dry-run");
  const python = arg("--python") ?? defaultPython();
  const ffmpeg = output(python, ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]);

  const work = path.join(WORK_ROOT, randomUUID().slice(0, 8));
  await mkdir(work, { recursive: true });

  console.log("Downloading video + English subtitles…");
  run(
    python,
    [
      "-m", "yt_dlp",
      "--no-playlist",
      "--ignore-errors",
      "--ffmpeg-location", ffmpeg,
      "-f", "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
      "--merge-output-format", "mkv",
      "--write-info-json",
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      "en,en-US,en-GB,en-orig",
      "--sub-format",
      "vtt",
      "--convert-subs",
      "vtt",
      "-o", path.join(work, "source.%(ext)s"),
      url,
    ],
    "yt-dlp",
  );

  const info = JSON.parse(await readFile(path.join(work, "source.info.json"), "utf8")) as {
    id: string;
    title: string;
    duration?: number;
  };
  const source = await findFile(work, /^source\.(mkv|mp4|webm)$/);
  if (!source) throw new Error("yt-dlp did not produce a video file");

  console.log("Compressing to 720p H.264 + extracting audio…");
  const videoFile = path.join(work, "video.mp4");
  const audioFile = path.join(work, "audio.mp3");
  run(
    ffmpeg,
    [
      "-nostdin", "-y", "-loglevel", "error", "-stats",
      "-i", source,
      "-vf", "scale=-2:'min(720,ih)'",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p", "-g", "60",
      "-c:a", "aac", "-b:a", "96k", "-ac", "2",
      "-movflags", "+faststart",
      videoFile,
    ],
    "FFmpeg (video)",
  );
  run(
    ffmpeg,
    ["-nostdin", "-y", "-loglevel", "error", "-i", source, "-vn", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", audioFile],
    "FFmpeg (audio)",
  );

  let transcript: string;
  let transcriptSource: string;
  const transcriptPath = arg("--transcript");
  const subs = has("--whisper") ? null : await findFile(work, /^source\.en[\w-]*\.vtt$/);
  const subsText = subs ? vttText(await readFile(subs, "utf8")) : "";
  if (transcriptPath) {
    transcript = formatTranscript(await readFile(transcriptPath, "utf8"));
    transcriptSource = `file ${transcriptPath}`;
  } else if (subsText && wellPunctuated(subsText)) {
    transcript = formatTranscript(subsText);
    transcriptSource = `YouTube subtitles (${path.basename(subs!)})`;
  } else {
    console.log(subsText ? "Subtitles lack punctuation — transcribing with Whisper instead…" : "No English subtitles — transcribing with Whisper…");
    const out = path.join(work, "transcript.json");
    run(
      python,
      ["-W", "ignore::SyntaxWarning", path.join("scripts", "transcribe-shadowing.py"), audioFile, out, "--model", arg("--model") ?? "small.en"],
      "Whisper transcription",
    );
    transcript = formatTranscript((JSON.parse(await readFile(out, "utf8")) as { text: string }).text);
    transcriptSource = "Whisper (local) — review before publishing";
  }
  if (!transcript) throw new Error("Transcript is empty");

  const title = arg("--title") ?? info.title;
  const slug = arg("--slug") ?? (slugify(title) || `video-${info.id}`);
  const duration = info.duration ?? 0;
  console.log(
    `\n${title}\n  slug: ${slug}\n  duration: ${Math.round(duration)}s\n  video: ${await mb(videoFile)} MB, audio: ${await mb(audioFile)} MB` +
      `\n  transcript: ${transcriptLines(transcript).length} sentences from ${transcriptSource}`,
  );

  if (dryRun) {
    console.log(`\n${transcript}\n\nDry run: nothing uploaded or saved. Files kept in ${work}`);
    return;
  }

  const repo = await getShadowingRepo();
  if (!repo) throw new Error("No shadowing storage available (DB unreachable or migration not applied).");
  const existing = await repo.findExercise({ slug });
  if (existing && !has("--update")) {
    throw new Error(`Slug "${slug}" already exists. Pass --update to replace its media, or choose another --slug.`);
  }

  console.log("\nUploading to R2…");
  const stamp = `${slug}-${Date.now().toString(36)}`;
  const videoUrl = await upload(videoFile, `uploads/shadowing/video/${stamp}.mp4`, "video/mp4");
  const audioUrl = await upload(audioFile, `uploads/audio/shadowing/${stamp}.mp3`, "audio/mpeg");

  const maxRecordSeconds = Math.min(
    MAX_RECORD_SECONDS,
    Math.max(DEFAULT_MAX_RECORD_SECONDS, Math.ceil(duration * 1.25) + 5),
  );
  if (existing) {
    const data: ExerciseData = {
      title: arg("--title") ?? existing.title,
      level: arg("--level") ?? existing.level,
      instructions: existing.instructions,
      audioUrl,
      videoUrl,
      transcript,
      maxRecordSeconds,
      status: has("--publish") ? "PUBLISHED" : existing.status,
      order: existing.order,
      annotations: existing.annotations ?? null,
    };
    await repo.updateExercise(existing.id, data);
    await repo.setCues(existing.id, null);
  } else {
    const rows = await repo.listExercises(false);
    await repo.createExercise(slug, {
      title,
      level: arg("--level") ?? null,
      instructions: null,
      audioUrl,
      videoUrl,
      transcript,
      maxRecordSeconds,
      status: has("--publish") ? "PUBLISHED" : "DRAFT",
      order: rows.length ? Math.max(...rows.map((r) => r.order)) + 1 : 1,
      annotations: null,
    });
  }
  console.log(`Saved exercise "${slug}". Aligning sentence timings…\n`);

  const align = spawnSync("npx", ["tsx", path.join("scripts", "shadowing-cues.ts"), "--slug", slug], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (align.status !== 0) {
    console.warn(`Alignment failed; rerun: npx tsx scripts/shadowing-cues.ts --slug ${slug}`);
  }

  // Automatically fill IPA annotations with CMU Pronouncing Dictionary
  spawnSync("npx", ["tsx", path.join("scripts", "shadowing-annotations.ts"), "--slug", slug, "--fill-ipa"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  await rm(work, { recursive: true, force: true });
  console.log(
    `\nDone. Review the transcript in /admin/shadowing, then publish.` +
      (has("--publish") ? " (already published; live pages update within 5 minutes)" : ""),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => {}));
