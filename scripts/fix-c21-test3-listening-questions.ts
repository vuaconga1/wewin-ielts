/**
 * Rebuild Test 17.C21.03 Listening questions from Cambridge 21 PDF.
 * Part 1 kept intact (Shetland ferry notes audited correct against PDF).
 * Parts 2, 3 & 4 rebuilt from official PDF pages 56-60 and key page 122.
 *
 * Usage: npx tsx scripts/fix-c21-test3-listening-questions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FILE = path.resolve("data/tests/test-17-listening.json");

const Q11_12_OPTIONS = [
  { label: "A", text: "low price" },
  { label: "B", text: "locally sourced" },
  { label: "C", text: "freshly made" },
  { label: "D", text: "convenience" },
  { label: "E", text: "unusual food" },
];

const Q13_14_OPTIONS = [
  { label: "A", text: "music festivals" },
  { label: "B", text: "food markets" },
  { label: "C", text: "weddings" },
  { label: "D", text: "parties" },
  { label: "E", text: "parks" },
];

const Q15_OPTIONS = [
  { label: "A", text: "High quality equipment is a good investment." },
  { label: "B", text: "It's best to buy second-hand equipment." },
  { label: "C", text: "Renting equipment can be cheap." },
];

const Q16_OPTIONS = [
  { label: "A", text: "Provide information about the ingredients." },
  { label: "B", text: "It is important to have an original product." },
  { label: "C", text: "The presentation is an important factor." },
];

const Q17_20_OPTIONS = [
  { label: "A", text: "Some ingredients were too expensive." },
  { label: "B", text: "The meals took a long time to prepare." },
  { label: "C", text: "They had no money for marketing." },
  { label: "D", text: "It was difficult to get a permit to sell food." },
  { label: "E", text: "A competitor was selling similar food in their area." },
  { label: "F", text: "They worked very long hours." },
];

const SECTION_2_CONTENT = `Questions 11–20
Questions 11 and 12
Choose TWO letters, A–E.
Which TWO explanations for the popularity of street food are given?
A low price
B locally sourced
C freshly made
D convenience
E unusual food

Questions 13 and 14
Choose TWO letters, A–E.
Which TWO places are recommended for new street food businesses?
A music festivals
B food markets
C weddings
D parties
E parks

Questions 15 and 16
Choose the correct letter, A, B or C.

15 What does the speaker say about getting equipment for a street food business?
A High quality equipment is a good investment.
B It's best to buy second-hand equipment.
C Renting equipment can be cheap.

16 What advice is given about creating a product for a street food business?
A Provide information about the ingredients.
B It is important to have an original product.
C The presentation is an important factor.

Questions 17–20
What problem did the owners of each of the following street food businesses experience?
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 17–20.

Problems
A Some ingredients were too expensive.
B The meals took a long time to prepare.
C They had no money for marketing.
D It was difficult to get a permit to sell food.
E A competitor was selling similar food in their area.
F They worked very long hours.

Street food businesses
17 Thai Basil
18 Basque
19 Lou's kitchen
20 Chip Chop`;

const SECTION_2_QUESTIONS = [
  {
    number: 11,
    order: 0,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO explanations for the popularity of street food are given?",
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
      stem: "Which TWO places are recommended for new street food businesses?",
      options: Q13_14_OPTIONS,
      selectCount: 2,
      covers: [13, 14],
    },
    correctAnswer: "B",
    acceptableAnswers: ["B", "E"],
  },
  {
    number: 14,
    order: 3,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 13,
    },
    correctAnswer: "E",
    acceptableAnswers: ["B", "E"],
  },
  {
    number: 15,
    order: 4,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "What does the speaker say about getting equipment for a street food business?",
      options: Q15_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 16,
    order: 5,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "What advice is given about creating a product for a street food business?",
      options: Q16_OPTIONS,
    },
    correctAnswer: "C",
  },
  {
    number: 17,
    order: 6,
    type: "MATCHING" as const,
    content: {
      stem: "Thai Basil",
      options: Q17_20_OPTIONS,
    },
    correctAnswer: "F",
  },
  {
    number: 18,
    order: 7,
    type: "MATCHING" as const,
    content: {
      stem: "Basque",
      options: Q17_20_OPTIONS,
    },
    correctAnswer: "A",
  },
  {
    number: 19,
    order: 8,
    type: "MATCHING" as const,
    content: {
      stem: "Lou's kitchen",
      options: Q17_20_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 20,
    order: 9,
    type: "MATCHING" as const,
    content: {
      stem: "Chip Chop",
      options: Q17_20_OPTIONS,
    },
    correctAnswer: "D",
  },
];

const Q21_22_OPTIONS = [
  { label: "A", text: "Their definitions keep changing." },
  { label: "B", text: "People think they mean the same thing." },
  { label: "C", text: "The term 'eco-friendly' is preferable." },
  { label: "D", text: "They are often used imprecisely." },
  { label: "E", text: "Companies should avoid using them on clothing labels." },
];

const Q23_24_OPTIONS = [
  { label: "A", text: "Sheep are generally well-treated." },
  { label: "B", text: "Wool is easy to recycle." },
  { label: "C", text: "Wool is a long-lasting fabric." },
  { label: "D", text: "Wool production involves few chemicals." },
  { label: "E", text: "Sheep do less environmental damage than other livestock." },
];

const Q25_30_OPTIONS = [
  { label: "A", text: "The production process is fuel efficient." },
  { label: "B", text: "It is the least sustainable of alternative fabrics." },
  { label: "C", text: "Production costs are high." },
  { label: "D", text: "It provides additional health benefits." },
  { label: "E", text: "It is not durable in the long-term." },
  { label: "F", text: "It needs to be produced in a certain way to be sustainable." },
  { label: "G", text: "Chemicals required for production can be reused." },
  { label: "H", text: "This is from a wholly sustainable source." },
];

const SECTION_3_CONTENT = `Questions 21–30
Questions 21 and 22
Choose TWO letters, A–E.
Which TWO points do the speakers make about the terms 'ethical' and 'sustainable' fashion?
A Their definitions keep changing.
B People think they mean the same thing.
C The term 'eco-friendly' is preferable.
D They are often used imprecisely.
E Companies should avoid using them on clothing labels.

Questions 23 and 24
Choose TWO letters, A–E.
Which TWO claims about wool production do the speakers disagree with?
A Sheep are generally well-treated.
B Wool is easy to recycle.
C Wool is a long-lasting fabric.
D Wool production involves few chemicals.
E Sheep do less environmental damage than other livestock.

Questions 25–30
What comment do the speakers make about each of the following semi-synthetic fabrics?
Choose SIX answers from the box and write the correct letter, A–H, next to Questions 25–30.

Comments
A The production process is fuel efficient.
B It is the least sustainable of alternative fabrics.
C Production costs are high.
D It provides additional health benefits.
E It is not durable in the long-term.
F It needs to be produced in a certain way to be sustainable.
G Chemicals required for production can be reused.
H This is from a wholly sustainable source.

Semi-synthetic fabrics
25 Lyocell
26 Cupro
27 Bamboo
28 EcoVero
29 Cork
30 Hemp`;

const SECTION_3_QUESTIONS = [
  {
    number: 21,
    order: 0,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO points do the speakers make about the terms 'ethical' and 'sustainable' fashion?",
      options: Q21_22_OPTIONS,
      selectCount: 2,
      covers: [21, 22],
    },
    correctAnswer: "B",
    acceptableAnswers: ["B", "D"],
  },
  {
    number: 22,
    order: 1,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 21,
    },
    correctAnswer: "D",
    acceptableAnswers: ["B", "D"],
  },
  {
    number: 23,
    order: 2,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO claims about wool production do the speakers disagree with?",
      options: Q23_24_OPTIONS,
      selectCount: 2,
      covers: [23, 24],
    },
    correctAnswer: "D",
    acceptableAnswers: ["D", "E"],
  },
  {
    number: 24,
    order: 3,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 23,
    },
    correctAnswer: "E",
    acceptableAnswers: ["D", "E"],
  },
  {
    number: 25,
    order: 4,
    type: "MATCHING" as const,
    content: {
      stem: "Lyocell",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "G",
  },
  {
    number: 26,
    order: 5,
    type: "MATCHING" as const,
    content: {
      stem: "Cupro",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "B",
  },
  {
    number: 27,
    order: 6,
    type: "MATCHING" as const,
    content: {
      stem: "Bamboo",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "F",
  },
  {
    number: 28,
    order: 7,
    type: "MATCHING" as const,
    content: {
      stem: "EcoVero",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "A",
  },
  {
    number: 29,
    order: 8,
    type: "MATCHING" as const,
    content: {
      stem: "Cork",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "H",
  },
  {
    number: 30,
    order: 9,
    type: "MATCHING" as const,
    content: {
      stem: "Hemp",
      options: Q25_30_OPTIONS,
    },
    correctAnswer: "D",
  },
];

const SECTION_4_CONTENT = `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Invasive species
Definition: an animal or plant that causes harm to an environment after being introduced by humans
An invasive species can be a problem when it:
• eats native species.
• introduces a new 31 ..................................... .
• takes food from native species.
• threatens an entire 32 ..................................... .

How invasive species spread
• accidentally e.g. via people returning from their 33 ..................................... or on cargo ships
• intentionally e.g. for pest control, or as 34 .................................... .

Examples of invasive species
• Rhinella marina (toads)
- were introduced to Australia from Hawaii in 1935 to eat a type of insect that was damaging the 35 ..................................... plantations.
- failed to solve the problem and became widespread in the north of Australia.
- are poisonous for any species that eats them and reduce the food available for native frogs.
• Japanese knotweed plants were popular among 19th-century gardeners in the UK.
• Rhododendron plants prevent 36 ..................................... from reaching native plants.
• Grey squirrels from N. America reduce sources of food for the UK's native red squirrels and spread a 37 ..................................... that kills red squirrels.

Tackling invasive species
• Monitoring helps us to understand the 38 ..................................... of invasive species and the impact they have.
• Setting up a national 39 ..................................... makes it easier to track them.
• Asking the public to 40 ..................................... and report them helps with monitoring.`;

const SECTION_4_QUESTIONS = [
  {
    number: 31,
    order: 0,
    type: "GAP_FILL" as const,
    content: {
      stem: "introduces a new ________ .",
      blank: true,
    },
    correctAnswer: "disease",
  },
  {
    number: 32,
    order: 1,
    type: "GAP_FILL" as const,
    content: {
      stem: "threatens an entire ________ .",
      blank: true,
    },
    correctAnswer: "ecosystem",
  },
  {
    number: 33,
    order: 2,
    type: "GAP_FILL" as const,
    content: {
      stem: "accidentally e.g. via people returning from their ________ or on cargo ships",
      blank: true,
    },
    correctAnswer: "holiday",
    acceptableAnswers: ["holiday", "holidays", "holiday(s)"],
  },
  {
    number: 34,
    order: 3,
    type: "GAP_FILL" as const,
    content: {
      stem: "intentionally e.g. for pest control, or as ________ .",
      blank: true,
    },
    correctAnswer: "pets",
  },
  {
    number: 35,
    order: 4,
    type: "GAP_FILL" as const,
    content: {
      stem: "were introduced to Australia from Hawaii in 1935 to eat a type of insect that was damaging the ________ plantations.",
      blank: true,
    },
    correctAnswer: "sugar",
  },
  {
    number: 36,
    order: 5,
    type: "GAP_FILL" as const,
    content: {
      stem: "Rhododendron plants prevent ________ from reaching native plants.",
      blank: true,
    },
    correctAnswer: "light",
  },
  {
    number: 37,
    order: 6,
    type: "GAP_FILL" as const,
    content: {
      stem: "spread a ________ that kills red squirrels.",
      blank: true,
    },
    correctAnswer: "virus",
  },
  {
    number: 38,
    order: 7,
    type: "GAP_FILL" as const,
    content: {
      stem: "Monitoring helps us to understand the ________ of invasive species and the impact they have.",
      blank: true,
    },
    correctAnswer: "behaviour",
    acceptableAnswers: ["behaviour", "behavior"],
  },
  {
    number: 39,
    order: 8,
    type: "GAP_FILL" as const,
    content: {
      stem: "Setting up a national ________ makes it easier to track them.",
      blank: true,
    },
    correctAnswer: "database",
  },
  {
    number: 40,
    order: 9,
    type: "GAP_FILL" as const,
    content: {
      stem: "Asking the public to ________ and report them helps with monitoring.",
      blank: true,
    },
    correctAnswer: "photograph",
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
