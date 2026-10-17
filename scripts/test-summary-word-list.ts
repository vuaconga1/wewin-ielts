/**
 * A short A–G list only belongs to the gaps of its own "Questions x–y" group.
 *
 * Run:
 *   npx tsx scripts/test-summary-word-list.ts
 */

import { withSummaryWordList } from "../src/lib/practice/reading-content";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const C12_T5_R = `Questions 28–30
Complete the summary below.
Choose ONE WORD ONLY from the text for each answer.
Write your answers in boxes 28–30 on your answer sheet.
Automata and the ancient Greeks
The ancient Greeks had a number of 28 ............... concerning automata. The mechanism consisted of 29 ............... which were worked by human operators. Some automata were designed to be 30 ............... with an educational purpose.
Questions 31–35
Look at the following descriptions (
Questions 31–35) and the list of people below.
Match each description with the correct person, A–G.
Write the correct letter, A–G, in boxes 31–35 on your answer sheet.
31 created an automaton that represented a bird in water
32 created an automaton that performed on a musical instrument
List of People
A  Ctesibius
B  Arab engineers
C  da Vinci
D  Maillardet
E  Vaucanson
F  Merlin
G  Jaquet-Droz`;

const SUMMARY_BANK = `Questions 1–3
Complete the summary using the list of words, A–E, below.
The museum opened in 1 ............... and attracted many 2 ............... from abroad, mostly 3 ............... .
A tourists
B students
C 1990
D families
E teachers`;

function q(number: number) {
  return { number, type: "GAP_FILL", content: { stem: "", blank: true } as { stem: string; blank: boolean; options?: { label: string; text: string }[] } };
}

function main() {
  const people = withSummaryWordList([28, 29, 30, 31, 32].map(q), C12_T5_R);
  for (const n of [28, 29, 30]) {
    const got = people.find((item) => item.number === n)!;
    assert(
      !(got.content.options?.length),
      `C12 T5-R Q${n}: the people list of Q31–35 is not a word bank for the summary`,
    );
    assert(got.type === "GAP_FILL", `C12 T5-R Q${n}: stays a gap fill`);
  }

  const bank = withSummaryWordList([1, 2, 3].map(q), SUMMARY_BANK);
  assert(
    bank.every((item) => item.content.options?.length === 5),
    "a summary word list under the same header still feeds its gaps",
  );

  console.log("summary word list ok");
}

main();
