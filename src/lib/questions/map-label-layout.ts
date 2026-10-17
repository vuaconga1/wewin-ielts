import type { ParsedTestDraft, QuestionDraft } from "@/lib/import/schemas";

const MAP_INSTRUCTION_RE = /label\s+the\s+(?:map|plan|diagram)\s+below/i;
const BLANK_RE = /\s*(?:(?:\.{2,}|_{2,}|…+)\s*)$/u;

function mapRange(content: string): { start: number; end: number } | null {
  const instruction = MAP_INSTRUCTION_RE.exec(content);
  if (!instruction) return null;
  const before = content.slice(Math.max(0, instruction.index - 100), instruction.index);
  const after = content.slice(instruction.index, instruction.index + 220);
  const prior = [...before.matchAll(/Questions?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi)].at(-1);
  const following = after.match(/questions?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/i);
  const match = prior ?? following;
  return match ? { start: Number(match[1]), end: Number(match[2]) } : null;
}

function cleanLabel(value: string): string {
  return value.replace(BLANK_RE, "").trim();
}

function mapLayoutVariant(content: string): "MAP_LABELING" | "PLAN_LABELING" | "DIAGRAM_LABELING" {
  if (/label\s+the\s+plan\s+below/i.test(content)) return "PLAN_LABELING";
  if (/label\s+the\s+diagram\s+below/i.test(content)) return "DIAGRAM_LABELING";
  return "MAP_LABELING";
}

/**
 * Canonical layout for IELTS map/plan/diagram labels:
 * `11. Rocks [input]` is one question row. The same row must not also remain
 * as static section text above a detached answer control.
 */
export function normalizeMapLabelPart(
  content: string | undefined,
  questions: QuestionDraft[],
): { content: string | undefined; questions: QuestionDraft[]; changed: boolean } {
  if (!content || !MAP_INSTRUCTION_RE.test(content)) {
    return { content, questions, changed: false };
  }
  const range = mapRange(content);
  if (!range) return { content, questions, changed: false };

  const targets = questions
    .filter((q) => q.number >= range.start && q.number <= range.end)
    .sort((a, b) => a.number - b.number);
  if (!targets.length) return { content, questions, changed: false };

  const labels = new Map<number, string>();
  const remove = new Set<number>();
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!.trim();
    const numbered = line.match(/^(\d{1,2})[.)]?\s+(.+)$/);
    if (!numbered) continue;
    const number = Number(numbered[1]);
    if (number < range.start || number > range.end) continue;
    const label = cleanLabel(numbered[2]!);
    if (!label) continue;
    labels.set(number, label);
    remove.add(i);
  }

  const missing = targets.filter((q) => !labels.has(q.number));
  const unnumbered = lines
    .map((raw, index) => ({ raw: raw.trim(), index }))
    .filter(({ raw, index }) =>
      !remove.has(index) && BLANK_RE.test(raw) && !/^\d{1,2}[.)]?\s+/.test(raw),
    );
  if (unnumbered.length === missing.length) {
    missing.forEach((q, index) => {
      const row = unnumbered[index]!;
      labels.set(q.number, cleanLabel(row.raw));
      remove.add(row.index);
    });
  }

  const variant = mapLayoutVariant(content);
  const nextQuestions = questions.map((q) => {
    if (q.number < range.start || q.number > range.end) return q;
    const storedStem = cleanLabel(String((q.content as { stem?: unknown }).stem ?? ""));
    const label = labels.get(q.number) || storedStem;
    if (!label) return q;
    const rest = { ...(q.content as Record<string, unknown>) };
    delete rest.options;
    return {
      ...q,
      type: "MAP_LABELING" as const,
      content: { ...rest, stem: `${label} _____`, blank: true, variant },
    };
  });

  const changed = remove.size > 0 || nextQuestions.some((q, i) => q !== questions[i]);
  return {
    content: lines.filter((_, index) => !remove.has(index)).join("\n").replace(/\n{3,}/g, "\n\n"),
    questions: nextQuestions,
    changed,
  };
}

export function normalizeTestMapLabelLayouts(draft: ParsedTestDraft): ParsedTestDraft {
  return {
    ...draft,
    parts: draft.parts.map((part) => {
      const normalized = normalizeMapLabelPart(part.content, part.questions);
      return normalized.changed
        ? { ...part, content: normalized.content, questions: normalized.questions }
        : part;
    }),
  };
}