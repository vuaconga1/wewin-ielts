import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const MAX_AUDIO_BYTES = 32 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};
const EXT_BY_NAME: Record<string, string> = {
  mp3: "mp3",
  m4a: "m4a",
  wav: "wav",
  ogg: "ogg",
  webm: "webm",
};

export function audioExtension(file: File): string | null {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_EXT[file.type] ?? EXT_BY_NAME[fromName] ?? null;
}

/** Upload to R2 when configured, otherwise `public/uploads/...` (local dev). */
export async function uploadAudioFile(
  file: File,
  folder: string,
  namePrefix: string,
): Promise<string> {
  const ext = audioExtension(file);
  if (!ext) throw new Error("UNSUPPORTED_AUDIO");
  const safePrefix = namePrefix.replace(/[^a-z0-9-]/g, "") || "audio";
  const name = `${safePrefix}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const key = `uploads/audio/${folder}/${name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (accountId && accessKeyId && secretAccessKey && bucket && publicBase) {
    const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: file.type || `audio/${ext}`, ContentLength: buffer.length, CacheControl: "public, max-age=31536000, immutable" }));
    return `${publicBase}/${key}`;
  }
  const dir = path.join(process.cwd(), "public", "uploads", "audio", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return `/${key}`;
}
