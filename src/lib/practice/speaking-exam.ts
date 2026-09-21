/**
 * Speaking CBT exam helpers: detect Part 1/2/3, timing, and expand messy
 * imported packs (content dump + empty stems) into one-question-at-a-time items.
 */

export type SpeakingPartKind = 1 | 2 | 3;

export type SpeakingTiming = {
  prepSec: number;
  answerSec: number;
  allowNotes: boolean;
};

/** Official-style CBT timing (practice approximation). */
export const SPEAKING_TIMING: Record<SpeakingPartKind, SpeakingTiming> = {
  1: { prepSec: 10, answerSec: 45, allowNotes: false },
  2: { prepSec: 60, answerSec: 120, allowNotes: true },
  3: { prepSec: 10, answerSec: 45, allowNotes: false },
};

export type SpeakingExamItem = {
  /** Answer key (stringified number after global renumber). */
  number: number;
  partKind: SpeakingPartKind;
  /** Pack index in the original test parts array. */
  packIndex: number;
  packTitle: string;
  topic?: string;
  stem: string;
};

type RawQuestion = {
  number: number;
  type: string;
  content: {
    stem?: string;
    hint?: string;
    blank?: boolean;
    speakingPart?: SpeakingPartKind;
    topic?: string;
  };
};

type RawPart = {
  title: string;
  order: number;
  content?: string;
  meta?: Record<string, unknown>;
  questions: RawQuestion[];
};

const PART_KIND_RE = /\b(?:part|phần|p)\s*([123])\b/i;
const PART_SPLIT_RE = /\bPART\s*([123])\b/gi;
const TRAILING_JUNK_RE =
  /\n\s*(?:Tab\s+\d+|SPEAKING\s*\n\s*Duration:|Chưa paraphrase|simple criteria)[\s\S]*$/i;
const PART2_BOILERPLATE_RE =
  /You will have to talk about the topic for one to two minutes\.?\s*/gi;
const PART2_PREP_HINT_RE =
  /You have one minute to think about what you are going to say\.?\s*You can make some notes to help you if you wish\.?\s*/gi;
const DISCUSSION_TOPICS_RE = /^Discussion topics:\s*/im;

export function detectSpeakingPartKind(
  title: string,
  fallback: SpeakingPartKind = 1,
): SpeakingPartKind {
  const m = PART_KIND_RE.exec(title);
  if (m) {
    const n = Number(m[1]);
    if (n === 1 || n === 2 || n === 3) return n;
  }
  if (/cue\s*card|long\s*turn/i.test(title)) return 2;
  if (/discussion/i.test(title)) return 3;
  return fallback;
}

export function speakingTimingFor(kind: SpeakingPartKind): SpeakingTiming {
  return SPEAKING_TIMING[kind];
}

/** Persistable answer mark (API stores strings only). */
export function speakingAnswerMark(meta?: {
  durationSec?: number;
  partKind?: SpeakingPartKind;
}): string {
  const durationSec = meta?.durationSec;
  const partKind = meta?.partKind;
  if (durationSec != null && Number.isFinite(durationSec)) {
    return JSON.stringify({
      status: "recorded",
      durationSec: Math.max(0, Math.round(durationSec)),
      ...(partKind ? { partKind } : {}),
    });
  }
  return "recorded";
}

export type SpeakingAnswerMark = {
  status: "recorded";
  durationSec?: number;
  partKind?: SpeakingPartKind;
};

/** Parse a persisted Speaking answer string (JSON mark or legacy plain text). */
export function parseSpeakingAnswerMark(
  value: string | undefined | null,
): SpeakingAnswerMark | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (v === "recorded" || /^đã luyện$/i.test(v) || /^practiced$/i.test(v)) {
    return { status: "recorded" };
  }
  try {
    const parsed = JSON.parse(v) as {
      status?: string;
      durationSec?: unknown;
      partKind?: unknown;
    };
    if (parsed?.status !== "recorded") return null;
    const durationSec =
      typeof parsed.durationSec === "number" && Number.isFinite(parsed.durationSec)
        ? Math.max(0, Math.round(parsed.durationSec))
        : undefined;
    const pk = parsed.partKind;
    const partKind =
      pk === 1 || pk === 2 || pk === 3 ? (pk as SpeakingPartKind) : undefined;
    return { status: "recorded", durationSec, partKind };
  } catch {
    return null;
  }
}

export function isSpeakingAnswered(value: string | undefined | null): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;
  if (parseSpeakingAnswerMark(v)) return true;
  return v.length > 0;
}

function stripTrailingJunk(text: string): string {
  return text.replace(TRAILING_JUNK_RE, "").trim();
}

