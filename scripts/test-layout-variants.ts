import assert from "node:assert/strict";
import {
  applyQuestionLayoutVariants,
  validateQuestionLayouts,
} from "../src/lib/questions/layout-variants";
import type { ParsedTestDraft } from "../src/lib/import/schemas";

function draft(overrides: Partial<ParsedTestDraft> = {}): ParsedTestDraft {
  return {
    title: "Cambridge 15 General Test 1 Writing",
    slug: "cambridge-15-general-test-1-writing",
    skill: "WRITING",
    examType: "GENERAL",
    timeLimitMinutes: 60,
    parts: [
      {
        title: "Writing Task 1",
        order: 0,
        content: "Write a letter to the manager. Write at least 150 words.",
        questions: [
          {
            number: 1,
            order: 0,
            type: "ESSAY",
            content: { stem: "Write a letter to the manager.", minWords: 150 },
          },
        ],
      },
    ],
    ...overrides,
  };
}

const normalized = applyQuestionLayoutVariants(draft());
assert.equal(
  normalized.parts[0]?.questions[0]?.content.variant,
  "WRITING_GENERAL_LETTER",
);
assert.deepEqual(validateQuestionLayouts(normalized), []);

const matching = draft({
  title: "Reading",
  slug: "reading",
  skill: "READING",
  parts: [
    {
      title: "Questions 1-2 Matching sentence endings",
      order: 0,
      content: "Complete each sentence with the correct ending.",
      questions: [
        {
          number: 1,
          order: 0,
          type: "MATCHING",
          content: {
            stem: "The project was successful because",
            options: [
              { label: "A", text: "it received local support." },
              { label: "B", text: "it used less equipment." },
            ],
          },
          correctAnswer: "A",
        },
      ],
    },
  ],
});
const matchingNormalized = applyQuestionLayoutVariants(matching);
assert.equal(
  matchingNormalized.parts[0]?.questions[0]?.content.variant,
  "MATCHING_SENTENCE_ENDINGS",
);
assert.deepEqual(validateQuestionLayouts(matchingNormalized), []);

const invalid = applyQuestionLayoutVariants({
  ...matching,
  parts: [
    {
      ...matching.parts[0]!,
      questions: [
        {
          ...matching.parts[0]!.questions[0]!,
          content: { stem: "Choose TWO", selectCount: 2, covers: [1] },
          type: "MULTIPLE_CHOICE",
        },
      ],
    },
  ],
});
const codes = validateQuestionLayouts(invalid).map((issue) => issue.code);
assert.ok(codes.includes("OPTIONS_REQUIRED"));
assert.ok(codes.includes("INVALID_MULTI_SELECT_COVERS"));

console.log("layout variants: all assertions passed");