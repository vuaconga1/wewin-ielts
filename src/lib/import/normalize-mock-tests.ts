import type {
  ParsedTestDraft,
  PartDraft,
  QuestionDraft,
} from "./schemas";
import { normalizeGeneralWritingTask } from "./normalize-writing-speaking";
import type { QuestionLayoutVariant } from "../questions/layout-variants";

export const PUBLISHED_MOCK_SLUGS = [
  "general-listening-mocktest-1",
  "general-reading-grade-8",
  "general-reading-mocktest-1",
  "general-writing-mocktest-1",
] as const;

type PublishedMockSlug = (typeof PUBLISHED_MOCK_SLUGS)[number];

function variantFor(
  slug: PublishedMockSlug,
  number: number,
): QuestionLayoutVariant {
  if (slug === "general-listening-mocktest-1") {
    if (number <= 7) return "TABLE_COMPLETION";
    if (number <= 10) return "NOTE_COMPLETION";
    return "FORM_COMPLETION";
  }
  if (slug === "general-reading-mocktest-1") {
    if (number <= 6) return "MATCHING_INFORMATION";
    if (number <= 10) return "SINGLE_CHOICE";
    return "SENTENCE_COMPLETION";
  }
  if (slug === "general-reading-grade-8") {
    if (number <= 5) return "SHORT_ANSWER";
    if (number <= 10) return "SINGLE_CHOICE";
    if (number <= 15) return "MATCHING_INFORMATION";
    if (number <= 20) return "SENTENCE_COMPLETION";
    if (number <= 25) return "TRUE_FALSE_NOT_GIVEN";
    return "SINGLE_CHOICE";
  }
  return "WRITING_GENERAL_LETTER";
}

function passageBefore(content: string, header: RegExp): string {
  const match = header.exec(content);
  return (match ? content.slice(0, match.index) : content).trim();
}

function normalizeListeningPart(part: PartDraft): PartDraft {
  const content = (part.content ?? "")
    .replace(/<br\s*\/?>/gi, ": ")
    .replace(/(\d{1,2})\s+_{3,}/g, "$1 ...............")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    ...part,
    title: `Section ${part.order + 1}`,
    content,
  };
}

function normalizeCastleReadingPart(part: PartDraft): PartDraft {
  const raw = part.content ?? "";
  const taskMatches = [...raw.matchAll(/^Questions 1[–-]6\s*$/gim)];
  const taskAt = taskMatches.at(-1)?.index ?? -1;
  const passage = (taskAt >= 0 ? raw.slice(0, taskAt) : raw)
    .replace(/\[\[section\]\]\s*Questions?\s+\d+(?:\s*[–-]\s*\d+|\s+and\s+\d+)\s*\[\[\/section\]\]\s*/gi, "")
    .replace(/\[\[price\]\]([\s\S]*?)\[\[\/price\]\]/gi, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const tasks = `Questions 1–6

Choose the hall (A–E) that best meets each student's requirements. A hall may be used more than once.

Questions 7–10

Choose the correct letter, A, B, C or D.

Questions 11 and 12

Complete the statements below.

Write NO MORE THAN THREE WORDS for each answer.

Nobody can tell when you have sprayed Quick Kill because it is 11 ............... .
The price for Quick Kill includes a 12 ............... .`;
  return {
    ...part,
    title: "Section 1",
    content: `${passage}\n\n${tasks}`,
  };
}

function normalizeGrade8Part(part: PartDraft): PartDraft {
  const raw = part.content ?? "";
  if (part.order === 0) {
    const passage = passageBefore(raw, /^Questions?\s+1\s*[–-]\s*5\b/im);
    return {
      ...part,
      title: "Section 1",
      content: `${passage}

Questions 1–5

Answer the questions below.

Choose NO MORE THAN THREE WORDS from the text for each answer.

Questions 6–10

Choose the correct letter, A, B, C or D.`,
    };
  }
  if (part.order === 1) {
    const passage = passageBefore(raw, /^Questions?\s+11\s*[–-]\s*15\b/im);
    return {
      ...part,
      title: "Section 2",
      content: `${passage}

Questions 11–15

Match each statement with the correct cuisine type, A–D.

Cuisine types

A  Italian Cuisine
B  Asian Cuisine
C  Western Cuisine
D  Indian Cuisine

Questions 16–20

Complete the sentences below.

Choose NO MORE THAN TWO WORDS from the text for each answer.

Meat lovers can visit a smart steakhouse which serves delicious dishes made of both 16 ............... and lamb.
In many Asian countries, people traditionally enjoy their meals accompanied by a side of 17 ............... .
A morning meal in Western traditions often consists of warm toast with butter or a simple bowl of 18 ............... .
Some people categorize burgers and chips as 19 ............... due to the fact that they are unhealthy.
Cooks preparing an Indian curry often mix flour with milk or 20 ............... to create a thick sauce.`,
    };
  }
  const passage = passageBefore(raw, /^Questions?\s+21\s*[–-]\s*25\b/im);
  return {
    ...part,
    title: "Section 3",
    content: `${passage}

Questions 21–25

Do the following statements agree with the information given in the text?

In boxes 21–25 on your answer sheet, write

TRUE if the statement agrees with the information
FALSE if the statement contradicts the information
NOT GIVEN if there is no information on this

Questions 26–30

Choose the correct letter, A, B or C.`,
  };
}

function normalizeWritingPart(part: PartDraft): PartDraft {
  const content = normalizeGeneralWritingTask(part.content ?? "");
  return {
    ...part,
    title: "Task 1",
    content,
    questions: part.questions.map((question) => ({
      ...question,
      content: {
        ...question.content,
        stem: normalizeGeneralWritingTask(
          typeof question.content.stem === "string"
            ? question.content.stem
            : content,
        ),
      },
    })),
  };
}

function normalizeQuestion(
  slug: PublishedMockSlug,
  question: QuestionDraft,
): QuestionDraft {
  const variant = variantFor(slug, question.number);
  return {
    ...question,
    type:
      slug === "general-listening-mocktest-1" && question.number <= 7
        ? "TABLE_COMPLETION"
        : question.type,
    content: { ...question.content, variant },
  };
}

/** Canonicalize the four published partial mock papers without inventing missing tasks. */
export function normalizePublishedMockDraft(
  draft: ParsedTestDraft,
): ParsedTestDraft {
  if (!PUBLISHED_MOCK_SLUGS.includes(draft.slug as PublishedMockSlug)) {
    return draft;
  }
  const slug = draft.slug as PublishedMockSlug;
  return {
    ...draft,
    parts: draft.parts.map((rawPart) => {
      const part =
        slug === "general-listening-mocktest-1"
          ? normalizeListeningPart(rawPart)
          : slug === "general-reading-mocktest-1"
            ? normalizeCastleReadingPart(rawPart)
            : slug === "general-reading-grade-8"
              ? normalizeGrade8Part(rawPart)
              : normalizeWritingPart(rawPart);
      return {
        ...part,
        questions: part.questions.map((question) =>
          normalizeQuestion(slug, question),
        ),
      };
    }),
  };
}
