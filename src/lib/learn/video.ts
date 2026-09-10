/**
 * Save uploaded lesson video under public/uploads/learn/videos/
 * Returns URL path suitable for <video src>.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { isVercel, UPLOADS_PUBLIC_DIR } from "@/lib/paths";

const VIDEO_DIR = path.join(UPLOADS_PUBLIC_DIR, "learn", "videos");
const ALLOWED = new Set([".mp4", ".webm", ".ogg", ".mov"]);
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

function safeBaseName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function saveLearnVideoUpload(
  buffer: Buffer,
  originalFilename: string,
): Promise<{ relativeUrl: string; absolutePath: string }> {
  if (isVercel) {
    throw new Error(
      "Upload video chưa hỗ trợ trên Vercel. Dùng URL video ngoài (CDN / Drive public / YouTube) trong form bài học.",
    );
  }

  if (buffer.length > MAX_BYTES) {
    throw new Error("Video quá lớn (tối đa 200 MB)");
  }

  const ext = path.extname(originalFilename).toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new Error(
      `Video không hỗ trợ: ${ext || "(không có đuôi)"}. Dùng .mp4 / .webm / .ogg / .mov`,
    );
  }

  await mkdir(VIDEO_DIR, { recursive: true });
  const stamp = randomBytes(4).toString("hex");
  const base = safeBaseName(path.basename(originalFilename, ext)) || "lesson";
  const filename = `${base}-${stamp}${ext}`;
  const absolutePath = path.join(VIDEO_DIR, filename);
  await writeFile(absolutePath, buffer);

  return {
    relativeUrl: `/uploads/learn/videos/${filename}`,
    absolutePath,
  };
}
