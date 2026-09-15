/**
 * Extract embedded images from a .docx into public/uploads/writing/
 * and return public URLs in document order.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

export async function extractDocxImagesToUploads(
  buffer: Buffer,
  options: {
    slug: string;
    prefix?: string;
    /** Subfolder under public/uploads (default writing). */
    subdir?: "writing" | "audio" | "listening" | "images";
  },
): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const mediaNames = Object.keys(zip.files)
    .filter((f) => /^word\/media\/.+\.(png|jpe?g|gif|webp|bmp)$/i.test(f))
    .sort();

  if (!mediaNames.length) return [];

  const subdir = options.subdir ?? "writing";
  const uploadsRoot = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadsRoot, { recursive: true });

  const urls: string[] = [];
  let i = 0;
  for (const name of mediaNames) {
    i += 1;
    const file = zip.file(name);
    if (!file) continue;
    const data = await file.async("nodebuffer");
    const ext = path.extname(name).toLowerCase() || ".png";
    const base =
      options.prefix?.trim() ||
      `${options.slug.replace(/[^a-z0-9-_]+/gi, "-")}-img${i}`;
    const filename = `${base}${ext}`;
    const abs = path.join(uploadsRoot, filename);
    await writeFile(abs, data);
    urls.push(`/uploads/${subdir}/${filename}`);
  }

  return urls;
}
