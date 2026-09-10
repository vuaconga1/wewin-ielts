/**
 * Unit-style assertions for notes/gap blank extraction.
 *
 * Run:
 *   npx tsx scripts/test-gap-stems.ts
 */

import { parseQuestionsFromPartBody } from "../src/lib/import/parse-questions";
import {
  INLINE_GAP_STEM,
  looksLikeRedundantGapStem,
  partHasNumberedBlanks,
  sanitizePartGapStems,
} from "../src/lib/questions/gap-stems";
import type { QuestionDraft } from "../src/lib/import/schemas";

const NOTES_1_TO_5 = `
SECTION 1
Questions 1–5
Complete the notes below.
Write ONE WORD ONLY for each answer.

Animal Conservation
Reasons for declining numbers:
- Habitat 1 .................
- Climate 2 .................
- Hunting and 3 .................
Solutions:
- Create more 4 .................
- Educate the 5 .................
`.trim();

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  assert(partHasNumberedBlanks(NOTES_1_TO_5), "fixture should have numbered blanks");

  const qs = parseQuestionsFromPartBody(NOTES_1_TO_5);
  assert(qs.length === 5, `expected 5 questions, got ${qs.length}`);
  assert(
    qs.map((q) => q.number).join(",") === "1,2,3,4,5",
    `expected numbers 1–5, got ${qs.map((q) => q.number).join(",")}`,
  );

  for (const q of qs) {
    const stem = String((q.content as { stem?: string }).stem ?? "");
    assert(
      stem === INLINE_GAP_STEM || stem.length <= 16,
      `Q${q.number} stem should be empty/short, got: ${JSON.stringify(stem)}`,
    );
    assert(
      !looksLikeRedundantGapStem(stem),
      `Q${q.number} stem looks like a sliding window: ${JSON.stringify(stem)}`,
    );
    assert(
      !/^[a-z]/.test(stem.trim()),
      `Q${q.number} must not start mid-word: ${JSON.stringify(stem)}`,
    );
    assert(
      (q.content as { blank?: boolean }).blank === true,
      `Q${q.number} should set blank: true`,
    );
    assert(q.type === "GAP_FILL", `Q${q.number} expected GAP_FILL, got ${q.type}`);
  }

  // Sanitize should clear legacy window stems without touching answers
  const dirty: QuestionDraft[] = [
    {
      number: 1,
      order: 0,
      type: "GAP_FILL",
      content: {
        stem: "volves selecting suitable 1 ................. for each",
        blank: true,
      },
      correctAnswer: "habitat",
    },
    {
      number: 2,
      order: 1,
      type: "GAP_FILL",
      content: {
        stem: "Climate 2 ................. Solutions Create",
        blank: true,
      },
      correctAnswer: "change",
    },
  ];
  const sanitized = sanitizePartGapStems("Section 1", 0, NOTES_1_TO_5, dirty);
  assert(sanitized.cleared === 2, `expected 2 cleared, got ${sanitized.cleared}`);
  assert(
    sanitized.issues.some((i) => i.code === "REDUNDANT_GAP_STEMS_CLEARED"),
    "expected REDUNDANT_GAP_STEMS_CLEARED warning",
  );
  for (const q of sanitized.questions) {
    assert(
      String((q.content as { stem?: string }).stem ?? "") === INLINE_GAP_STEM,
      `sanitized Q${q.number} stem should be empty`,
    );
    assert(
      q.correctAnswer != null,
      `Q${q.number} answer must be preserved`,
    );
  }

  console.log("OK  gap-stems notes 1–5 + sanitize");
}

main();
