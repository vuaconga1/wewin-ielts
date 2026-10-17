/**
 * Listening / Reading layout contract on every bundled test (QUESTION-LAYOUT-SPEC §1.8).
 *
 * Run:
 *   npx tsx scripts/test-left-right-contract.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  checkPartContract,
  promptPaneText,
  renderWorkspace,
  toSessionPart,
} from "./lib/left-right-contract";

// Listening labels attached to a large map move to the ANSWERS pane, directly
// beside their dropdown. The instruction and map remain in the prompt pane.
const mapLabels = ["statue of Diane Gosforth", "wooden sculptures", "playground", "maze", "tennis courts", "fitness area"];
const mapPart = toSessionPart({
  title: "Section 2",
  order: 1,
  content:
    "Questions 15–20\nLabel the map below.\nWrite the correct letter, A–I, next to questions 15–20.\n\n[[title]]Minster Park[[/title]]",
  questions: mapLabels.map((label, i) => ({
    number: 15 + i,
    type: "MAP_LABELING",
    mediaUrl: "/minster-park.jpg",
    content: {
      stem: `${label} _____`,
      blank: true,
      variant: "MAP_LABELING",
      imageUrl: "/minster-park.jpg",
    },
  })),
});
const mapHtml = renderWorkspace(mapPart, "LISTENING");
const mapText = promptPaneText(mapHtml);
const mapAnswerPane = mapHtml.slice(mapHtml.indexOf('data-pane="answers"'));
for (const [i, label] of mapLabels.entries()) {
  const row = new RegExp(`${15 + i}\\.?\\s*${label.replace(/ /g, "\\s+")}`);
  if (row.test(mapText.replace(/\s+/g, " "))) {
    throw new Error(`map label Q${15 + i} "${label}" must not remain below the Listening map:\n${mapText}`);
  }
  if (!row.test(mapAnswerPane.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "))) {
    throw new Error(`map label Q${15 + i} "${label}" is not beside its answer control`);
  }
}
if ((mapAnswerPane.match(/<select\b/g) ?? []).length !== mapLabels.length) {
  throw new Error("each Listening map label must have one adjacent dropdown");
}
const mapProblems = checkPartContract(mapPart, "LISTENING", new Map(mapLabels.map((_, i) => [15 + i, "A"])));
if (mapProblems.length) throw new Error(`map label part contract: ${mapProblems.join("; ")}`);

// Scope guard: the same figure-label data in Reading keeps its question text
// in the prompt pane. This exception is Listening-only.
const readingMapText = promptPaneText(renderWorkspace(mapPart, "READING")).replace(/\s+/g, " ");
if (!mapLabels.every((label, i) => readingMapText.includes(`${15 + i}. ${label}`))) {
  throw new Error("Reading map labels must stay in the prompt pane");
}

// Phase 6 A15/A16: a map used by Q15-20 belongs after that group's instruction,
// not at the top of a section that starts with unrelated Q11-14. The figure is
// also an accessible zoom trigger on narrow screens.
const positionedMap = toSessionPart({
  title: "Section 2",
  order: 1,
  content: [
    "Questions 11–14",
    "Choose the correct letter, A, B or C.",
    "Questions 15–20",
    "Label the map below.",
    "Write the correct letter, A–I, next to Questions 15–20.",
  ].join("\n"),
  questions: [
    ...[11, 12, 13, 14].map((number) => ({
      number,
      type: "MULTIPLE_CHOICE",
      content: {
        stem: `Question ${number}`,
        options: [{ label: "A", text: "First" }, { label: "B", text: "Second" }, { label: "C", text: "Third" }],
      },
    })),
    ...[15, 16, 17, 18, 19, 20].map((number) => ({
      number,
      type: "MAP_LABELING",
      mediaUrl: "/map-phase6.png",
      content: { stem: `place ${number}`, imageUrl: "/map-phase6.png", variant: "MAP_LABELING" as const },
    })),
  ],
});
const positionedHtml = renderWorkspace(positionedMap, "LISTENING");
const firstGroupAt = positionedHtml.indexOf("Questions 11");
const mapGroupAt = positionedHtml.indexOf("Questions 15");
const mapImageAt = positionedHtml.indexOf('<img src="/map-phase6.png"');
if (!(firstGroupAt >= 0 && mapGroupAt > firstGroupAt && mapImageAt > mapGroupAt)) {
  throw new Error("A15: map image is not positioned inside its owning question group");
}
if (!positionedHtml.includes('aria-label="Phóng to hình"') || !positionedHtml.includes("Chạm để phóng to")) {
  throw new Error("A16: map image has no accessible enlarge trigger");
}

// C12 GT Test 7 Listening, Questions 21–26 (paper p.56): a letter-box flow-chart whose
// stage boxes hold several lines; every step and both gaps of one line stay visible.
const G = "...............";
const bank = ["patterns", "names", "sources", "questions", "employees", "solutions", "headings", "officials"];
const flowPart = toSessionPart({
  title: "Section 3",
  order: 2,
  content: [
    "Questions 21–26",
    "Complete the flow-chart below.",
    "Choose SIX answers from the box and write the correct letter, A–H, next to Questions 21–26.",
    ...bank.map((word, i) => `${String.fromCharCode(65 + i)}  ${word}`),
    "STAGES IN DOING A TOURISM CASE STUDY",
    "RESEARCH",
    `Locate and read relevant articles, noting key information and also 21 ${G}`,
    "Identify a problem or need",
    `Select interviewees – these may be site 22 ${G} , visitors or city 23 ${G}`,
    "Prepare and carry out interviews. If possible, collect statistics.",
    `Check whether 24 ${G} of interviewees can be used`,
    "↓",
    "ANALYSIS",
    `Select relevant information and try to identify 25 ${G}`,
    "Decide on the best form of visuals",
    "↓",
    "WRITING THE CASE STUDY",
    "Give some background before writing the main sections",
    `Do NOT end with 26 ${G}`,
  ].join("\n\n"),
  questions: [21, 22, 23, 24, 25, 26].map((number) => ({
    number,
    type: "MATCHING",
    content: {
      stem: "",
      variant: "FLOW_CHART_COMPLETION",
      options: bank.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
    },
  })),
});
const flowText = promptPaneText(renderWorkspace(flowPart, "LISTENING")).replace(/\s+/g, " ");
for (const step of [
  "STAGES IN DOING A TOURISM CASE STUDY",
  "RESEARCH",
  "Identify a problem or need",
  "Prepare and carry out interviews",
  "ANALYSIS",
  "Decide on the best form of visuals",
  "WRITING THE CASE STUDY",
  "Give some background before writing the main sections",
]) {
  if (!flowText.includes(step)) throw new Error(`C12 T7-L flow-chart lost the step "${step}":\n${flowText}`);
}
if (!/site 22\s*, visitors or city 23 Prepare/.test(flowText)) {
  throw new Error(`C12 T7-L Q22/Q23 are not on one line:\n${flowText}`);
}
const flowProblems = checkPartContract(
  flowPart,
  "LISTENING",
  new Map([[21, "C"], [22, "E"], [23, "H"], [24, "B"], [25, "A"], [26, "F"]]),
);
if (flowProblems.length) throw new Error(`flow-chart part contract: ${flowProblems.join("; ")}`);

// C15 GT Test 2 Listening, Questions 21 and 22 (spec §4.4): the shared question comes
// first, then the A–E list; the read-only pane never prints empty "21." / "22." rows.
const twoOptions = [
  "students from the English department",
  "residents of the local area",
  "the university’s teaching staff",
  "potential new students",
  "students from other departments",
].map((text, i) => ({ label: String.fromCharCode(65 + i), text }));
const twoStem = "Which TWO groups of people is the display primarily intended for?";
const twoPart = toSessionPart({
  title: "Section 3",
  order: 2,
  content: "Questions 21 and 22\n\nChoose TWO letters, A–E.\n\n",
  questions: [
    { number: 21, type: "MULTIPLE_CHOICE", content: { stem: twoStem, covers: [21, 22], selectCount: 2, options: twoOptions } },
    { number: 22, type: "MULTIPLE_CHOICE", content: { stem: "", pairedFrom: 21, options: twoOptions } },
  ],
});
const twoLines = promptPaneText(renderWorkspace(twoPart, "LISTENING"))
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const stemAt = twoLines.findIndex((line) => line.includes(twoStem));
const firstOptionAt = twoLines.findIndex((line) => line.includes(twoOptions[0]!.text));
if (stemAt < 0 || firstOptionAt < 0 || stemAt > firstOptionAt) {
  throw new Error(`Choose TWO: the question must come before the A–E list:\n${twoLines.join("\n")}`);
}
if (twoLines.some((line) => /^2[12]\.?$/.test(line))) {
  throw new Error(`Choose TWO: empty numbered rows in the read-only pane:\n${twoLines.join("\n")}`);
}
const twoProblems = checkPartContract(twoPart, "LISTENING", new Map([[21, "B"], [22, "D"]]));
if (twoProblems.length) throw new Error(`Choose TWO part contract: ${twoProblems.join("; ")}`);


// Legacy published `reading` seed (Bovids): Q4–8 have real lower-case
// SHORT_ANSWER stems, while Q9–13 have empty DB stems but complete numbered
// questions in part.content. Neither group may disappear from the prompt pane.
const bovidsPart = toSessionPart({
  title: "Passage 1",
  order: 0,
  content: `
BOVIDS

The family of mammals called bovids contains many species.

Questions 4-8
Look at the following characteristics (Questions 4-8) and the list of sub-families below.
Match each characteristic with the correct sub-family, A, B, C or D.
Write the correct letter, A, B, C or D, in boxes 4-8 on your answer sheet.
NB You may use any letter more than once.
4 can endure very harsh environments
5 includes the ox and the cow
6 may supplement its diet with meat
7 can usually move at speed
8 does not defend a particular area of land

Questions 9-13
Answer the questions below.
Choose NO MORE THAN THREE WORDS from the passage for each answer.
Write your answers in boxes 9-13 on your answer sheet.
9 What is the smallest species of Bovid called?
10 Which species of Bovinae has now died out?
11 What facilitates the movement of the sitatunga over wetland?
12 What sort of terrain do barbary sheep live in?
13 What is the only living member of the Antilocapridae sub-family?
`.trim(),
  questions: [
    ...[
      "can endure very harsh environments",
      "includes the ox and the cow",
      "may supplement its diet with meat",
      "can usually move at speed",
      "does not defend a particular area of land",
    ].map((stem, i) => ({ number: 4 + i, type: "SHORT_ANSWER", content: { stem } })),
    ...[9, 10, 11, 12, 13].map((number) => ({
      number,
      type: "GAP_FILL",
      content: { stem: "", blank: true },
    })),
  ],
});
const bovidsText = promptPaneText(renderWorkspace(bovidsPart, "READING")).replace(/\s+/g, " ");
for (const expected of [
  "4.can endure very harsh environments",
  "8.does not defend a particular area of land",
  "9.What is the smallest species of Bovid called?",
  "13.What is the only living member of the Antilocapridae sub-family?",
]) {
  if (!bovidsText.includes(expected)) {
    throw new Error(`legacy Reading prompt lost ${JSON.stringify(expected)}:\\n${bovidsText}`);
  }
}
const bovidsProblems = checkPartContract(
  bovidsPart,
  "READING",
  new Map([4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => [n, "answer"])),
);
if (bovidsProblems.length) throw new Error(`legacy Reading contract: ${bovidsProblems.join("; ")}`);

const dir = "data/tests";
const files = fs
  .readdirSync(dir)
  .filter((name) => /^test-\d+-(listening|reading)\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

let failures = 0;
let parts = 0;
for (const file of files) {
  const test = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  const skill = test.skill === "READING" ? "READING" : "LISTENING";
  for (const raw of test.parts) {
    if (!raw.questions?.length) continue;
    parts += 1;
    const keys = new Map<number, unknown>(
      raw.questions.map((q: { number: number; correctAnswer?: unknown }) => [q.number, q.correctAnswer]),
    );
    const problems = checkPartContract(toSessionPart(raw), skill, keys);
    for (const problem of problems) {
      failures += 1;
      console.log(`FAIL ${file} part ${raw.order}: ${problem}`);
    }
  }
}

if (failures > 0) {
  console.log(`left-right contract: ${failures} problem(s) in ${files.length} tests / ${parts} parts`);
  process.exit(1);
}
console.log(`left-right contract: ok (${files.length} tests / ${parts} parts)`);
