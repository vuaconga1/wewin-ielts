/**
 * Sentence completion must not be split into static notes plus a stem-less box.
 *
 * Run:
 *   npx tsx scripts/test-sentence-gap-layout.ts
 */

import { findInlineBlankNumbers } from "../src/components/practice/inline-notes-gaps";
import { parseQuestionsFromPartBody } from "../src/lib/import/parse-questions";
import { parseReadingQuestionGroups } from "../src/lib/practice/reading-content";
import {
  isStandaloneSentenceGapStem,
  perQuestionSentenceStem,
  resolveGapDisplayStem,
  sanitizePartGapStems,
} from "../src/lib/questions/gap-stems";
import { shouldHideStemBesideNotes } from "../src/lib/ui/question-type-label";
import type { QuestionDraft } from "../src/lib/import/schemas";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const SENTENCES = `
Questions 6-10
Complete the sentences below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
Write your answers in boxes 6-10 on your answer sheet.
6 Clarence Saunders' first job was as ________ in a grocery store.
7 In Clarence Saunders' store, people should pay for goods at a ________.
8 Customers would be under surveillance at the ________.
9 Another area in his store was called ________, which was only accessible to the internal staff.
10 In Clarence Saunders' shopping design, much work was done by ________.
`.trim();

const NOTES = `
Questions 1-5
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

function main() {
  const withStems = [
    {
      number: 6,
      type: "GAP_FILL",
      content: {
        stem: "Clarence Saunders' first job was as ________ in a grocery store.",
        blank: true,
      },
    },
    {
      number: 7,
      type: "SHORT_ANSWER",
      content: {
        stem: "In Clarence Saunders' store, people should pay for goods at a",
      },
    },
    {
      number: 8,
      type: "SHORT_ANSWER",
      content: { stem: "Customers would be under surveillance at the" },
    },
    {
      number: 9,
      type: "GAP_FILL",
      content: {
        stem: "Another area in his store was called ________, which was only accessible to the internal staff.",
        blank: true,
      },
    },
    {
      number: 10,
      type: "SHORT_ANSWER",
      content: {
        stem: "In Clarence Saunders' shopping design, much work was done by",
      },
    },
  ];

  const grouped = parseReadingQuestionGroups(SENTENCES, withStems);
  assert(grouped.length === 1, "sentence group is one block");
  const notes = grouped[0]!.notes;
  assert(
    !/Clarence Saunders' first job/.test(notes),
    "Q6 sentence is not static notes",
  );
  assert(
    !/Another area in his store/.test(notes),
    "Q9 sentence is not static notes",
  );
  assert(!/_{2,}|_____/.test(notes), "sentence blanks are not a static notes block");

  for (const q of [withStems[0]!, withStems[3]!] ) {
    assert(
      !shouldHideStemBesideNotes({
        compactStem: true,
        questionType: q.type,
        stem: String(q.content.stem),
        optionCount: 0,
      }),
      `Q${q.number} sentence stem stays on the answer row`,
    );
  }

  const plain = withStems[1]!;
  assert(
    !shouldHideStemBesideNotes({
      compactStem: true,
      questionType: plain.type,
      stem: String(plain.content.stem),
      optionCount: 0,
    }),
    "a sentence without a blank marker keeps its stem on the input",
  );
  assert(
    resolveGapDisplayStem(String(plain.content.stem), undefined) ===
      plain.content.stem,
    "Q7 display stem is the stored sentence",
  );

  // Already-imported rows: empty stem, sentence only in the task text.
  const storedEmpty = parseReadingQuestionGroups(SENTENCES, [
    { number: 6, type: "GAP_FILL", content: { stem: "", blank: true } },
    {
      number: 7,
      type: "SHORT_ANSWER",
      content: {
        stem: "In Clarence Saunders' store, people should pay for goods at a",
      },
    },
    { number: 9, type: "GAP_FILL", content: { stem: "", blank: true } },
  ]);
  assert(
    !/Clarence Saunders' first job/.test(storedEmpty[0]!.notes),
    "empty-stem Q6 is not repeated as static notes",
  );
  assert(
    storedEmpty[0]!.sentenceStems[6]?.includes("first job was as"),
    "empty-stem Q6 sentence is recovered for the answer row",
  );
  assert(
    storedEmpty[0]!.sentenceStems[9]?.includes("only accessible"),
    "empty-stem Q9 sentence is recovered for the answer row",
  );
  assert(
    /pay for goods at a _{2,}/.test(storedEmpty[0]!.sentenceStems[7] ?? ""),
    "Q7 stored without its trailing blank gets the full sentence",
  );
  assert(
    /at a _{2,}/.test(
      resolveGapDisplayStem(
        "In Clarence Saunders' store, people should pay for goods at a",
        storedEmpty[0]!.sentenceStems[7],
      ),
    ),
    "Q7 display stem shows the trailing blank",
  );
  const withOptions = parseReadingQuestionGroups(SENTENCES, [
    {
      number: 8,
      type: "MATCHING",
      content: {
        stem: "Customers would be under surveillance at the",
        options: [
          { label: "A", text: "x" },
          { label: "B", text: "y" },
        ],
      },
    },
  ]);
  assert(
    !withOptions[0]!.sentenceStems[8],
    "a choice question keeps its stored stem",
  );
  const recovered = resolveGapDisplayStem(
    "",
    storedEmpty[0]!.sentenceStems[6],
  );
  assert(
    /first job was as/.test(recovered) && /_{2,}/.test(recovered),
    "recovered Q6 stem still contains the blank",
  );
  assert(
    !shouldHideStemBesideNotes({
      compactStem: true,
      questionType: "GAP_FILL",
      stem: recovered,
      optionCount: 0,
    }),
    "recovered Q6 stem is not hidden beside notes",
  );

  const noteGroup = parseReadingQuestionGroups(
    NOTES,
    [1, 2, 3, 4, 5].map((n) => ({
      number: n,
      type: "GAP_FILL",
      content: { stem: "", blank: true },
    })),
  );
  assert(/Habitat 1/.test(noteGroup[0]!.notes), "shared notes text is kept");
  assert(
    findInlineBlankNumbers(noteGroup[0]!.notes).join(",") === "1,2,3,4,5",
    "shared notes still expose inline numbered gaps",
  );
  assert(
    Object.keys(noteGroup[0]!.sentenceStems).length === 0,
    "notes rows are not treated as sentence stems",
  );

  const mixedBody = `${NOTES}

