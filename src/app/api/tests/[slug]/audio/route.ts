import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { canEditTests, getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
const MAX_BYTES = 32 * 1024 * 1024;
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

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "Cần đăng nhập" }, { status: 401 });
  if (!canEditTests(user)) return NextResponse.json({ message: "Bạn không có quyền thay audio" }, { status: 403 });
  const { slug } = await params;
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "Thiếu file audio" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ message: "Audio tối đa 32MB" }, { status: 400 });
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  const ext = MIME_EXT[file.type] ?? EXT_BY_NAME[fromName];
  if (!ext) return NextResponse.json({ message: "Chỉ hỗ trợ MP3, M4A, WAV, OGG hoặc WebM" }, { status: 400 });
  const safeSlug = slug.replace(/[^a-z0-9-]/g, "");
  const name = `${safeSlug}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const key = `uploads/audio/editor/${name}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (accountId && accessKeyId && secretAccessKey && bucket && publicBase) {
    const client = new S3Client({ region: "auto", endpoint: `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: file.type || `audio/${ext}`, ContentLength: buffer.length, CacheControl: "public, max-age=31536000, immutable" }));
    return NextResponse.json({ audioUrl: `${publicBase}/${key}` });
  }
  const dir = path.join(process.cwd(), "public", "uploads", "audio", "editor");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return NextResponse.json({ audioUrl: `/${key}` });
}
