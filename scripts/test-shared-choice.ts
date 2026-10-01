/**
 * Shared answer-bank clustering for True/False/Not Given, Yes/No, and matching.
 *
 * Run:
 *   npx tsx scripts/test-shared-choice.ts
 */

import { parseReadingQuestionGroups } from "../src/lib/practice/reading-content";
import {
  clusterSharedChoices,
  dropdownChoiceLabel,
  inlineChoiceBank,
  optionBankIsLetterOnly,
  optionBankUsesWordGrid,
  type ClusterableQuestion,
} from "../src/lib/practice/shared-choice";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function q(
  number: number,
  type: string,
  options: { label: string; text: string }[],
  extra: ClusterableQuestion["content"] = {},
): ClusterableQuestion {
  return { number, type, content: { options, ...extra } };
}

const tf = [
  { label: "TRUE", text: "TRUE" },
  { label: "FALSE", text: "FALSE" },
  { label: "NOT GIVEN", text: "NOT GIVEN" },
];
const yn = [
  { label: "YES", text: "YES" },
  { label: "NO", text: "NO" },
  { label: "NOT GIVEN", text: "NOT GIVEN" },
];
const heads = [
  { label: "A", text: "gaseous planets form before smaller rocky planets." },
  { label: "B", text: "large planets take millions of years to form." },
];
const other = [
  { label: "A", text: "Clarke was not performing well." },
  { label: "B", text: "The worries were ignored." },
];

function main() {
  const tfGroup = clusterSharedChoices([
    q(1, "TRUE_FALSE_NG", tf),
    q(2, "TRUE_FALSE_NG", tf),
    q(3, "TRUE_FALSE_NG", tf),
  ]);
  assert(tfGroup.length === 1 && tfGroup[0]!.kind === "bank", "TFNG shares one bank");
  if (tfGroup[0]!.kind === "bank") {
    assert(tfGroup[0]!.questions.length === 3, "TFNG bank keeps every question");
  }

  const ynGroup = clusterSharedChoices([q(33, "TRUE_FALSE_NG", yn)]);
  assert(ynGroup.length === 1 && ynGroup[0]!.kind === "bank", "single Yes/No still uses a bank");

  const matching = clusterSharedChoices([
    q(33, "MATCHING", heads),
    q(34, "MATCHING", heads),
  ]);
  assert(matching.length === 1 && matching[0]!.kind === "bank", "matching headings share one bank");

  const split = clusterSharedChoices([
    q(1, "TRUE_FALSE_NG", tf),
    q(2, "GAP_FILL", []),
    q(3, "TRUE_FALSE_NG", tf),
  ]);
  assert(split.length === 3, "a gap question splits choice banks");
  assert(split[0]!.kind === "bank" && split[2]!.kind === "bank", "each TFNG side stays a bank");
  assert(split[1]!.kind === "single", "gap stays a single input");

  const uniqueMcq = clusterSharedChoices([
    q(37, "MULTIPLE_CHOICE", heads),
    q(38, "MULTIPLE_CHOICE", other),
  ]);
  assert(
    uniqueMcq.length === 2 &&
      uniqueMcq.every((block) => block.kind === "single"),
    "different multiple-choice options stay as separate questions",
  );

  const wordBank = clusterSharedChoices([
    q(27, "MULTIPLE_CHOICE", heads),
    q(28, "MULTIPLE_CHOICE", heads),
  ]);
  assert(wordBank.length === 1 && wordBank[0]!.kind === "bank", "repeated word list becomes one bank");

  const chooseTwo = clusterSharedChoices([
    q(21, "MULTIPLE_CHOICE", other, { selectCount: 2, covers: [21, 22] }),
  ]);
  assert(chooseTwo.length === 1 && chooseTwo[0]!.kind === "bank", "choose-two uses one option bank");

  assert(dropdownChoiceLabel(tf[2]!) === "NOT GIVEN", "dropdown shows NOT GIVEN");
  assert(dropdownChoiceLabel(yn[0]!) === "YES", "dropdown shows YES");
  assert(dropdownChoiceLabel(heads[0]!) === "A", "dropdown shows the letter only");

  const tasks = `
Questions 27-32
Complete the summary using the list of words, A-L, below.
27 some text .............
List of Options
A    front feet
B    fish
`.trim();
  const groups = parseReadingQuestionGroups(tasks, [
    { number: 27, type: "MATCHING", content: { stem: "some text" } },
  ]);
  const notes = groups.map((g) => g.notes).join("\n");
  const instructions = groups.flatMap((g) => g.instructions).join("\n");
  assert(!/front feet/.test(notes), "option bank is not repeated inside notes");
  assert(!/front feet/.test(instructions), "option bank is not repeated as instructions");
  assert(/List of Options/i.test(instructions), "list title stays with the question group");

  const letters = "ABCDEFGHI".split("").map((label) => ({ label, text: label }));
  assert(!optionBankIsLetterOnly(tf), "TRUE / FALSE / NOT GIVEN still draws a box");
  assert(optionBankIsLetterOnly(letters), "A–I with no wording is an empty bank");
  assert(!optionBankUsesWordGrid(letters), "empty letters are not a word grid");

  const words = [
    { label: "A", text: "gravitational pull" },
    { label: "B", text: "ice" },
    { label: "C", text: "solid core" },
    { label: "D", text: "ultraviolet light" },
    { label: "E", text: "Milky Way" },
    { label: "F", text: "disk" },
  ];
  assert(optionBankUsesWordGrid(words), "short A–F phrases use a 3-column grid");
  const dozen = "ABCDEFGHIJKL".split("").map((label) => ({
    label,
    text: label === "A" ? "front feet" : "fish",
  }));
  assert(optionBankUsesWordGrid(dozen), "A–L word box is still a 3-column grid");
  assert(!optionBankIsLetterOnly(words), "word list is not letter-only");

  const endings = words.map((opt, i) => ({
    label: opt.label,
    text: "gaseous planets form before smaller rocky planets.".repeat(i === 0 ? 1 : 0) || "large planets take millions of years to form.",
  }));
  assert(!optionBankUsesWordGrid(endings), "sentence endings stay a single column");

  const summaryQs = [38, 39, 40].map((number) =>
    q(number, "MATCHING", words),
  );
  const bank = inlineChoiceBank(summaryQs, new Set([38, 39, 40]));
  assert(bank?.[0]?.text === "gravitational pull", "summary blanks share one word list");

  console.log("shared-choice: ok");
}

main();
