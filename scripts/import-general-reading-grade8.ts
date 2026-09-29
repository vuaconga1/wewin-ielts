/**
 * Import the grade-8 Castle & Environment reading paper as General Training.
 * The source docx has no separate key file; answers are taken from the passages.
 *
 *   npx tsx scripts/import-general-reading-grade8.ts
 */

import path from "node:path";
import { parseTestFromFiles } from "../src/lib/import/pipeline";
import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";

const FILE = path.resolve(
  "e:/Wewin/Wewin-Education-main/anh_wewin/flyer/unit 7/Castle & Environment/Reading (for 8th grade and below) .docx",
);

const CUISINE = [
  { label: "A", text: "Italian Cuisine" },
  { label: "B", text: "Asian Cuisine" },
  { label: "C", text: "Western Cuisine" },
  { label: "D", text: "Indian Cuisine" },
];

function question(
  number: number,
  order: number,
  type: QuestionDraft["type"],
  content: Record<string, unknown>,
  correctAnswer: string,
  acceptableAnswers?: string[],
): QuestionDraft {
  return {
    number,
    order,
    type,
    content,
    correctAnswer,
    acceptableAnswers,
  };
}

function short(
  number: number,
  order: number,
  stem: string,
  correctAnswer: string,
  acceptableAnswers: string[],
): QuestionDraft {
  return question(
    number,
    order,
    "SHORT_ANSWER",
    { stem },
    correctAnswer,
    acceptableAnswers,
  );
}

function moveBlankNextToNumber(content: string, numbers: number[]): string {
  let next = content;
  for (const n of numbers) {
    const re = new RegExp(
      `^${n}\\.?\\s+(.+?)\\s+((?:[.…_…]|\\.){2,}|_{2,})`,
      "m",
    );
    next = next.replace(re, `$1 ${n} $2`);
  }
  return next.replace(
    /^\s*Answer:\s*(?:(?:[.…_…]|\.){2,}|_{2,})\s*$/gim,
    "",
  );
}