function splitByIeltsParts(content: string): {
  part1: string;
  part2: string;
  part3: string;
} {
  const cleaned = stripTrailingJunk(content);
  const matches = [...cleaned.matchAll(PART_SPLIT_RE)];
  if (matches.length === 0) {
    return { part1: cleaned, part2: "", part3: "" };
  }

  const slices: { kind: SpeakingPartKind; start: number; bodyStart: number }[] =
    matches.map((m) => ({
      kind: Number(m[1]) as SpeakingPartKind,
      start: m.index ?? 0,
      bodyStart: (m.index ?? 0) + m[0].length,
    }));

  const first = slices[0]!;
  const before = cleaned.slice(0, first.start).trim();

  let part1 = "";
  let part2 = "";
  let part3 = "";

  for (let i = 0; i < slices.length; i++) {
    const cur = slices[i]!;
    const end = i + 1 < slices.length ? slices[i + 1]!.start : cleaned.length;
    const body = cleaned.slice(cur.bodyStart, end).trim();
    if (cur.kind === 1) part1 = body;
    else if (cur.kind === 2) part2 = body;
    else part3 = body;
  }

  // Content before the first PART N marker is usually Part 1 topics.
  if (before) {
    part1 = part1 ? `${before}\n\n${part1}` : before;
  }

  return { part1, part2, part3 };
}

function isLikelyQuestionLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 8) return false;
  if (/^PART\s*[123]\b/i.test(t)) return false;
  if (/^Discussion topics:/i.test(t)) return false;
  if (/^You (will|have|should|can)\b/i.test(t)) return false;
  if (/^Describe\b/i.test(t)) return true;
  if (/\?\s*(?:\[[^\]]+\])?\s*$/.test(t)) return true;
  if (/\?\s*$/.test(t)) return true;
  return false;
}

function isLikelyTopicHeader(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 60) return false;
  if (isLikelyQuestionLine(t)) return false;
  if (/^PART\s*[123]\b/i.test(t)) return false;
  if (/^Discussion topics:/i.test(t)) return false;
  if (/^You (will|have|should|can)\b/i.test(t)) return false;
  if (/^Examiner:|^Candidate:|^Script:|^Duration:/i.test(t)) return false;
  // Topic labels: "Art/drawing", "News", "Food"
  return !/[.!?]$/.test(t);
}

function extractPart1Or3Prompts(
  section: string,
): { topic?: string; stem: string }[] {
  const text = section.replace(DISCUSSION_TOPICS_RE, "").trim();
  if (!text) return [];

  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-•*]+\s*/, "").trim())
    .filter(Boolean);

  const out: { topic?: string; stem: string }[] = [];
  let topic: string | undefined;

  for (const line of lines) {
    if (isLikelyTopicHeader(line)) {
      topic = line;
      continue;
    }
    if (isLikelyQuestionLine(line)) {
      out.push({ topic, stem: line });
      continue;
    }
    // Multi-line continuation of previous question (rare)
    if (out.length > 0 && !isLikelyTopicHeader(line) && line.length > 20) {
      const last = out[out.length - 1]!;
      if (!/\?/.test(last.stem) && /\?/.test(line)) {
        last.stem = `${last.stem} ${line}`.trim();
      }
    }
  }

  return out;
}

function extractPart2Cue(section: string): string {
  let body = section
    .replace(PART2_BOILERPLATE_RE, "")
    .replace(PART2_PREP_HINT_RE, "")
    .replace(DISCUSSION_TOPICS_RE, "")
    .trim();
  // Drop examiner script fragments if they leaked in
  body = body.replace(/\n\s*Examiner:[\s\S]*$/i, "").trim();
  return body;
}

function questionsHaveUsableStems(questions: RawQuestion[]): boolean {
  const withStem = questions.filter((q) => (q.content.stem ?? "").trim());
  return withStem.length > 0 && withStem.length >= Math.ceil(questions.length / 2);
}

function itemsFromStructuredPart(
  part: RawPart,
  packIndex: number,
): SpeakingExamItem[] {
  const kind = detectSpeakingPartKind(part.title, 1);
  return part.questions
    .filter((q) => (q.content.stem ?? "").trim() || q.type === "SPEAKING_PROMPT")
    .map((q) => {
      const stem =
        (q.content.stem ?? "").trim() ||
        (part.content ?? "").trim() ||
        "";
      const itemKind =
        q.content.speakingPart ??
        detectSpeakingPartKind(part.title, kind);
      return {
        number: q.number,
        partKind: itemKind,
        packIndex,
        packTitle: part.title?.trim() || `Pack ${packIndex + 1}`,
        topic: q.content.topic,
        stem,
      } satisfies SpeakingExamItem;
    })
    .filter((item) => item.stem.length > 0);
}

