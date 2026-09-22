import { mediaUrl, isR2MediaEnabled } from "@/lib/media/url";

const MEDIA_META_KEYS = [
  "audioUrl",
  "audio",
  "imageUrl",
  "mediaUrl",
] as const;

type MediaPart = {
  meta?: Record<string, unknown>;
  questions: Array<{
    mediaUrl?: string;
    content?: unknown;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

/** Minimal test shape that carries public media paths. */
export type MediaRewritableTest = {
  audioFiles?: string[];
  parts: MediaPart[];
  [key: string]: unknown;
};

function rewriteMeta(
  meta: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!meta) return meta;
  let changed = false;
  const next: Record<string, unknown> = { ...meta };
  for (const key of MEDIA_META_KEYS) {
    const value = next[key];
    if (typeof value === "string" && value.trim()) {
      const rewritten = mediaUrl(value);
      if (rewritten !== value) {
        next[key] = rewritten;
        changed = true;
      }
    }
  }
  return changed ? next : meta;
}

function rewriteContent(content: unknown): unknown {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return content;
  }
  const record = content as Record<string, unknown>;
  const imageUrl = record.imageUrl;
  if (typeof imageUrl !== "string" || !imageUrl.trim()) return content;
  const rewritten = mediaUrl(imageUrl);
  if (rewritten === imageUrl) return content;
  return { ...record, imageUrl: rewritten };
}

/**
 * Rewrite relative `/uploads/...` media paths on a test payload for the client.
 * No-op when `R2_PUBLIC_BASE_URL` is unset (local `public/uploads` fallback).
 * DB / JSON on disk keep relative paths; rewrite happens only when serving.
 */
export function withPublicMediaUrls<T extends MediaRewritableTest>(test: T): T {
  if (!isR2MediaEnabled()) return test;

  return {
    ...test,
    audioFiles: test.audioFiles?.map((p) => mediaUrl(p)),
    parts: test.parts.map((part) => ({
      ...part,
      meta: rewriteMeta(part.meta),
      questions: part.questions.map((q) => ({
        ...q,
        mediaUrl:
          typeof q.mediaUrl === "string" && q.mediaUrl.trim()
            ? mediaUrl(q.mediaUrl)
            : q.mediaUrl,
        content: rewriteContent(q.content),
      })),
    })),
  };
}