Questions 31-34
Complete the sentences below.
31 The salt content in marshes can be as high as that of the ........
32 At different times of the day, there are changes in salinity and in the ........ and warmth of the water`;

  const parsed = parseQuestionsFromPartBody(mixedBody);
  const sanitized = sanitizePartGapStems("Section", 0, mixedBody, parsed);
  const q32 = sanitized.questions.find((q) => q.number === 32);
  assert(q32, "Q32 parsed");
  assert(
    String((q32!.content as { stem?: string }).stem ?? "").includes(
      "salinity",
    ),
    "import keeps a sentence stem when the part also has notes blanks",
  );
  const q1 = sanitized.questions.find((q) => q.number === 1);
  assert(q1, "notes Q1 parsed");
  assert(
    String((q1!.content as { stem?: string }).stem ?? "") === "",
    "numbered notes blanks still store an empty stem",
  );

  const window: QuestionDraft = {
    number: 1,
    order: 0,
    type: "GAP_FILL",
    content: {
      stem: "volves selecting suitable 1 ................. for each",
      blank: true,
    },
    correctAnswer: "habitat",
  };
  const cleared = sanitizePartGapStems("Section 1", 0, NOTES, [window]);
  assert(cleared.cleared === 1, "sliding-window stems are still cleared");

  // C11 T1-R Q22–27: a 14-underscore gap is ONE blank, and a sentence that
  // starts with the gap is still that question's sentence.
  const longGaps = `
Questions 22-27
Complete the sentences below.
Choose NO MORE THAN TWO WORDS from the text for each answer.
22 There are certain places in the building that staff should avoid unless they have ______________ .
23 To ensure people can get out easily, it is important that there are no ______________ to exits.
26 ______________ are available to make tasks which require moving objects easier.
27 You should have ______________ while you are working.
`.trim();
  assert(
    perQuestionSentenceStem(
      "22 There are certain places in the building that staff should avoid unless they have ______________ .",
    )?.number === 22,
    "a long underscore run counts as one blank",
  );
  assert(
    !isStandaloneSentenceGapStem("A ______ and a ______ were found."),
    "two separate gaps are still two blanks",
  );
  assert(
    !isStandaloneSentenceGapStem("........ Newspapers & magazines"),
    "a short label row after a leading gap is not a sentence",
  );
  assert(
    !isStandaloneSentenceGapStem("........ Teacher-led discussion"),
    "a timetable row after a leading gap is not a sentence",
  );
  const longGroup = parseReadingQuestionGroups(
    longGaps,
    [22, 23, 26, 27].map((n) => ({ number: n, type: "GAP_FILL", content: { stem: "", blank: true } })),
  )[0]!;
  for (const n of [22, 23, 26, 27]) {
    assert(longGroup.sentenceStems[n], `Q${n} sentence with a long gap is lifted out of notes`);
  }
  assert(!/______________/.test(longGroup.notes), "long-gap sentences are not left as static notes");
  assert(
    longGroup.sentenceStems[26]!.startsWith("______________ are available"),
    "a sentence that starts with the gap keeps its words",
  );

  // Legacy published Reading seed (Bovids): Q9–13 were imported with empty
  // stems even though the complete short-answer questions remain in the task
  // text. They must be recovered for the prompt pane, not reduced to "9 ___".
  const shortAnswers = `
Questions 9-13
Answer the questions below.
Choose NO MORE THAN THREE WORDS from the passage for each answer.
Write your answers in boxes 9-13 on your answer sheet.
9 What is the smallest species of Bovid called?
10 Which species of Bovinae has now died out?
11 What facilitates the movement of the sitatunga over wetland?
12 What sort of terrain do barbary sheep live in?
13 What is the only living member of the Antilocapridae sub-family?
`.trim();
  const shortGroup = parseReadingQuestionGroups(
    shortAnswers,
    [9, 10, 11, 12, 13].map((n) => ({
      number: n,
      type: "GAP_FILL",
      content: { stem: "", blank: true },
    })),
  )[0]!;
  assert(
    shortGroup.sentenceStems[9] === "What is the smallest species of Bovid called?",
    "an empty legacy stem is recovered from a numbered short-answer question",
  );
  assert(
    shortGroup.sentenceStems[13]?.includes("Antilocapridae"),
    "the last numbered short-answer question is recovered",
  );
  assert(
    !/smallest species|Antilocapridae/.test(shortGroup.notes),
    "recovered short-answer questions are not duplicated as static notes",
  );

  console.log("OK  sentence-gap layout");
}

main();
