/**
 * "Write the correct letter, A–H" groups answer with a letter dropdown.
 *
 * Run:
 *   npx tsx scripts/test-letter-range.ts
 */
import { letterRangeOptions } from "../src/lib/practice/letter-range";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const letters = (text: string, n: number) =>
  letterRangeOptions(text, n)?.map((o) => o.label).join("") ?? "";

const albany = `Questions 11-20

Questions 11-14

Choose the correct letter A, B or C.

Participants without a fishing license are recommended to apply for one
A. at the registration desk.
B. over the phone.

Questions 15-20 Label the map below.

Write the correct letter, A - I, next to questions 15-20.

Albany Fishing Competition Map`;
assert(letters(albany, 15) === "ABCDEFGHI", "spaced hyphen A - I");
assert(letters(albany, 20) === "ABCDEFGHI", "last number of the map group");
assert(letters(albany, 12) === "", "MCQ group 'A, B or C' is not a letter range");

const library = `Questions 11-16

Label the floor plan.

Write the correct letter, A\u2014F, for each answer.

11 ........ Quiet reading

Questions 17-20

Complete the timetable.

Write the correct letter, A-J, for each answer.

17 ........ Teacher-led discussion`;
assert(letters(library, 11) === "ABCDEF", "em dash A—F");
assert(letters(library, 17) === "ABCDEFGHIJ", "next group has its own range");

const zoo = `Questions 11-20

Questions 11-15

Choose the correct letter, A, B or C.

Questions 16 \u2013 20

Label the map below

Write the correct letter, A-G, next to \u0020

Question 16-20
`;
assert(letters(zoo, 16) === "ABCDEFG", "en dash header, instruction wrapped over lines");
assert(letters(zoo, 14) === "", "question outside the map group");

assert(letters("Questions 1-5\nWrite NO MORE THAN TWO WORDS.", 3) === "", "gap group has no letters");
assert(letters("Write the correct letter, A-G.", 3) === "", "no Questions header covering the number");
assert(
  letters("Questions 1-4\nWrite the correct letters, A-D, next to questions 1-4.", 2) === "ABCD",
  "plural 'letters'",
);
assert(
  letterRangeOptions("Questions 1-4\nWrite the correct letter, A-D.", 1)?.[0]?.text === "A",
  "options carry the letter as text",
);

console.log("letter range: ok");
