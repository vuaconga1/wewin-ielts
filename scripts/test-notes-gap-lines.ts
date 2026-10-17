/**
 * A notes line that holds a numbered gap is never instruction text, even when
 * it starts with "Choose" / "According to" or contains "no more than".
 *
 * Run:
 *   npx tsx scripts/test-notes-gap-lines.ts
 */

import { parseReadingQuestionGroups, splitReadingPassageAndTasks } from "../src/lib/practice/reading-content";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function gaps(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => ({
    number: from + i,
    type: "GAP_FILL",
    content: { stem: "", blank: true },
  }));
}

function check(name: string, tasks: string, from: number, to: number, gapLine: RegExp) {
  const group = parseReadingQuestionGroups(tasks, gaps(from, to)).find((g) => g.start === from);
  assert(group, `${name}: group ${from}-${to}`);
  assert(
    !group.instructions.some((line) => gapLine.test(line)),
    `${name}: the gap line is not an instruction (got ${JSON.stringify(group.instructions)})`,
  );
  assert(gapLine.test(group.notes), `${name}: the gap line stays in the notes`);
  assert(!group.instructions.some((line) => line.includes("[[b")), `${name}: no bullet marker in instructions`);
}

function main() {
  check(
    "C12 T5-R Q22",
    `Questions 21–27
Complete the notes below.
Choose ONE WORD ONLY from the text for each answer.
Write your answers in boxes 21–27 on your answer sheet.
[[box]]
[[ntitle]]Working Time Regulations for Mobile Workers[[/ntitle]]
[[b0]]These apply to people working on lorries, buses, etc.
[[b0]]They don't apply to 21 ............... workers.
[[b0]]Maximum working hours: 60 hours a week, provided the 22 ............... is no more than 48 hours.
[[b0]]Night work can be more than 10 hours with the 23 ............... of the workers.
[[/box]]`,
    21,
    23,
    /provided the 22/,
  );

  check(
    "C12 T8-R Q23",
    `Questions 21–27
Complete the flow-chart below.
Choose NO MORE THAN TWO WORDS from the text for each answer.
Write your answers in boxes 21–27 on your answer sheet.
How to run a successful project
Bear in mind that your aim should be to keep to both the agreed deadline and the 21 ............... for the project.
↓
Fix the details at the start to prevent what is called 22 ............... – the client asking for more and more.
↓
Choose the team members wisely so that their 23 ............... match the duties you want them to take on.
↓
Promote good 24 ............... at all times so everyone knows what you require of them.`,
    21,
    24,
    /team members wisely so that their 23/,
  );

  check(
    "C12 T5-L Q40",
    `Questions 31–40
Complete the notes below.
Write NO MORE THAN TWO WORDS for each answer.
Four business values
Many business values can result in 31 ............... .
Excellence
According to one study, on average, pioneers had a 40 ............... that was far higher than that of followers.
Companies that always aim at excellence may miss opportunities.`,
    31,
    40,
    /pioneers had a 40/,
  );

  const plain = parseReadingQuestionGroups(
    `Questions 1–3
Complete the sentences below.
Choose NO MORE THAN TWO WORDS from the passage for each answer.
1 The bridge was built in ______ .`,
    gaps(1, 3),
  ).find((g) => g.start === 1);
  assert(
    plain?.instructions.some((line) => /NO MORE THAN TWO WORDS/.test(line)),
    "a real word-limit instruction is still an instruction",
  );

  const cut = splitReadingPassageAndTasks(`Automata

The first automata were built in ancient Greece.

Questions 31–35

Look at the following descriptions (

Questions 31–35) and the list of people below.

Match each description with the correct person, A–G.

31 created an automaton that represented a bird in water

32 created an automaton that performed on a musical instrument

List of People

A  Ctesibius

B  Arab engineers

C  da Vinci`).tasks;
  const people = parseReadingQuestionGroups(cut, [
    { number: 31, type: "MATCHING", content: { stem: "created an automaton that represented a bird in water" } },
    { number: 32, type: "MATCHING", content: { stem: "created an automaton that performed on a musical instrument" } },
  ]).find((g) => g.start === 31);
  assert(
    people?.instructions.includes(
      "Look at the following descriptions (Questions 31–35) and the list of people below.",
    ),
    `C12 T5-R: the instruction cut at "(" is whole again (got ${JSON.stringify(people?.instructions)})`,
  );

  const colon = parseReadingQuestionGroups(
    `Questions 21-25:\u0020

Read the statements below and decide if they are\u0020

TRUE  if the statement agrees with the information

21. Beethoven learned to play music from only one teacher during his life.

22. Beethoven changed the title of his Third Symphony because he was upset with Napoleon.

Questions 26-30:\u0020

Choose the correct answer (A, B, C, or D) for each question according to the text.

26. What made Beethoven's childhood difficult?

A. He had no teachers to show him how to play instruments.

B. His father was very strict and forced him to practice for long hours.`,
    [
      { number: 21, type: "TRUE_FALSE_NG", content: { stem: "Beethoven learned to play music from only one teacher during his life." } },
      { number: 22, type: "TRUE_FALSE_NG", content: { stem: "Beethoven changed the title of his Third Symphony because he was upset with Napoleon." } },
      { number: 26, type: "MULTIPLE_CHOICE", content: { stem: "What made Beethoven's childhood difficult?" } },
    ],
  );
  const tfng = colon.find((g) => g.start === 21);
  const mcq = colon.find((g) => g.start === 26);
  assert(tfng?.end === 25 && tfng.header === "Questions 21-25", `grade-8: "Questions 21-25:" is a group header (got ${JSON.stringify(colon.map((g) => g.header))})`);
  assert(
    tfng.instructions.some((line) => line.startsWith("Read the statements below")),
    "grade-8: the TFNG instruction belongs to Questions 21-25",
  );
  assert(
    mcq?.end === 30 && mcq.instructions.some((line) => line.startsWith("Choose the correct answer")),
    "grade-8: the MCQ instruction belongs to Questions 26-30",
  );

  console.log("notes gap lines ok");
}

main();
