/**
 * Unit checks for src/lib/learn/worksheet-grader.ts
 *   npx tsx scripts/test-worksheet-grader.ts
 */
import { checkAnswer, formatAnswerKey, hasAnswerKey } from "../src/lib/learn/worksheet-grader";

const cases: [input: string, keys: string[], expected: boolean][] = [
  ["on / in", ["at|on / in"], true],
  ["in / in", ["at|on / in"], false],
  ["AT / In", ["at / in"], true],
  ["He has worked here, since 2010", ["He has worked here since 2010."], true],
  ["He is not here", ["He isn’t here"], true],
  ["I've finished", ["I have finished"], true],
  ["He's been to Paris", ["He has been to Paris"], true],
  ["he's tired", ["he is tired"], true],
  ["We'll go", ["we will go"], true],
  ["I'd gone", ["I had gone"], true],
  ["I'd go", ["I would go"], true],
  ["2 weeks", ["two weeks"], true],
  ["can't", ["cannot"], true],
  ["won't", ["will not"], true],
  ["Tom's book", ["Tom's book"], true],
  ["has", ["is"], false],
  ["-", ["-|x|0"], true],
  ["went", ["go"], false],
  ["", ["go"], false],
];

let failed = 0;
for (const [input, keys, expected] of cases) {
  const got = checkAnswer(input, keys).isCorrect;
  if (got !== expected) {
    failed++;
    console.log(`✗ "${input}" vs ${JSON.stringify(keys)}: expected ${expected}, got ${got}`);
  }
}

const checks: [string, boolean][] = [
  ["hasAnswerKey([]) is false", hasAnswerKey([]) === false],
  ["hasAnswerKey(['  ']) is false", hasAnswerKey(["  "]) === false],
  ["formatAnswerKey multi-gap", formatAnswerKey("at|on / in") === "(1) at / on  (2) in"],
  ["formatAnswerKey single gap", formatAnswerKey("isn't|is not") === "isn't / is not"],
];
for (const [name, ok] of checks) {
  if (!ok) {
    failed++;
    console.log(`✗ ${name}`);
  }
}

console.log(failed ? `${failed} check(s) failed` : `All ${cases.length + checks.length} checks passed`);
process.exit(failed ? 1 : 0);
