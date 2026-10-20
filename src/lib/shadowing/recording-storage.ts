/**
 * Private storage for student shadowing recordings. Objects are never exposed via a
 * public URL; they are streamed through an authorized API route.
 * R2 when configured (prefer a dedicated private bucket), otherwise DATA_DIR (local dev).
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { DATA_DIR } from "@/lib/paths";

const LOCAL_DIR = path.join(DATA_DIR, "shadowing", "recordings");
const KEY_PREFIX = "private/shadowing-recordings/";

type R2Config = { client: S3Client; bucket: string };

function r2(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = (process.env.R2_PRIVATE_BUCKET || process.env.R2_BUCKET)?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

function localPath(key: string): string {
  const name = path.basename(key);
  return path.join(LOCAL_DIR, name);
}

export function recordingKeyFor(attemptId: string, ext: string): string {
  return `${KEY_PREFIX}${attemptId}.${ext}`;
}

export async function saveRecording(key: string, body: Buffer, mime: string): Promise<void> {
  const cfg = r2();
  if (cfg) {
    await cfg.client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        ContentLength: body.length,
        CacheControl: "private, no-store",
      }),
    );
    return;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(localPath(key), body);
}

export async function readRecording(key: string): Promise<Buffer | null> {
  const cfg = r2();
  try {
    if (cfg) {
      const res = await cfg.client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    }
    return await readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function deleteRecording(key: string): Promise<void> {
  const cfg = r2();
  try {
    if (cfg) {
      await cfg.client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
      return;
    }
    await rm(localPath(key), { force: true });
  } catch (err) {
    console.warn("[shadowing] failed to delete recording", key, err);
  }
}
