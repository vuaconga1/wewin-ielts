/**
 * Canonical contract for notes / table / form / summary gap completion:
 *
 * 1. Shared notes (with numbered blanks) live in `part.content`.
 * 2. Each blank question stores an empty/minimal stem + `blank: true`
 *    — never a sliding-window fragment of the notes.
 * 3. CDI / practice answer panel = question number + input
 *    (+ options for MCQ). Never reprint notes fragments beside the notes pane.
 *
 * `isRedundantGapStem` / UI hide logic is a safety net for older imports;
 * extractors + import sanitize should emit clean data first.
 */

import type { ImportIssue, QuestionDraft } from "@/lib/import/schemas";

/** Preferred stem when the blank already appears inline in part.content. */
export const INLINE_GAP_STEM = "";

const BLANK_MARK_RE = /(?:[.…_…]|\.){2,}|_{2,}|\u2026+|_____/u;

/** Types whose blanks normally live inside part notes/tables. */
export function isInlineGapType(type: string): boolean {
  return (
    type === "GAP_FILL" ||
    type === "TABLE_COMPLETION" ||
    type === "MAP_LABELING"
  );
}

/**
 * True when part body looks like notes/table with numbered blanks
 * (e.g. "1 ………", "3 ___", "her 9  and").
 */
export function partHasNumberedBlanks(
  content: string | null | undefined,
): boolean {
  if (!content?.trim()) return false;
  // Require real blank marks (dots/underscores). Do NOT treat line-leading
  // "9   What is…?" short-answer stems as notes blanks.
  if (
    /(?:^|[\s(])\d{1,2}\s*(?:[$£€]\s*)?(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+)/m.test(
      content,
    )
  ) {
    return true;
  }
  // Mid-line space blanks only: "her 9  and"
  return /(?<=\S)[\s(]\d{1,2}\s{2,}(?=[a-zA-Z(])/m.test(content);
}

function blankMarkerCount(stem: string): number {
  const s = stem.trim();
  if (!s) return 0;
  const unders = s.match(/_____/g)?.length ?? 0;
  const dots = s.match(/(?:[.…_…]|\.){2,}|_{2,}|\u2026+/gu)?.length ?? 0;
  return Math.max(unders, dots);
}

/**
 * Detect sliding-window / mid-sentence / mid-word gap stems that should not
 * be shown (or stored) when notes already appear in part.content.
 *
 * Do NOT treat every long single-blank sentence as redundant — templated
 * imports often use a full short sentence as the real stem.
 */
export function looksLikeRedundantGapStem(stem: string): boolean {
  const s = stem.replace(/\s+/g, " ").trim();
  if (!s) return false;

  const blanks = blankMarkerCount(s);
  if (blanks >= 2) return true;
  // Truncated window start: "volves selecting…" / "R NUMBERS…"
  if (blanks >= 1 && /^[a-z]/.test(s)) return true;
  if (blanks >= 1 && /^[A-Z]\s/.test(s)) return true;
  // Mid-word start even without a blank mark (legacy windows / partial trim)
  if (/^[a-z]{2,}/.test(s) && s.length >= 24) return true;
  // Classic import window: embeds "3 ………" / "1 ___" inside the fragment
  if (/(?:^|[\s(])\d{1,2}\s*(?:(?:[.…_…]|\.){2,}|_{2,}|\u2026+|_____)/u.test(s)) {
    return true;
  }
  // "Complete the notes… (Q7)" style instruction echoes — not a real stem
  if (/^complete the (notes|form|table|summary|sentences)\b/i.test(s)) {
    return true;
  }
  return false;
}

function normalizeForCompare(s: string): string {
  return s
    .toLowerCase()
    .replace(BLANK_MARK_RE, " ")
    .replace(/\d{1,2}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemOverlapsPart(stem: string, partContent: string): boolean {
  const a = normalizeForCompare(stem);
  const b = normalizeForCompare(partContent);
  if (a.length < 20 || b.length < 20) return false;
  if (b.includes(a) && a.length / b.length >= 0.35) return true;
  if (a.includes(b) && b.length / a.length >= 0.55) return true;
  return false;
}

function questionHasMcqOptions(q: QuestionDraft): boolean {
  const opts = (q.content as { options?: unknown }).options;
  return Array.isArray(opts) && opts.length >= 2;
}

function stemOf(q: QuestionDraft): string {
  return String((q.content as { stem?: unknown }).stem ?? "").trim();
}

function isBlankMarked(q: QuestionDraft): boolean {
  return Boolean((q.content as { blank?: unknown }).blank);
}

/**
 * Whether this question's stem should be cleared to INLINE_GAP_STEM when
 * notes with blanks already live in part.content.
 */
export function shouldClearInlineGapStem(
  q: QuestionDraft,
  partContent: string | null | undefined,
): boolean {
  if (!isInlineGapType(q.type) && !isBlankMarked(q)) return false;
  if (questionHasMcqOptions(q)) return false;

  const stem = stemOf(q);
  if (!stem) return false;

  // Always clear obvious window garbage for blank-fill types
  if (looksLikeRedundantGapStem(stem)) return true;

  const partHasBlanks = partHasNumberedBlanks(partContent);
  // Aggressive clear only when notes already carry numbered blanks, or the
  // extractor marked blank:true (IELTS notes/table path — not templated stems).
  if (!partHasBlanks && !isBlankMarked(q)) return false;

  if (stem.length >= 28) return true;
  if (BLANK_MARK_RE.test(stem)) return true;
  if (partContent && stemOverlapsPart(stem, partContent)) return true;

  return false;
}

export type SanitizeGapStemsResult = {
  questions: QuestionDraft[];
  cleared: number;
  duplicateGroups: number;
  issues: ImportIssue[];
};

/**
 * Auto-fix redundant gap stems on a part's questions and emit warnings.
 * Does not touch answers / types / options.
 */
export function sanitizePartGapStems(
  partTitle: string,
  partOrder: number,
  partContent: string | null | undefined,
  questions: QuestionDraft[],
): SanitizeGapStemsResult {
  const issues: ImportIssue[] = [];
  let cleared = 0;

  const next = questions.map((q) => {
    if (!shouldClearInlineGapStem(q, partContent)) return q;
    cleared += 1;
    const content = {
      ...(q.content as Record<string, unknown>),
      stem: INLINE_GAP_STEM,
      blank: true,
    };
    return { ...q, content };
  });

  if (cleared > 0) {
    issues.push({
      level: "warning",
      code: "REDUNDANT_GAP_STEMS_CLEARED",
      message:
        `Part "${partTitle}": đã xoá ${cleared} stem gap thừa ` +
        `(mảnh notes/cửa sổ giữa câu) vì phần nội dung đã có chỗ trống đánh số. ` +
        `Câu hỏi chỉ giữ số + ô nhập.`,
      partOrder,
    });
  }

  // Near-identical non-empty stems among remaining inline-gap questions
  const stems = next
    .filter((q) => isInlineGapType(q.type) && !questionHasMcqOptions(q))
    .map((q) => normalizeForCompare(stemOf(q)))
    .filter((s) => s.length >= 20);

  const counts = new Map<string, number>();
  for (const s of stems) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let duplicateGroups = 0;
  for (const n of counts.values()) {
    if (n >= 3) duplicateGroups += 1;
  }
  if (duplicateGroups > 0) {
    issues.push({
      level: "warning",
      code: "DUPLICATE_GAP_STEMS",
      message:
        `Part "${partTitle}": phát hiện stem gap gần giống nhau lặp lại ` +
        `(${duplicateGroups} nhóm). Kiểm tra lại extract notes/table.`,
      partOrder,
    });
  }

  return { questions: next, cleared, duplicateGroups, issues };
}
