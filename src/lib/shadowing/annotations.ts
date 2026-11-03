import { transcriptLines } from "@/lib/shadowing/transcript";

/** Stored in `ShadowingExercise.annotations`. */
export type StoredAnnotationSet = {
  version: 1;
  lines: { text: string; ipa?: string; translation?: string }[];
};

export type LineAnnotation = { ipa: string | null; translation: string | null };

const MAX_FIELD_CHARS = 1_000;

/** Case/punctuation/whitespace-insensitive key so small edits elsewhere keep a sentence's annotation. */
export function sentenceKey(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, " ").trim();
}

/** One entry per `transcriptLines(transcript)` sentence (null where none), or null when nothing matches. */
export function annotationsFor(stored: unknown, transcript: string): LineAnnotation[] | null {
  if (!stored || typeof stored !== "object") return null;
  const set = stored as Partial<StoredAnnotationSet>;
  if (set.version !== 1 || !Array.isArray(set.lines)) return null;
  const byKey = new Map<string, LineAnnotation>();
  for (const l of set.lines) {
    if (!l || typeof l.text !== "string") continue;
    const ipa = typeof l.ipa === "string" && l.ipa.trim() ? l.ipa.trim() : null;
    const translation = typeof l.translation === "string" && l.translation.trim() ? l.translation.trim() : null;
    if (ipa || translation) byKey.set(sentenceKey(l.text), { ipa, translation });
  }
  if (byKey.size === 0) return null;
  const out = transcriptLines(transcript).map((l) => byKey.get(sentenceKey(l.text)) ?? { ipa: null, translation: null });
  return out.some((a) => a.ipa || a.translation) ? out : null;
}

/** Validates admin input into a storable set (drops empty rows, trims, caps length). */
export function normalizeAnnotations(raw: unknown): StoredAnnotationSet | null {
  if (!Array.isArray(raw)) return null;
  const lines: StoredAnnotationSet["lines"] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { text, ipa, translation } = r as Record<string, unknown>;
    if (typeof text !== "string" || !text.trim()) continue;
    const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, MAX_FIELD_CHARS) : undefined);
    const row = { text: text.trim(), ipa: clean(ipa), translation: clean(translation) };
    if (row.ipa || row.translation) lines.push(row);
  }
  return lines.length ? { version: 1, lines } : null;
}

