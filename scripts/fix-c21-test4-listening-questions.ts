/**
 * Rebuild Test 18.C21.04 Listening questions from Cambridge 21 PDF.
 * Part 1 kept intact (Broadbeach shopping survey audited correct against PDF).
 * Parts 2, 3 & 4 rebuilt from official PDF pages 77-81 and key page 124.
 *
 * Usage: npx tsx scripts/fix-c21-test4-listening-questions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FILE = path.resolve("data/tests/test-18-listening.json");

const Q11_12_OPTIONS = [
  { label: "A", text: "the Digital Marketing Centre" },
  { label: "B", text: "the TalkCon Zone" },
  { label: "C", text: "the Breakout area" },
  { label: "D", text: "the Business Village" },
  { label: "E", text: "the Business Connections Zone" },
];

const Q13_14_OPTIONS = [
  { label: "A", text: "They are available to all members of exhibiting companies." },
  { label: "B", text: "They can be used for both food and clothing." },
  { label: "C", text: "They only apply if people spend at least £400." },
  { label: "D", text: "They can be used by family members." },
  { label: "E", text: "The percentage saved is always the same." },
];

const Q15_20_OPTIONS = [
  { label: "A", text: "Supporting job seekers" },
  { label: "B", text: "Dealing with personal problems" },
  { label: "C", text: "Effects of an unexpectedly rapid expansion" },
  { label: "D", text: "A global range of business experiences" },
  { label: "E", text: "Coping with financial set-backs" },
  { label: "F", text: "Developing a company in response to changing markets" },
  { label: "G", text: "Combining business success with contributions to charities" },
];

const SECTION_2_CONTENT = `Questions 11–20
Questions 11 and 12
Choose TWO letters, A–E.
In which TWO areas of the business exhibition did James Craig promote his company last year?
A the Digital Marketing Centre
B the TalkCon Zone
C the Breakout area
D the Business Village
E the Business Connections Zone

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO facts are given about discounts on popular brands available to exhibitors?
A They are available to all members of exhibiting companies.
B They can be used for both food and clothing.
C They only apply if people spend at least £400.
D They can be used by family members.
E The percentage saved is always the same.

Questions 15–20
Which topic will each of the following speakers focus on?
Choose SIX answers from the box and write the correct letter, A–G, next to Questions 15–20.

Topics
A Supporting job seekers
B Dealing with personal problems
C Effects of an unexpectedly rapid expansion
D A global range of business experiences
E Coping with financial set-backs
F Developing a company in response to changing markets
G Combining business success with contributions to charities

Speakers
15 Jim Clowrie
16 David France
17 Oliver Stanton
18 Francesca Heptonstall
19 Salman Khan
20 Annie Craven`;

const SECTION_2_QUESTIONS = [
  {
    number: 11,
    order: 0,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "In which TWO areas of the business exhibition did James Craig promote his company last year?",
      options: Q11_12_OPTIONS,
      selectCount: 2,
      covers: [11, 12],
    },
    correctAnswer: "C",
    acceptableAnswers: ["C", "E"],
  },
  {
    number: 12,
    order: 1,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 11,
    },
    correctAnswer: "E",
    acceptableAnswers: ["C", "E"],
  },
  {
    number: 13,
    order: 2,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO facts are given about discounts on popular brands available to exhibitors?",
      options: Q13_14_OPTIONS,
      selectCount: 2,
      covers: [13, 14],
    },
    correctAnswer: "A",
    acceptableAnswers: ["A", "B"],
  },
  {
    number: 14,
    order: 3,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 13,
    },
    correctAnswer: "B",
    acceptableAnswers: ["A", "B"],
  },
  {
    number: 15,
    order: 4,
    type: "MATCHING" as const,
    content: {
      stem: "Jim Clowrie",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "C",
  },
  {
    number: 16,
    order: 5,
    type: "MATCHING" as const,
    content: {
      stem: "David France",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "G",
  },
  {
    number: 17,
    order: 6,
    type: "MATCHING" as const,
    content: {
      stem: "Oliver Stanton",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "D",
  },
  {
    number: 18,
    order: 7,
    type: "MATCHING" as const,
    content: {
      stem: "Francesca Heptonstall",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "A",
  },
  {
    number: 19,
    order: 8,
    type: "MATCHING" as const,
    content: {
      stem: "Salman Khan",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "F",
  },
  {
    number: 20,
    order: 9,
    type: "MATCHING" as const,
    content: {
      stem: "Annie Craven",
      options: Q15_20_OPTIONS,
    },
    correctAnswer: "B",
  },
];

const Q21_OPTIONS = [
  { label: "A", text: "meeting the deadline" },
  { label: "B", text: "finding suitable examples" },
  { label: "C", text: "including original ideas" },
];

const Q22_OPTIONS = [
  { label: "A", text: "family groups." },
  { label: "B", text: "old people." },
  { label: "C", text: "single people." },
];

const Q23_OPTIONS = [
  { label: "A", text: "repurposing offices and factories." },
  { label: "B", text: "constructing tall buildings." },
  { label: "C", text: "developing creative ideas for smaller homes." },
];

const Q24_30_OPTIONS = [
  { label: "A", text: "This could cause unnecessary anxiety." },
  { label: "B", text: "This would be especially beneficial for city residents." },
  { label: "C", text: "This would be challenging for young people." },
  { label: "D", text: "This would have environmental benefits." },
  { label: "E", text: "This could encourage creativity." },
  { label: "F", text: "This could lead to social problems." },
  { label: "G", text: "This could enable retired people to share a project." },
  { label: "H", text: "This would help some people but cause problems for others." },
  { label: "I", text: "This would suit both existing and new members of a household." },
];

const SECTION_3_CONTENT = `Questions 21–30
Questions 21–23
Choose the correct letter, A, B or C.

Presentation on houses of the future
21 Which aspect of their presentation are Mia and Leo both concerned about?
A meeting the deadline
B finding suitable examples
C including original ideas

22 The students decide to focus their assignment on housing for
A family groups.
B old people.
C single people.

23 The students agree that demand for accommodation in urban areas should be met by
A repurposing offices and factories.
B constructing tall buildings.
C developing creative ideas for smaller homes.

Questions 24–30
What opinion is given about each of the following developments?
Choose SEVEN answers from the box and write the correct letter, A–I, next to Questions 24–30.

Opinions
A This could cause unnecessary anxiety.
B This would be especially beneficial for city residents.
C This would be challenging for young people.
D This would have environmental benefits.
E This could encourage creativity.
F This could lead to social problems.
G This could enable retired people to share a project.
H This would help some people but cause problems for others.
I This would suit both existing and new members of a household.

Developments
24 use of roof space for gardens
25 shared working spaces
26 moveable internal walls
27 smart mirrors in bathrooms
28 bike sheds with charging points
29 restriction of cars to certain areas
30 communal vegetable plots`;

const SECTION_3_QUESTIONS = [
  {
    number: 21,
    order: 0,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which aspect of their presentation are Mia and Leo both concerned about?",
      options: Q21_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 22,
    order: 1,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "The students decide to focus their assignment on housing for",
      options: Q22_OPTIONS,
    },
    correctAnswer: "A",
  },
  {
    number: 23,
    order: 2,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "The students agree that demand for accommodation in urban areas should be met by",
      options: Q23_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 24,
    order: 3,
    type: "MATCHING" as const,
    content: {
      stem: "use of roof space for gardens",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 25,
    order: 4,
    type: "MATCHING" as const,
    content: {
      stem: "shared working spaces",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "E",
  },
  {
    number: 26,
    order: 5,
    type: "MATCHING" as const,
    content: {
      stem: "moveable internal walls",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "I",
  },
  {
    number: 27,
    order: 6,
    type: "MATCHING" as const,
    content: {
      stem: "smart mirrors in bathrooms",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "A",
  },
  {
    number: 28,
    order: 7,
    type: "MATCHING" as const,
    content: {
      stem: "bike sheds with charging points",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "D",
  },
  {
    number: 29,
    order: 8,
    type: "MATCHING" as const,
    content: {
      stem: "restriction of cars to certain areas",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "H",
  },
  {
    number: 30,
    order: 9,
    type: "MATCHING" as const,
    content: {
      stem: "communal vegetable plots",
      options: Q24_30_OPTIONS,
    },
    correctAnswer: "G",
  },
];

const SECTION_4_CONTENT = `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Music therapy for surgical patients
Background
• Surgery impacts patients because they may experience discomfort or unwelcome changes to their 31 ........................................... .
• Current post-surgical strategies focus mainly on pain relief.

Recent research
• A study reviewed data from about 100 32 ........................................... and found that listening to music
  improved hospital patients' sense of wellbeing.
  reduced the length of their stay.
• The patients in the study all listened to music with a 33 ........................................... effect.
• The music was mostly played through music 34 ........................................... .
• Patients reported an absence or low levels of 35 ........................................... .
• Medical records confirmed that patients who were played music in hospital needed less 36 ........................................... than those who weren't played music.
• The best results were achieved when patients were played music while they were 37 ........................................... .
• The study concluded that playing music was effective because it served as a 38 ........................................... .
• The researchers recommend playing either music or sounds from 39 ........................................... to all surgical patients.
• A future study will investigate the best 40 ........................................... for the music.`;

const SECTION_4_QUESTIONS = [
  {
    number: 31,
    order: 0,
    type: "GAP_FILL" as const,
    content: {
      stem: "Surgery impacts patients because they may experience discomfort or unwelcome changes to their ________ .",
      blank: true,
    },
    correctAnswer: "routine",
  },
  {
    number: 32,
    order: 1,
    type: "GAP_FILL" as const,
    content: {
      stem: "A study reviewed data from about 100 ________ and found that listening to music",
      blank: true,
    },
    correctAnswer: "trials",
  },
  {
    number: 33,
    order: 2,
    type: "GAP_FILL" as const,
    content: {
      stem: "The patients in the study all listened to music with a ________ effect.",
      blank: true,
    },
    correctAnswer: "calming",
  },
  {
    number: 34,
    order: 3,
    type: "GAP_FILL" as const,
    content: {
      stem: "The music was mostly played through music ________ .",
      blank: true,
    },
    correctAnswer: "pillows",
  },
  {
    number: 35,
    order: 4,
    type: "GAP_FILL" as const,
    content: {
      stem: "Patients reported an absence or low levels of ________ .",
      blank: true,
    },
    correctAnswer: "anxiety",
  },
  {
    number: 36,
    order: 5,
    type: "GAP_FILL" as const,
    content: {
      stem: "Medical records confirmed that patients who were played music in hospital needed less ________ than those who weren't played music.",
      blank: true,
    },
    correctAnswer: "medication",
  },
  {
    number: 37,
    order: 6,
    type: "GAP_FILL" as const,
    content: {
      stem: "The best results were achieved when patients were played music while they were ________ .",
      blank: true,
    },
    correctAnswer: "awake",
  },
  {
    number: 38,
    order: 7,
    type: "GAP_FILL" as const,
    content: {
      stem: "The study concluded that playing music was effective because it served as a ________ .",
      blank: true,
    },
    correctAnswer: "distraction",
  },
  {
    number: 39,
    order: 8,
    type: "GAP_FILL" as const,
    content: {
      stem: "The researchers recommend playing either music or sounds from ________ to all surgical patients.",
      blank: true,
    },
    correctAnswer: "nature",
  },
  {
    number: 40,
    order: 9,
    type: "GAP_FILL" as const,
    content: {
      stem: "A future study will investigate the best ________ for the music.",
      blank: true,
    },
    correctAnswer: "volume",
  },
];

function main() {
  const data = JSON.parse(readFileSync(FILE, "utf-8"));
  if (data.parts.length !== 4) {
    throw new Error(`Expected 4 parts, found ${data.parts.length}`);
  }

  // Section 2
  data.parts[1].content = SECTION_2_CONTENT;
  data.parts[1].questions = SECTION_2_QUESTIONS;

  // Section 3
  data.parts[2].content = SECTION_3_CONTENT;
  data.parts[2].questions = SECTION_3_QUESTIONS;

  // Section 4
  data.parts[3].content = SECTION_4_CONTENT;
  data.parts[3].questions = SECTION_4_QUESTIONS;

  writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Successfully updated ${FILE}`);

  let count = 0;
  for (const part of data.parts) {
    for (const q of part.questions) {
      count++;
      console.log(`Q${q.number}: type=${q.type}, key=${q.correctAnswer}`);
    }
  }
  console.log(`Total questions: ${count}`);
}

main();
