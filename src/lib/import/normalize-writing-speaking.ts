import type { QuestionDraft } from "./schemas";

export type SpeakingPartKind = 1 | 2 | 3;

const QUESTION_LINE = /\?\s*(?:\[[^\]]+\])?\s*$/;
const PART2_BOILERPLATE = [
  /^You should say:\s*$/i,
  /^You will have to talk about the topic for one to two minutes\.?/i,
  /^You have one minute to think about what you are going to say\.?/i,
  /^You can make some notes to help you if you wish\.?/i,
];

function cleanLines(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[•*-]\s+/, "").trim())
    .filter(Boolean);
}

/** Restore the three visible Cambridge GT Task 1 bullets lost by raw-text DOCX extraction. */
export function normalizeGeneralWritingTask(body: string): string {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const lead = lines.findIndex((line) =>
    /\bIn your (?:letter|email)\b/i.test(line.trim()),
  );
  if (lead < 0) return body.trim();

  lines[lead] = lines[lead]!.trim().replace(/\s*:?[\s]*$/, ":");
  const end = lines.findIndex(
    (line, index) => index > lead && /^Write at least 150 words\b/i.test(line.trim()),
  );
  if (end < 0) return lines.join("\n").trim();

  const candidates = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line, index }) => index > lead && index < end && line);
  if (candidates.length < 2 || candidates.length > 5) return lines.join("\n").trim();

  for (const { line, index } of candidates) {
    lines[index] = line.startsWith("•") ? line : `• ${line}`;
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function part1Or3Prompts(
  body: string,
  part: 1 | 3,
): Array<{ stem: string; topic?: string }> {
  const lines = cleanLines(body);
  const prompts: Array<{ stem: string; topic?: string }> = [];
  let topic: string | undefined;

  for (const line of lines) {
    if (
      /^The examiner asks\b/i.test(line) ||
      /^Discussion topics:?$/i.test(line) ||
      /^EXAMPLE$/i.test(line) ||
      /^Example questions:?$/i.test(line)
    ) {
      continue;
    }
    if (QUESTION_LINE.test(line) || /^(?:Tell me|Describe)\b/i.test(line)) {
      prompts.push({ stem: line, topic });
      continue;
    }
    if (line.length <= 80 && !/[.!?]$/.test(line)) topic = line;
  }

  return prompts.map((prompt) => ({ ...prompt, topic: prompt.topic || `Part ${part}` }));
}

export function normalizeSpeakingPart2Stem(stem: string): string {
  const compact = stem.replace(/\r\n/g, "\n").trim();
  if (!compact) return "";

  const pieces = compact
    .replace(/\s*You should say:\s*/i, "; ")
    .split(/\s*;\s*|\n+/)
    .map((line) => line.replace(/^\s*[•*-]\s+/, "").trim())
    .filter(Boolean);
  if (pieces.length < 2) return compact;

  const [title, ...details] = pieces;
  return [
    title,
    "You should say:",
    ...details.map((line) => (/^and explain\b/i.test(line) ? line : `• ${line}`)),
  ].join("\n");
}

function part2Prompt(body: string): string {
  const compact = cleanLines(body)
    .filter((line) => !PART2_BOILERPLATE.some((pattern) => pattern.test(line)))
    .join("; ")
    .replace(/\s*;\s*and explain\b/i, "; and explain")
    .trim();
  return normalizeSpeakingPart2Stem(compact);
}

/** Parse one imported Cambridge Speaking part into individual prompts. */
export function parseSpeakingPartQuestions(
  body: string,
  part: SpeakingPartKind,
): QuestionDraft[] {
  const prompts =
    part === 2
      ? [{ stem: part2Prompt(body), topic: undefined }].filter((item) => item.stem)
      : part1Or3Prompts(body, part);
  return prompts.map((prompt, order) => ({
    number: order + 1,
    order,
    type: "SPEAKING_PROMPT",
    content: {
      stem: prompt.stem,
      ...(prompt.topic ? { topic: prompt.topic } : {}),
      speakingPart: part,
      variant: `SPEAKING_PART_${part}`,
    },
  }));
}
