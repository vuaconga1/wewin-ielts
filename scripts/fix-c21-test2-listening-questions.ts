/**
 * Rebuild Test 16.C21.02 Listening questions from Cambridge 21 PDF.
 * Parts 1 & 2 kept intact (audited correct against PDF).
 * Parts 3 & 4 rebuilt from official PDF pages 36-38 and key page 120.
 *
 * Usage: npx tsx scripts/fix-c21-test2-listening-questions.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FILE = path.resolve("data/tests/test-16-listening.json");

const Q21_22_OPTIONS = [
  { label: "A", text: "the amount of plastic in the ocean" },
  { label: "B", text: "the number of diseases caused by contaminated food" },
  { label: "C", text: "the amount of food that is wasted" },
  { label: "D", text: "the number of people who are obese" },
  { label: "E", text: "the result of treating animals with antibiotics" },
];

const Q23_24_OPTIONS = [
  { label: "A", text: "the new technology it used" },
  { label: "B", text: "the publicity it received" },
  { label: "C", text: "the use of multiple tests on food items" },
  { label: "D", text: "the variety of dietary requirements included" },
  { label: "E", text: "the way information was made widely accessible" },
];

const Q25_26_OPTIONS = [
  { label: "A", text: "sustainable fishing" },
  { label: "B", text: "targeted nutrition" },
  { label: "C", text: "global differences in consumption" },
  { label: "D", text: "sustainable agriculture" },
  { label: "E", text: "digital technology and food" },
];

const Q27_30_OPTIONS = [
  { label: "A", text: "This was challenging but enjoyable." },
  { label: "B", text: "This led to some disagreement." },
  { label: "C", text: "This was easy to decide on." },
  { label: "D", text: "This was helped by the guidelines provided." },
  { label: "E", text: "This seemed like an unnecessary stage." },
  { label: "F", text: "This involved selecting a new ingredient." },
];

const SECTION_3_CONTENT = `Questions 21 and 22
Choose TWO letters, A–E.
Which TWO facts in the sessions on food safety were new information for Nadia and Fergus?
A the amount of plastic in the ocean
B the number of diseases caused by contaminated food
C the amount of food that is wasted
D the number of people who are obese
E the result of treating animals with antibiotics

Questions 23 and 24
Choose TWO letters, A–E.
Which TWO features of a project aiming to prevent food fraud impressed Fergus?
A the new technology it used
B the publicity it received
C the use of multiple tests on food items
D the variety of dietary requirements included
E the way information was made widely accessible

Questions 25 and 26
Choose TWO letters, A–E.
Which TWO topics do both students recommend should be included in the course?
A sustainable fishing
B targeted nutrition
C global differences in consumption
D sustainable agriculture
E digital technology and food

Questions 27–30
Complete the flow-chart below.
Choose FOUR answers from the box and write the correct letter, A–F, next to Questions 27–30.

A This was challenging but enjoyable.
B This led to some disagreement.
C This was easy to decide on.
D This was helped by the guidelines provided.
E This seemed like an unnecessary stage.
F This involved selecting a new ingredient.

Student project: developing a new food product
Initial aim
27 ............................................
Literature review
28 ............................................
Product development
29 ............................................
Product production
30 ............................................`;

const SECTION_4_CONTENT = `Questions 31–40
Complete the notes below.
Write ONE WORD ONLY for each answer.

Challenges facing the cruise ship industry
Problems with overtourism
• 31 ............................................ is one of the worst problems.
• A tourist 32 ............................................ is being introduced in some cities to reduce numbers, e.g. Barcelona.
• Bruges: action was taken to limit day trips from the nearby port because the city was becoming a 'theme park' (e.g. many shops were only stocking 33 ............................................ and souvenirs).
• Dubrovnik: limits the number of tourists by managing the 34 ............................................ of cruise ship arrivals.

Problems of perception
• Cruises are generally associated with the elderly.
• There is an assumption about the 35 ............................................ of cruises.
• People think there may be too many 36 ............................................ .

Solutions
Cruise lines are attracting younger customers by:
• becoming more sustainable e.g. using hybrid engines.
• having a wide range of activities e.g. boxing, 37 ............................................ and well-being programmes.
• offering a diverse selection of food including 38 ............................................ options.
• providing reliable 39 ............................................ .
• improving marketing on social media with high quality 40 ............................................ .`;

const SECTION_3_QUESTIONS = [
  {
    number: 21,
    order: 0,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO facts in the sessions on food safety were new information for Nadia and Fergus?",
      options: Q21_22_OPTIONS,
      selectCount: 2,
      covers: [21, 22],
    },
    correctAnswer: "B",
    acceptableAnswers: ["B", "E"],
  },
  {
    number: 22,
    order: 1,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 21,
    },
    correctAnswer: "E",
    acceptableAnswers: ["B", "E"],
  },
  {
    number: 23,
    order: 2,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO features of a project aiming to prevent food fraud impressed Fergus?",
      options: Q23_24_OPTIONS,
      selectCount: 2,
      covers: [23, 24],
    },
    correctAnswer: "C",
    acceptableAnswers: ["C", "D"],
  },
  {
    number: 24,
    order: 3,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 23,
    },
    correctAnswer: "D",
    acceptableAnswers: ["C", "D"],
  },
  {
    number: 25,
    order: 4,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "Which TWO topics do both students recommend should be included in the course?",
      options: Q25_26_OPTIONS,
      selectCount: 2,
      covers: [25, 26],
    },
    correctAnswer: "A",
    acceptableAnswers: ["A", "C"],
  },
  {
    number: 26,
    order: 5,
    type: "MULTIPLE_CHOICE" as const,
    content: {
      stem: "",
      pairedFrom: 25,
    },
    correctAnswer: "C",
    acceptableAnswers: ["A", "C"],
  },
  {
    number: 27,
    order: 6,
    type: "MATCHING" as const,
    content: {
      stem: "Initial aim",
      options: Q27_30_OPTIONS,
    },
    correctAnswer: "C",
  },
  {
    number: 28,
    order: 7,
    type: "MATCHING" as const,
    content: {
      stem: "Literature review",
      options: Q27_30_OPTIONS,
    },
    correctAnswer: "D",
  },
  {
    number: 29,
    order: 8,
    type: "MATCHING" as const,
    content: {
      stem: "Product development",
      options: Q27_30_OPTIONS,
    },
    correctAnswer: "F",
  },
  {
    number: 30,
    order: 9,
    type: "MATCHING" as const,
    content: {
      stem: "Product production",
      options: Q27_30_OPTIONS,
    },
    correctAnswer: "A",
  },
];

const SECTION_4_QUESTIONS = [
  {
    number: 31,
    order: 0,
    type: "GAP_FILL" as const,
    content: {
      stem: "________ is one of the worst problems.",
      blank: true,
    },
    correctAnswer: "pollution",
    acceptableAnswers: ["pollution", "Pollution"],
  },
  {
    number: 32,
    order: 1,
    type: "GAP_FILL" as const,
    content: {
      stem: "A tourist ________ is being introduced in some cities to reduce numbers, e.g. Barcelona.",
      blank: true,
    },
    correctAnswer: "tax",
  },
  {
    number: 33,
    order: 2,
    type: "GAP_FILL" as const,
    content: {
      stem: "Bruges: many shops were only stocking ________ and souvenirs.",
      blank: true,
    },
    correctAnswer: "chocolate",
  },
  {
    number: 34,
    order: 3,
    type: "GAP_FILL" as const,
    content: {
      stem: "Dubrovnik: limits the number of tourists by managing the ________ of cruise ship arrivals.",
      blank: true,
    },
    correctAnswer: "timing",
  },
  {
    number: 35,
    order: 4,
    type: "GAP_FILL" as const,
    content: {
      stem: "There is an assumption about the ________ of cruises.",
      blank: true,
    },
    correctAnswer: "cost",
  },
  {
    number: 36,
    order: 5,
    type: "GAP_FILL" as const,
    content: {
      stem: "People think there may be too many ________ .",
      blank: true,
    },
    correctAnswer: "rules",
  },
  {
    number: 37,
    order: 6,
    type: "GAP_FILL" as const,
    content: {
      stem: "having a wide range of activities e.g. boxing, ________ and well-being programmes.",
      blank: true,
    },
    correctAnswer: "diving",
  },
  {
    number: 38,
    order: 7,
    type: "GAP_FILL" as const,
    content: {
      stem: "offering a diverse selection of food including ________ options.",
      blank: true,
    },
    correctAnswer: "vegan",
  },
  {
    number: 39,
    order: 8,
    type: "GAP_FILL" as const,
    content: {
      stem: "providing reliable ________ .",
      blank: true,
    },
    correctAnswer: "wifi",
    acceptableAnswers: ["wifi", "Wi-Fi", "wi-fi", "WiFi"],
  },
  {
    number: 40,
    order: 9,
    type: "GAP_FILL" as const,
    content: {
      stem: "improving marketing on social media with high quality ________ .",
      blank: true,
    },
    correctAnswer: "videos",
  },
];

function main() {
  const data = JSON.parse(readFileSync(FILE, "utf-8"));
  if (data.parts.length !== 4) {
    throw new Error(`Expected 4 parts, found ${data.parts.length}`);
  }

  // Section 3
  data.parts[2].content = SECTION_3_CONTENT;
  data.parts[2].questions = SECTION_3_QUESTIONS;

  // Section 4
  data.parts[3].content = SECTION_4_CONTENT;
  data.parts[3].questions = SECTION_4_QUESTIONS;

  writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Successfully updated ${FILE}`);

  // Print all 40 questions and verify
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