async function main() {
  const { draft, issues } = await parseTestFromFiles({
    contentPath: FILE,
    skill: "READING",
    title: "IELTS General Training — Reading",
    slug: "general-reading-grade-8",
    sourceFolder: path.dirname(FILE),
    examType: "GENERAL",
    timeLimitMinutes: 60,
    tags: ["#IELTS General", "#Reading"],
  });
  if (!draft) {
    console.error(issues);
    throw new Error("Parse failed");
  }

  const byNumber = new Map<number, QuestionDraft>();
  for (const part of draft.parts) {
    for (const q of part.questions) byNumber.set(q.number, q);
  }

  const passage1 = draft.parts.find((part) => part.order === 0);
  const passage2 = draft.parts.find((part) => part.order === 1);
  const passage3 = draft.parts.find((part) => part.order === 2);
  if (!passage1 || !passage2 || !passage3) throw new Error("Missing passages");

  passage1.content = moveBlankNextToNumber(passage1.content ?? "", []);
  passage1.questions = [
    short(
      1,
      0,
      "What traditional structure inspired engineers to design a modern, magnificent ice hotel?",
      "the traditional igloo",
      ["the traditional igloo", "traditional igloo", "igloo", "an igloo"],
    ),
    short(
      2,
      1,
      "What did historical builders in tropical regions want to stay safe from besides water?",
      "animals",
      ["animals", "animal"],
    ),
    short(
      3,
      2,
      "What material did the architect of Habitat 67 stack to change the look of a traditional house?",
      "concrete blocks",
      ["concrete blocks", "concrete block", "blocks of concrete"],
    ),
    short(
      4,
      3,
      "What three adjectives describe modern city centers that force architects to try new ideas?",
      "busy, crowded, polluted",
      [
        "busy, crowded, polluted",
        "busy, crowded and polluted",
        "busy crowded and polluted",
        "busy, crowded, and polluted",
      ],
    ),
    short(
      5,
      4,
      "What object can be expanded and recycled into trendy guest houses today?",
      "shipping containers",
      [
        "shipping containers",
        "shipping container",
        "old shipping containers",
        "shipping container homes",
        "old shipping container homes",
      ],
    ),
    ...([6, 7, 8, 9, 10] as const).map((number, index) => {
      const parsed = byNumber.get(number);
      if (!parsed) throw new Error(`Missing Q${number}`);
      const answers = ["C", "B", "C", "C", "A"];
      return {
        ...parsed,
        order: 5 + index,
        correctAnswer: answers[index],
      };
    }),
  ];

  const matching: [number, string, string][] = [
    [
      11,
      "Chefs frequently include aromatic ingredients like ginger and garlic to cook these dishes.",
      "B",
    ],
    [
      12,
      "This culinary tradition often features standard main meals like a burger and chips.",
      "C",
    ],
    [
      13,
      "Dairy products like thick yoghurt or flour are combined to prepare a rich sauce.",
      "D",
    ],
    [
      14,
      "This specific food option is described as being fashionable and found next to busy fast-food eateries.",
      "A",
    ],
    [
      15,
      "Meals in this region are often served with a side of white rice and can be made very spicy using chillies.",
      "B",
    ],
  ];

  passage2.content = moveBlankNextToNumber(passage2.content ?? "", [16, 17, 18, 19, 20])
    .replace(
      /Match each description or statement \(\s*Questions 1[–-]5\)/,
      "Match each description or statement (Questions 11–15)",
    );
  passage2.questions = [
    ...matching.map(([number, stem, answer], index) =>
      question(number, index, "MATCHING", { stem, options: CUISINE }, answer),
    ),
    ...[16, 17, 18, 19, 20].map((number, index) =>
      question(number, 5 + index, "GAP_FILL", { stem: "", blank: true }, ""),
    ),
  ];

  const gapAnswers: Record<number, [string, string[]]> = {
    16: ["beef", ["beef"]],
    17: ["white rice", ["white rice", "rice"]],
    18: ["cereal", ["cereal"]],
    19: ["junk food", ["junk food", '"junk food"']],
    20: ["yoghurt", ["yoghurt", "yogurt"]],
  };
  for (const q of passage2.questions) {
    const gap = gapAnswers[q.number];
    if (!gap) continue;
    q.correctAnswer = gap[0];
    q.acceptableAnswers = gap[1];
  }

  const passage3Answers: Record<number, string> = {
    21: "FALSE",
    22: "TRUE",
    23: "FALSE",
    24: "FALSE",
    25: "NOT GIVEN",
    26: "B",
    27: "C",
    28: "A",
    29: "C",
    30: "B",
  };
  for (const q of passage3.questions) {
    const answer = passage3Answers[q.number];
    if (!answer) throw new Error(`Unexpected passage 3 question ${q.number}`);
    q.correctAnswer = answer;
  }

  const numbers = draft.parts.flatMap((part) => part.questions.map((q) => q.number));
  const expected = Array.from({ length: 30 }, (_, i) => i + 1);
  const missing = expected.filter((n) => !numbers.includes(n));
  if (missing.length) throw new Error(`Missing questions: ${missing.join(", ")}`);

  const unanswered = draft.parts
    .flatMap((part) => part.questions)
    .filter((q) => q.correctAnswer == null || q.correctAnswer === "")
    .map((q) => q.number);
  if (unanswered.length) throw new Error(`Missing answers: ${unanswered.join(", ")}`);

  const { saveTestDraft } = await import("../src/lib/store/test-store");
  const { persistParsedTest } = await import("../src/lib/import/persist");
  await saveTestDraft(draft);
  const result = await persistParsedTest(draft, [], { status: "PUBLISHED" });
  console.log(`saved ${draft.slug} testId=${result.testId} questions=${numbers.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
