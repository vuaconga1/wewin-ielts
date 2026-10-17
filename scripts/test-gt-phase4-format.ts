/**
 * Focused renderer regressions for GT Phase 4 formatting defects E9, E10 and E14.
 * These fixtures mirror the affected printed question structures without needing DB access.
 */
import {
  checkPartContract,
  promptPaneText,
  renderWorkspace,
  toSessionPart,
} from "./lib/left-right-contract";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const bank = ["alpha", "bravo", "charlie", "delta", "echo"].map((text, i) => ({
  label: String.fromCharCode(65 + i),
  text,
}));
const sharedChoicePart = toSessionPart({
  title: "Section 2",
  order: 1,
  content: [
    "Questions 11 and 12",
    "Choose TWO letters, A–E.",
    "Questions 13 and 14",
    "Choose TWO letters, A–E.",
    "Questions 15 and 16",
    "Choose TWO letters, A–E.",
  ].join("\n\n"),
  questions: [
    [11, "Which TWO changes have been made?"],
    [13, "Which TWO facilities are offered?"],
    [15, "Which TWO workshops are offered?"],
  ].flatMap(([number, stem]) => [
    {
      number: number as number,
      type: "MULTIPLE_CHOICE",
      content: {
        stem: stem as string,
        variant: "MULTI_SELECT",
        covers: [number as number, (number as number) + 1],
        selectCount: 2,
        options: bank,
      },
    },
    {
      number: (number as number) + 1,
      type: "MULTIPLE_CHOICE",
      content: { stem: "", variant: "SINGLE_CHOICE", pairedFrom: number as number },
    },
  ]),
});
const sharedText = promptPaneText(renderWorkspace(sharedChoicePart, "LISTENING"))
  .replace(/\s+/g, " ");
for (const stem of [
  "Which TWO changes have been made?",
  "Which TWO facilities are offered?",
  "Which TWO workshops are offered?",
]) {
  assert(sharedText.includes(stem), `E9: shared-choice stem is missing: ${stem}`);
}
assert(
  checkPartContract(sharedChoicePart, "LISTENING", new Map([[11, "A"], [12, "B"], [13, "C"], [14, "D"], [15, "A"], [16, "E"]])).length === 0,
  "E9: shared-choice groups violate the left/right contract",
);

const statements = Array.from({ length: 14 }, (_, i) => `Statement ${i + 1}`);
const subgroupPart = toSessionPart({
  title: "Section 1",
  order: 0,
  content: [
    "Questions 1–14",
    "Read the text below and answer Questions 1–7.",
    "Sample passage A–G.",
    "Questions 1–7",
    "Look at the seven descriptions and match them with A–G.",
    ...statements.slice(0, 7).map((s, i) => `${i + 1} ${s}`),
    "Read the text below and answer Questions 8–14.",
    "Sample second passage.",
    "Questions 8–14",
    "Do the following statements agree with the information given in the text?",
    ...statements.slice(7).map((s, i) => `${i + 8} ${s}`),
  ].join("\n\n"),
  questions: statements.map((stem, i) => ({
    number: i + 1,
    type: i < 7 ? "MATCHING" : "TRUE_FALSE_NG",
    content: {
      stem,
      variant: i < 7 ? "MATCHING_INFORMATION" : "TRUE_FALSE_NOT_GIVEN",
      options: i < 7
        ? bank
        : ["TRUE", "FALSE", "NOT GIVEN"].map((label) => ({ label, text: label })),
    },
  })),
});
const subgroupText = promptPaneText(renderWorkspace(subgroupPart, "READING"))
  .replace(/\s+/g, " ");
assert(subgroupText.includes("Questions 8–14"), "E10: Questions 8–14 header is missing");
assert(subgroupText.includes("8.Statement 8"), "E10: Q8 statement is missing");
assert(subgroupText.includes("14.Statement 14"), "E10: Q14 statement is missing");

const diagramPart = toSessionPart({
  title: "Section 3",
  order: 2,
  content: "Roman Roads\n\nPassage text preceding the question group.\n\nQuestions 38–40\n\nLabel the diagram below.\n\nWrite NO MORE THAN TWO WORDS for each answer.\n\n38 ...............\n\n39 ...............\n\n40 ...............",
  meta: { imageUrl: "/uploads/images/example/reading-diagram.png" },
  questions: [38, 39, 40].map((number) => ({
    number,
    type: "MAP_LABELING",
    mediaUrl: "/uploads/images/example/reading-diagram.png",
    content: {
      stem: "",
      blank: true,
      variant: "DIAGRAM_LABELING",
      imageUrl: "/uploads/images/example/reading-diagram.png",
    },
  })),
});
const diagramHtml = renderWorkspace(diagramPart, "READING");
const instructionAt = diagramHtml.indexOf("Label the diagram below.");
const imageAt = diagramHtml.indexOf("<img");
assert(instructionAt >= 0, "E14: diagram instruction is missing");
assert(imageAt >= 0, "E14: diagram image is missing");
assert(instructionAt < imageAt, "E14: diagram instruction must render before the image");

console.log("GT Phase 4 renderer regressions: ok (E9, E10, E14)");
