import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { AuthError, getSessionUser } from "@/lib/auth";
import { isAllowedAvatarUrl } from "@/lib/avatar";
import { setUserAvatarUrl } from "@/lib/user-profile";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

async function tryWriteAvatarFile(
  userId: string,
  buffer: Buffer,
  ext: "jpg" | "png" | "webp",
): Promise<string | null> {
  try {
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });
    const filename = `${userId}.${ext}`;
    const full = path.join(dir, filename);
    await writeFile(full, buffer);
    // Cache-bust so browser picks up replacement
    return `/uploads/avatars/${filename}?v=${Date.now()}`;
  } catch {
    return null;
  }
}

function extFromMime(mime: string): "jpg" | "png" | "webp" | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

/**
 * PATCH /api/account/avatar
 * Body JSON: { avatarUrl: string }
 * Or multipart/form-data with field "file"
 */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "LOGIN_REQUIRED", message: "Cần đăng nhập" },
        { status: 401 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";

    let avatarUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { error: "NO_FILE", message: "Thiếu file ảnh" },
          { status: 400 },
        );
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "FILE_TOO_LARGE", message: "Ảnh tối đa 2MB" },
          { status: 400 },
        );
      }
      const ext = extFromMime(file.type);
      if (!ext) {
        return NextResponse.json(
          { error: "INVALID_TYPE", message: "Chỉ hỗ trợ JPEG, PNG, WebP" },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (!isVercel()) {
        const written = await tryWriteAvatarFile(user.id, buffer, ext);
        if (written) avatarUrl = written;
      }

      if (!avatarUrl) {
        // Ephemeral FS (Vercel) or write failed → persist data URL
        const b64 = buffer.toString("base64");
        const mime = file.type || "image/jpeg";
        avatarUrl = `data:${mime};base64,${b64}`;
        if (!isAllowedAvatarUrl(avatarUrl)) {
          return NextResponse.json(
            {
              error: "AVATAR_TOO_LARGE",
              message: "Ảnh quá lớn sau khi mã hóa. Hãy crop nhỏ hơn.",
            },
            { status: 400 },
          );
        }
      }
    } else {
      const body = (await request.json().catch(() => null)) as {
        avatarUrl?: unknown;
      } | null;
      const raw =
        typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() : "";
      if (!raw || !isAllowedAvatarUrl(raw)) {
        return NextResponse.json(
          { error: "INVALID_AVATAR", message: "URL ảnh không hợp lệ" },
          { status: 400 },
        );
      }

      // If client sent a data URL and we're local, try writing a file
      if (raw.startsWith("data:image/") && !isVercel()) {
        const match = raw.match(/^data:(image\/[\w+.-]+);base64,(.+)$/i);
        if (match) {
          const mime = match[1];
          const ext = extFromMime(mime) ?? "jpg";
          const buffer = Buffer.from(match[2], "base64");
          if (buffer.length <= MAX_UPLOAD_BYTES) {
            const written = await tryWriteAvatarFile(user.id, buffer, ext);
            avatarUrl = written ?? raw;
          } else {
            avatarUrl = raw;
          }
        } else {
          avatarUrl = raw;
        }
      } else {
        avatarUrl = raw;
      }
    }

    const ok = await setUserAvatarUrl(user.id, avatarUrl);
    if (!ok) {
      return NextResponse.json(
        { error: "SAVE_FAILED", message: "Không lưu được ảnh đại diện" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { error: e.code, message: e.message },
        { status: 401 },
      );
    }
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
