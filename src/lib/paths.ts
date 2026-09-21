import path from "node:path";

/**
 * On Vercel the deployment FS is read-only except `/tmp`.
 * Local/dev uses `./data` and `./public/uploads`.
 *
 * Writable runtime data goes to DATA_DIR (/tmp on Vercel).
 * Demo/seed JSON shipped in the deploy artifact lives under BUNDLED_DATA_DIR
 * (see .vercelignore allowlist for data/tests/test-1-* and test-9-*).
 */
export const isVercel = Boolean(process.env.VERCEL);

export const BUNDLED_DATA_DIR = path.join(process.cwd(), "data");

export const DATA_DIR =
  process.env.DATA_DIR ??
  (isVercel
    ? path.join("/tmp", "wewin-data")
    : BUNDLED_DATA_DIR);

export const UPLOADS_PUBLIC_DIR =
  process.env.UPLOADS_DIR ??
  (isVercel
    ? path.join("/tmp", "wewin-uploads")
    : path.join(process.cwd(), "public", "uploads"));

/** URL path prefix for locally served uploads (only works when files are under public/). */
export const UPLOADS_URL_PREFIX = "/uploads";
