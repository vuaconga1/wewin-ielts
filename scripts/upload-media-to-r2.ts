/**
 * Bulk-upload local practice media to Cloudflare R2 (S3-compatible).
 *
 * Uploads:
 *   public/uploads/audio/**
 *   public/uploads/writing/**
 *   public/uploads/images/**
 * Keys preserve layout: uploads/audio/..., uploads/writing/..., uploads/images/...
 *
 * Usage:
 *   npm run media:upload-r2
 *   npm run media:upload-r2 -- --force
 *
 * Required env (see .env.example / docs/DEPLOY_VERCEL.md):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET
 *   R2_PUBLIC_BASE_URL  (optional here; used by the app, not upload)
 */

import "dotenv/config";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const ROOT = process.cwd();
const UPLOAD_ROOTS = [
  path.join(ROOT, "public", "uploads", "audio"),
  path.join(ROOT, "public", "uploads", "writing"),
  path.join(ROOT, "public", "uploads", "images"),
] as const;

const SKIP_NAMES = new Set([".gitkeep", ".DS_Store", "Thumbs.db"]);

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function requiredEnv(name: string): string | null {
  const v = process.env[name]?.trim();
  return v || null;
}

function printSetupAndExit(): never {
  console.error(`
Missing Cloudflare R2 credentials. Set these in .env (never commit secrets):

  R2_ACCOUNT_ID=...
  R2_ACCESS_KEY_ID=...
  R2_SECRET_ACCESS_KEY=...
  R2_BUCKET=wewin-ielts-media
  R2_PUBLIC_BASE_URL=https://media.your-domain.com   # or https://pub-xxx.r2.dev

Cloudflare console steps:
  1. R2 → Create bucket (e.g. wewin-ielts-media)
  2. Bucket → Settings → Public access: enable public bucket URL
     and/or connect a custom domain (recommended)
  3. R2 → Manage R2 API Tokens → Create API token
     (Object Read & Write on that bucket)
  4. Copy Account ID + Access Key ID + Secret Access Key into .env
  5. Paste the same vars into Vercel → Project → Settings → Environment Variables
  6. Re-run: npm run media:upload-r2

See docs/DEPLOY_VERCEL.md (section Cloudflare R2).
`);
  process.exit(1);
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkFiles(full)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (SKIP_NAMES.has(entry.name)) continue;
    out.push(full);
  }
  return out;
}

function toObjectKey(absolutePath: string): string {
  const rel = path.relative(path.join(ROOT, "public"), absolutePath);
  return rel.split(path.sep).join("/");
}

async function main() {
  const accountId = requiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = requiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnv("R2_SECRET_ACCESS_KEY");
  const bucket = requiredEnv("R2_BUCKET");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    printSetupAndExit();
  }

  const force = hasFlag("force");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const files: string[] = [];
  for (const root of UPLOAD_ROOTS) {
    files.push(...(await walkFiles(root)));
  }
  files.sort();

  if (!files.length) {
    console.log("No files found under public/uploads/{audio,writing,images}.");
    return;
  }

  console.log(
    `Uploading ${files.length} file(s) → r2://${bucket}/uploads/... (force=${force})`,
  );

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]!;
    const key = toObjectKey(filePath);
    const info = await stat(filePath);
    const label = `[${i + 1}/${files.length}] ${key}`;

    try {
      if (!force) {
        try {
          await client.send(
            new HeadObjectCommand({ Bucket: bucket, Key: key }),
          );
          console.log(`${label} — skip (exists)`);
          skipped += 1;
          continue;
        } catch {
          /* not found → upload */
        }
      }

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: createReadStream(filePath),
          ContentType: contentTypeFor(filePath),
          ContentLength: info.size,
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );
      console.log(`${label} — uploaded (${(info.size / 1024 / 1024).toFixed(2)} MB)`);
      uploaded += 1;
      bytes += info.size;
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${label} — FAILED: ${msg}`);
    }
  }

  console.log("");
  console.log(
    `Done. uploaded=${uploaded} skipped=${skipped} failed=${failed} bytes=${(bytes / 1024 / 1024).toFixed(1)} MB`,
  );
  if (failed > 0) process.exit(1);

  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    console.log(
      `App will serve media from: ${publicBase.replace(/\/+$/, "")}/uploads/...`,
    );
  } else {
    console.log(
      "Tip: set R2_PUBLIC_BASE_URL so the app rewrites /uploads/... to your CDN.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
