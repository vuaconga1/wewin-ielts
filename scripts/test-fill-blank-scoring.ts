/**
 * Fill-blank dictation: tokenization, gap validation, public segments and grading.
 *
 * Run:
 *   npx tsx scripts/test-fill-blank-scoring.ts
 */
import {
  buildPublicSegments,
  buildResultSegments,
  FillBlankConfigError,
  gradeFillBlank,
  hiddenRatio,
  normalizeAnswer,
  readGaps,
  validateGaps,
} from "../src/lib/dictation/fill-blank";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function throwsCode(fn: () => unknown, code: string): boolean {
  try {
    fn();
  } catch (err) {
    return err instanceof FillBlankConfigError && err.code === code;
  }
  return false;
}

// Plan example: "I'd like to [book] a room for [two] nights."
const plan = "I'd like to book a room for two nights.";
const planGaps = validateGaps(
  [
    { id: "gap-2", startToken: 7, endToken: 8 },
    { id: "gap-1", startToken: 3, endToken: 4 },
  ],
  plan,
);
assert(same(planGaps.map((g) => g.id), ["gap-1", "gap-2"]), "gaps sorted by position");

const segments = buildPublicSegments(plan, planGaps);
assert(
  same(segments, [
    { type: "text", text: "I'd like to " },
    { type: "gap", id: "gap-1", index: 0 },
    { type: "text", text: " a room for " },
    { type: "gap", id: "gap-2", index: 1 },
    { type: "text", text: " nights." },
  ]),
  "public segments hide only the gap words",
);
assert(!JSON.stringify(segments).includes("book"), "public payload never contains the answer");

const perfect = gradeFillBlank(plan, planGaps, { "gap-1": "book", "gap-2": "two" });
assert(perfect.score === 100 && perfect.correctCount === 2 && perfect.totalGaps === 2, "exact answers");

const loose = gradeFillBlank(plan, planGaps, { "gap-1": "  BOOK. ", "gap-2": "Two!" });
assert(loose.score === 100, "case, punctuation and spaces ignored");

const half = gradeFillBlank(plan, planGaps, { "gap-1": "book", "gap-2": "   " });
assert(half.score === 50, "1/2 → 50");
assert(same(half.gapResults.map((r) => r.status), ["correct", "blank"]), "whitespace-only is blank");

const wrong = gradeFillBlank(plan, planGaps, { "gap-1": "look" });
assert(wrong.score === 0, "wrong + blank → 0, no negative marking");
assert(
  same(wrong.gapResults.map((r) => r.status), ["incorrect", "blank"]),
  "wrong and blank statuses",
);
assert(wrong.gapResults[0].expected === "book" && wrong.gapResults[0].submitted === "look", "expected/submitted kept");

// Multi-word gap must be fully correct; trailing punctuation stays outside the gap.
const multi = "The centre opens at eight thirty every morning.";
const multiGaps = validateGaps([{ id: "t", startToken: 4, endToken: 6 }], multi);
assert(gradeFillBlank(multi, multiGaps, { t: "eight thirty" }).score === 100, "multi-word correct");
assert(gradeFillBlank(multi, multiGaps, { t: "eight thirteen" }).score === 0, "one wrong word fails the gap");
assert(gradeFillBlank(multi, multiGaps, { t: "8:30" }).score === 100, "number words ≡ digits (8:30)");
assert(gradeFillBlank(multi, multiGaps, { t: "8 30" }).score === 100, "number words ≡ digits (8 30)");

