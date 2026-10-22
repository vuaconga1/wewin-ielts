/**
 * An umbrella header ("Questions 21–30") followed by real sub-headers
 * ("Questions 27 and 28") splits into 21–26 / 27–28 / 29–30. The earlier
 * items keep the umbrella instructions instead of being left ungrouped.
 * A boxes-only line inside an umbrella still tightens it (C-style Test 2).
 *
 * Run:
 *   npx tsx scripts/test-question-group-subheaders.ts
 */
import {
  parseReadingQuestionGroups,
  splitReadingPassageAndTasks,
} from "../src/lib/practice/reading-content";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const mc = (number: number) => ({
  number,
  type: "MULTIPLE_CHOICE",
  content: { stem: `Stem ${number}` },
});

// Cambridge Listening Test 9 Section 3 (DB content, options shortened).
const listening = [
  "Questions 21-30",
  "",
  "Choose the correct letter, A, B or C.",
  "",
  "21 John and Cath's presentation plans are different in",
  "A the examples used.",
  "26 What does Cath say about stretching as a treatment?",
  "A It is potentially risky.",
  "",
  "Questions 27 and 28",
  "",
  "Choose TWO letters, A-E.",
  "",
  "Which TWO treatment techniques did the female runner find useful?",
  "",
  "Questions 29 and 30",
  "",
  "Choose TWO letters, A-E.",
].join("\n");

const groups = parseReadingQuestionGroups(
  listening,
  [21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map(mc),
);
const ranges = groups.map((g) => `${g.start}-${g.end}`).join(",");
assert(ranges === "21-26,27-28,29-30", `groups split at sub-headers: ${ranges}`);
assert(
  groups[0]!.instructions.some((line) => /Choose the correct letter, A, B or C/.test(line)),
  "21–26 keeps the umbrella instruction",
);
assert(
  !groups[1]!.instructions.some((line) => /A, B or C/.test(line)),
  "27–28 does not inherit the umbrella instruction",
);

const boxes = parseReadingQuestionGroups(
  [
    "Questions 27-40",
    "",
    "Complete the summary below.",
    "",
    "Write your answers in boxes 27-33 on your answer sheet.",
  ].join("\n"),
  [27, 28, 33].map(mc),
);
assert(
  boxes.length === 1 && boxes[0]!.start === 27 && boxes[0]!.end === 33,
  `boxes-only line tightens the umbrella: ${boxes.map((g) => `${g.start}-${g.end}`)}`,
);

// Single-question task after a range (Test 13 Passage 3, Real IELTS Vol 1 Test 7).
const single = parseReadingQuestionGroups(
  [
    "Questions 37-39",
    "Choose THREE letters, A-F.",
    "Questions 40",
    "Choose the correct letter, A, B, C or D.",
    "Write the correct letter in box 40 on your answer sheet.",
  ].join("\n"),
  [37, 38, 39, 40].map(mc),
);
const last = single[single.length - 1]!;
assert(
  single.length === 2 && last.start === 40 && last.end === 40 && last.header === "Question 40",
  `"Questions 40" is its own group: ${single.map((g) => g.header)}`,
);
assert(
  !single[0]!.instructions.some((line) => /box 40/.test(line)),
  "37–39 does not carry the question 40 instruction",
);

// "READING PASSAGE 2" alone under a header joins the instruction, not the header (Test 10).
const passageLabel = parseReadingQuestionGroups(
  splitReadingPassageAndTasks(
    [
      "A The first section of the passage is long enough to count as passage text for the split.",
      "",
      "Questions 14-18",
      "",
      "READING PASSAGE 2",
      " has five sections, A-E.",
      "Choose the correct heading for each section from the list of headings below.",
    ].join("\n"),
  ).tasks,
  [14, 15].map(mc),
);
assert(passageLabel[0]!.header === "Questions 14-18", `header stays clean: ${passageLabel[0]!.header}`);
assert(
  passageLabel[0]!.instructions.some((line) => /^READING PASSAGE 2 has five sections, A-E\.$/.test(line)),
  `passage label joins its sentence: ${passageLabel[0]!.instructions}`,
);

console.log("question group sub-headers regression: ok");
