/**
 * Layout contract (docs/QUESTION-LAYOUT-SPEC.md §1.8) checked on server-rendered HTML:
 * - everything before the ANSWERS pane is read-only (no input / select / textarea);
 * - the ANSWERS pane has exactly one control per question number;
 * - choice questions (TFNG, MCQ, matching) and single-letter keys answer with a
 *   dropdown; word keys (e.g. diagram labels) answer with a text box.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../../src/i18n/provider";
import vi from "../../src/i18n/messages/vi.json";
import {
  listeningFigureAnswerLabel,
  ReadingOrNotesSplit,
  type Part,
} from "../../src/components/practice/question-workspace";
import { toPublicQuestion } from "../../src/lib/practice/public-question";

const CHOICE_TYPES = new Set(["TRUE_FALSE_NG", "MULTIPLE_CHOICE", "MATCHING"]);

type RawPart = {
  title: string;
  order: number;
  content?: string | null;
  meta?: unknown;
  questions: { number: number; type: string; content?: unknown; mediaUrl?: string | null }[];
};

export type AnswerKeys = Map<number, unknown>;

const isLetterKey = (key: unknown) => typeof key === "string" && /^[A-Z]$/.test(key.trim());
const isWordKey = (key: unknown) =>
  typeof key === "string" && /[a-z]{2,}/i.test(key) && !/^(true|false|not given|yes|no)$/i.test(key.trim());

export function toSessionPart(raw: RawPart): Part {
  return {
    title: raw.title,
    order: raw.order,
    content: raw.content ?? undefined,
    meta: (raw.meta ?? undefined) as Part["meta"],
    questions: raw.questions.map((q) => toPublicQuestion(q)),
  };
}

export function renderWorkspace(part: Part, skill: "LISTENING" | "READING"): string {
  return renderToStaticMarkup(
    <I18nProvider locale="vi" messages={vi}>
      <ReadingOrNotesSplit
        part={part}
        isReading={skill === "READING"}
        skill={skill}
        answers={{}}
        currentNumber={null}
        questionRefs={{ current: new Map() }}
        onFocusQuestion={() => undefined}
        onChange={() => undefined}
        onPatchAnswers={() => undefined}
      />
    </I18nProvider>,
  );
}

/** Prompt pane as plain text, one rendered line per row. */
export function promptPaneText(html: string): string {
  const marker = html.indexOf('data-pane="answers"');
  return html
    .slice(0, marker < 0 ? html.length : html.lastIndexOf("<", marker))
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|\/td|\/th)\b[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
}

export function checkPartContract(
  part: Part,
  skill: "LISTENING" | "READING",
  keys: AnswerKeys = new Map(),
): string[] {
  const problems: string[] = [];
  const html = renderWorkspace(part, skill);
  const marker = html.indexOf('data-pane="answers"');
  if (marker < 0) return ["no ANSWERS pane"];

  const prompt = html.slice(0, html.lastIndexOf("<", marker));
  const answers = html.slice(marker);

  const promptControls = [...prompt.matchAll(/<(input|select|textarea)\b[^>]*>/g)];
  if (promptControls.length > 0) {
    const numbers = promptControls.map((m) => /data-q="(\d+)"/.exec(m[0])?.[1] ?? "?");
    problems.push(`prompt pane has ${promptControls.length} control(s): ${[...new Set(numbers)].join(",")}`);
  }

  const controls = new Map<number, string[]>();
  for (const m of answers.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const n = Number(/data-q="(\d+)"/.exec(m[0])?.[1]);
    if (!Number.isFinite(n)) {
      problems.push(`ANSWERS control without data-q: ${m[0].slice(0, 80)}`);
      continue;
    }
    controls.set(n, [...(controls.get(n) ?? []), m[1]!]);
  }

  for (const q of part.questions) {
    const found = controls.get(q.number) ?? [];
    if (found.length !== 1) {
      problems.push(`Q${q.number}: ${found.length} ANSWERS control(s)`);
      continue;
    }
    const key = keys.get(q.number);
    if ((CHOICE_TYPES.has(q.type) || isLetterKey(key)) && found[0] !== "select") {
      problems.push(`Q${q.number} ${q.type}: answers with <${found[0]}>, expected a dropdown (key ${JSON.stringify(key)})`);
    }
    if (found[0] === "select" && !CHOICE_TYPES.has(q.type) && isWordKey(key)) {
      problems.push(`Q${q.number} ${q.type}: word key ${JSON.stringify(key)} but answers with a dropdown`);
    }
  }
  const promptLines = promptPaneText(html).split("\n");
  for (const q of part.questions) {
    if ((q.content.options?.length ?? 0) >= 2 || q.content.pairedFrom != null) continue;
    if (listeningFigureAnswerLabel(q, skill)) continue;
    const shown = new RegExp(`(?:^|\\D)${q.number}(?!\\d)`);
    if (!promptLines.some((line) => shown.test(line))) {
      problems.push(`Q${q.number} ${q.type}: question number never shown in the prompt pane`);
    }
  }
  const expected = new Set(part.questions.map((q) => q.number));
  for (const n of controls.keys()) {
    if (!expected.has(n)) problems.push(`ANSWERS has unknown question ${n}`);
  }
  return problems;
}
