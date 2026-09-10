/**
 * Save uploaded Listening audio under public/uploads/audio/
 * Returns URL path suitable for <audio src> and MediaAsset.path
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isVercel, UPLOADS_PUBLIC_DIR } from "@/lib/paths";

const AUDIO_DIR = path.join(UPLOADS_PUBLIC_DIR, "audio");
const ALLOWED = new Set([".mp3", ".m4a", ".wav", ".ogg"]);

function safeBaseName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function assertLocalAudioWritable(ext: string) {
  if (isVercel) {
    throw new Error(
      "Upload audio chưa hỗ trợ trên Vercel (FS tạm thời). Chạy import trên máy local hoặc dùng hosting có disk.",
    );
  }
  if (!ALLOWED.has(ext)) {
    throw new Error(`Audio không hỗ trợ: ${ext}. Dùng .mp3 / .m4a / .wav / .ogg`);
  }
}

export function previewAudioByDriveId(
  originalFilename: string,
  driveFileId: string,
): { relativeUrl: string; absolutePath: string; filename: string; ext: string } {
  const ext = path.extname(originalFilename).toLowerCase() || ".mp3";
  const base =
    safeBaseName(path.basename(originalFilename, path.extname(originalFilename))) ||
    "audio";
  const idPart = driveFileId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 28) || "id";
  const filename = `${base}-${idPart}${ext}`;
  return {
    ext,
    filename,
    absolutePath: path.join(AUDIO_DIR, filename),
    relativeUrl: `/uploads/audio/${filename}`,
  };
}

export async function saveAudioUpload(
  buffer: Buffer,
  originalFilename: string,
): Promise<{ relativeUrl: string; absolutePath: string }> {
  const ext = path.extname(originalFilename).toLowerCase();
  assertLocalAudioWritable(ext);

  await mkdir(AUDIO_DIR, { recursive: true });
  const stamp = randomBytes(4).toString("hex");
  const base = safeBaseName(path.basename(originalFilename, ext)) || "audio";
  const filename = `${base}-${stamp}${ext}`;
  const absolutePath = path.join(AUDIO_DIR, filename);
  await writeFile(absolutePath, buffer);

  return {
    relativeUrl: `/uploads/audio/${filename}`,
    absolutePath,
  };
}

/**
 * Stable filename keyed by Google Drive file id (idempotent re-sync).
 */
export async function saveAudioByDriveId(
  buffer: Buffer,
  originalFilename: string,
  driveFileId: string,
): Promise<{ relativeUrl: string; absolutePath: string; filename: string }> {
  const preview = previewAudioByDriveId(originalFilename, driveFileId);
  assertLocalAudioWritable(preview.ext);

  await mkdir(AUDIO_DIR, { recursive: true });
  await writeFile(preview.absolutePath, buffer);

  return {
    relativeUrl: preview.relativeUrl,
    absolutePath: preview.absolutePath,
    filename: preview.filename,
  };
}