// Number words ↔ digits
const years = "I have been here for twenty-five years.";
const yearsGap = validateGaps([{ id: "y", startToken: 5, endToken: 7 }], years);
assert(gradeFillBlank(years, yearsGap, { y: "25 years" }).score === 100, "25 years ≡ twenty-five years");
assert(gradeFillBlank(years, yearsGap, { y: "twenty five years" }).score === 100, "unhyphenated words");
assert(gradeFillBlank(years, yearsGap, { y: "52 years" }).score === 0, "wrong number still wrong");
assert(normalizeAnswer("one hundred and twenty") === normalizeAnswer("120"), "hundreds with and");
assert(normalizeAnswer("a hundred candles") === normalizeAnswer("100 candles"), "a hundred");
assert(normalizeAnswer("two thousand and five") === normalizeAnswer("2005"), "thousands");
assert(normalizeAnswer("the twenty-first century") === normalizeAnswer("the 21st century"), "ordinals");
assert(normalizeAnswer("1,000 people") === normalizeAnswer("one thousand people"), "thousand separator");
assert(normalizeAnswer("one two three") === normalizeAnswer("1 2 3"), "digit sequence stays split");
assert(normalizeAnswer("Hundreds of people") === "hundreds of people", "non-number words untouched");
const withAccepted = validateGaps(
  [{ id: "t", startToken: 4, endToken: 6, acceptedAnswers: ["8:30", " 8.30 ", ""] }],
  multi,
);
assert(same(withAccepted[0].acceptedAnswers, ["8:30"]), "accepted answers cleaned (8.30 ≡ 8:30 after normalize)");
assert(gradeFillBlank(multi, withAccepted, { t: "8:30" }).score === 100, "accepted answer");

const endGap = "Please call me tomorrow.";
const endGaps = validateGaps([{ id: "e", startToken: 3, endToken: 4 }], endGap);
assert(
  same(buildPublicSegments(endGap, endGaps).at(-1), { type: "text", text: "." }),
  "sentence-final punctuation stays visible",
);

// Apostrophes, numbers and Unicode
assert(normalizeAnswer("Don’t") === normalizeAnswer("don't"), "curly vs straight apostrophe");
assert(normalizeAnswer("don't") !== normalizeAnswer("do not"), "contractions not expanded");
assert(normalizeAnswer("Café") === "café", "unicode kept");
const uni = "We met at the café on 12 Rue Saint-Denis.";
const uniGaps = validateGaps(
  [
    { id: "a", startToken: 4, endToken: 5 },
    { id: "b", startToken: 6, endToken: 7 },
  ],
  uni,
);
assert(gradeFillBlank(uni, uniGaps, { a: "Café", b: "12" }).score === 100, "unicode + number gaps");

// Invalid configurations are rejected
assert(throwsCode(() => validateGaps([], plan), "NO_GAPS"), "no gaps rejected");
assert(throwsCode(() => validateGaps(null, plan), "NO_GAPS"), "missing gaps rejected");
assert(
  throwsCode(() => validateGaps([{ id: "x", startToken: 8, endToken: 10 }], plan), "INVALID_GAPS"),
  "out of range rejected",
);
assert(
  throwsCode(() => validateGaps([{ id: "x", startToken: 2, endToken: 2 }], plan), "INVALID_GAPS"),
  "empty gap rejected",
);
assert(
  throwsCode(
    () =>
      validateGaps(
        [
          { id: "x", startToken: 1, endToken: 3 },
          { id: "y", startToken: 2, endToken: 4 },
        ],
        plan,
      ),
    "INVALID_GAPS",
  ),
  "overlap rejected",
);
assert(
  throwsCode(
    () =>
      validateGaps(
        [
          { id: "x", startToken: 1, endToken: 2 },
          { id: "x", startToken: 3, endToken: 4 },
        ],
        plan,
      ),
    "INVALID_GAPS",
  ),
  "duplicate id rejected",
);
assert(
  throwsCode(() => validateGaps([{ id: "x", startToken: 1, endToken: 2 }], "Wait — what?"), "INVALID_GAPS"),
  "punctuation-only gap rejected",
);

let threw = false;
try {
  gradeFillBlank(plan, [], {});
} catch {
  threw = true;
}
assert(threw, "grading without gaps throws");

// Lenient read drops gaps that no longer fit an edited transcript
assert(readGaps(planGaps, "I'd like to book").length === 1, "out-of-range stored gap dropped");

// Review segments only when stored results still line up with the exercise
const results = perfect.gapResults;
assert(buildResultSegments(plan, planGaps, results)?.length === 5, "result segments rebuilt");
const edited = "I'd like to rent a room for two nights.";
assert(buildResultSegments(edited, planGaps, results) === null, "edited transcript → no inline review");

assert(Math.abs(hiddenRatio(plan, planGaps) - 2 / 9) < 1e-9, "hidden ratio");

console.log("test-fill-blank-scoring: OK");
