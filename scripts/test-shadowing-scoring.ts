/**
 * Shadowing content-match grading: number spelling, alignment counts and WER score.
 *
 * Run:
 *   npx tsx scripts/test-shadowing-scoring.ts
 */
import { gradeShadowing, spellOutNumbers } from "../src/lib/shadowing/scoring";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const ref = "The centre opens at eight thirty every morning.";

const perfect = gradeShadowing(ref, "the centre opens at 8:30 every morning");
assert(perfect.score === 100 && perfect.wer === 0, "digits and case/punctuation are normalized");

const missingStart = gradeShadowing(ref, "centre opens at eight thirty every morning");
assert(missingStart.deletionCount === 1 && missingStart.score === 88, "missing first word");

const missingEnd = gradeShadowing(ref, "the centre opens at eight thirty every");
assert(missingEnd.deletionCount === 1, "missing last word");

const substituted = gradeShadowing(ref, "the center opens at eight thirty every morning");
assert(substituted.substitutionCount === 1 && substituted.correctCount === 7, "one substitution");

const extra = gradeShadowing(ref, "the centre opens at eight thirty every single morning");
assert(extra.insertionCount === 1 && extra.score === 88, "one insertion");

const many = gradeShadowing("one two three", "four five six seven eight");
assert(many.score === 0 && many.wer > 1, "WER above 1 clamps score at 0");

const nothing = gradeShadowing(ref, "");
assert(nothing.deletionCount === 8 && nothing.score === 0, "empty recognition = all missing");

let threw = false;
try {
  gradeShadowing(" ... ", "hello");
} catch (err) {
  threw = (err as Error).message === "EMPTY_TRANSCRIPT";
}
assert(threw, "empty reference transcript throws");

assert(spellOutNumbers("9:00 and 12 pounds") === "nine and twelve pounds", "time and numbers");
assert(spellOutNumbers("room 105") === "room one hundred five", "three-digit numbers");
assert(spellOutNumbers("year 2026") === "year 2026", "large numbers are kept");

console.log("shadowing scoring: all assertions passed");
