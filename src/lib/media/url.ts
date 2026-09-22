/**
 * Public media URLs for Listening audio + writing/images.
 *
 * When `R2_PUBLIC_BASE_URL` is set (production / Cloudflare R2 CDN), rewrite
 * relative `/uploads/...` paths to absolute CDN URLs. Locally, leave paths
 * as-is so `public/uploads/...` continues to work without R2.
 */

const UPLOADS_PREFIX = "/uploads";

/** Trim trailing slash from public base (custom domain or `*.r2.dev`). */
export function getR2PublicBaseUrl(): string | null {
  const raw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function isR2MediaEnabled(): boolean {
  return Boolean(getR2PublicBaseUrl());
}

/**
 * Normalize a stored media path or absolute URL for the browser.
 * - Absolute `http(s)://...` → unchanged
 * - `/uploads/...` or `uploads/...` → `${R2_PUBLIC_BASE_URL}/uploads/...` when set
 * - Otherwise → path as-is (local Next `public/` fallback)
 */
export function mediaUrl(path: string | null | undefined): string {
  if (path == null) return "";
  const trimmed = String(path).trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const base = getR2PublicBaseUrl();
  if (!base) return withSlash;

  // Only rewrite app uploads; leave other relative paths alone.
  if (
    withSlash === UPLOADS_PREFIX ||
    withSlash.startsWith(`${UPLOADS_PREFIX}/`)
  ) {
    return `${base}${withSlash}`;
  }

  return withSlash;
}
