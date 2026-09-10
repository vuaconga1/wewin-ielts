import path from "node:path";

/**
 * On Vercel the deployment FS is read-only except `/tmp`.
 * Local/dev uses `./data` and `./public/uploads`.
 */
export const isVercel = Boolean(process.env.VERCEL);

export const DATA_DIR =
  process.env.DATA_DIR ??
  (isVercel
    ? path.join("/tmp", "wewin-data")
    : path.join(process.cwd(), "data"));

export const UPLOADS_PUBLIC_DIR =
  process.env.UPLOADS_DIR ??
  (isVercel
    ? path.join("/tmp", "wewin-uploads")
    : path.join(process.cwd(), "public", "uploads"));

/** URL path prefix for locally served uploads (only works when files are under public/). */
export const UPLOADS_URL_PREFIX = "/uploads";