function itemsFromContentPack(
  part: RawPart,
  packIndex: number,
): SpeakingExamItem[] {
  const content = (part.content ?? "").trim();
  if (!content) return [];

  const { part1, part2, part3 } = splitByIeltsParts(content);
  const packTitle = part.title?.trim() || `Pack ${packIndex + 1}`;
  const items: SpeakingExamItem[] = [];
  let n = 0;

  for (const prompt of extractPart1Or3Prompts(part1)) {
    n += 1;
    items.push({
      number: n,
      partKind: 1,
      packIndex,
      packTitle,
      topic: prompt.topic,
      stem: prompt.stem,
    });
  }

  const cue = extractPart2Cue(part2);
  if (cue) {
    n += 1;
    items.push({
      number: n,
      partKind: 2,
      packIndex,
      packTitle,
      stem: cue,
    });
  }

  for (const prompt of extractPart1Or3Prompts(part3)) {
    n += 1;
    items.push({
      number: n,
      partKind: 3,
      packIndex,
      packTitle,
      topic: prompt.topic,
      stem: prompt.stem,
    });
  }

  return items;
}

/**
 * Build a linear exam queue for a Speaking attempt.
 * Prefer real question stems; otherwise parse Part 1/2/3 from part.content.
 * Numbers are reassigned globally 1..N for answer persistence.
 */
export function buildSpeakingExamQueue(parts: RawPart[]): SpeakingExamItem[] {
  const collected: SpeakingExamItem[] = [];

  parts.forEach((part, packIndex) => {
    if (questionsHaveUsableStems(part.questions)) {
      collected.push(...itemsFromStructuredPart(part, packIndex));
      return;
    }
    const fromContent = itemsFromContentPack(part, packIndex);
    if (fromContent.length > 0) {
      collected.push(...fromContent);
      return;
    }
    // Last resort: one item per question using part content as stem
    const fallbackStem = (part.content ?? "").trim();
    part.questions.forEach((q, i) => {
      const stem = (q.content.stem ?? "").trim() || fallbackStem;
      if (!stem) return;
      collected.push({
        number: i + 1,
        partKind: detectSpeakingPartKind(part.title, 1),
        packIndex,
        packTitle: part.title?.trim() || `Pack ${packIndex + 1}`,
        stem,
      });
    });
  });

  return collected.map((item, i) => ({ ...item, number: i + 1 }));
}

/** Expand Speaking parts into one question per exam prompt (for session state). */
export function expandSpeakingPartsForSession<T extends RawPart>(
  parts: T[],
): T[] {
  const queue = buildSpeakingExamQueue(parts);
  if (queue.length === 0) return parts;

  const byPack = new Map<number, SpeakingExamItem[]>();
  for (const item of queue) {
    const list = byPack.get(item.packIndex) ?? [];
    list.push(item);
    byPack.set(item.packIndex, list);
  }

  const expanded: T[] = [];
  for (const [packIndex, items] of byPack) {
    const source = parts[packIndex];
    if (!source) continue;

    // Split pack into Part 1 / 2 / 3 sub-parts for clearer chrome.
    for (const kind of [1, 2, 3] as SpeakingPartKind[]) {
      const kindItems = items.filter((it) => it.partKind === kind);
      if (kindItems.length === 0) continue;
      expanded.push({
        ...source,
        title: `Part ${kind}`,
        order: expanded.length,
        content: undefined,
        questions: kindItems.map((it, order) => ({
          number: it.number,
          order,
          type: "SPEAKING_PROMPT",
          content: {
            stem: it.stem,
            topic: it.topic,
            speakingPart: it.partKind,
          },
        })),
      } as T);
    }
  }

  return expanded.length > 0 ? expanded : parts;
}

export function parseSpeakingPartKinds(
  values?: number[] | null,
): SpeakingPartKind[] | null {
  if (!values?.length) return null;
  const kinds = [...new Set(values)].filter(
    (n): n is SpeakingPartKind => n === 1 || n === 2 || n === 3,
  );
  kinds.sort((a, b) => a - b);
  return kinds.length ? kinds : null;
}

export function countSpeakingItemsByPart(
  queue: SpeakingExamItem[],
): Record<SpeakingPartKind, number> {
  return {
    1: queue.filter((it) => it.partKind === 1).length,
    2: queue.filter((it) => it.partKind === 2).length,
    3: queue.filter((it) => it.partKind === 3).length,
  };
}

/** Load all imported packs when the attempt selected IELTS Part 1/2/3. */
export function partsForSpeakingAttempt<T extends { order: number }>(
  allParts: T[],
  attempt: { sectionOrders: number[]; speakingPartKinds?: number[] | null },
): T[] {
  if (parseSpeakingPartKinds(attempt.speakingPartKinds)) return allParts;
  return allParts.filter((p) => attempt.sectionOrders.includes(p.order));
}

export function filterSpeakingExamQueue(
  queue: SpeakingExamItem[],
  kinds?: SpeakingPartKind[] | null,
): SpeakingExamItem[] {
  const allowed = kinds && kinds.length > 0 ? new Set(kinds) : null;
  const filtered = allowed
    ? queue.filter((it) => allowed.has(it.partKind))
    : queue;
  return filtered.map((item, i) => ({ ...item, number: i + 1 }));
}
