/**
 * Dictation grading: normalization, word alignment and score.
 *
 * Run:
 *   npx tsx scripts/test-dictation-scoring.ts
 */
import {
  gradeDictation,
  normalizeText,
  parseDictationSettings,
} from "../src/lib/dictation/scoring";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

assert(
  same(normalizeText("I'd like to book a room."), [
    "i'd", "like", "to", "book", "a", "room",
  ]),
  "normalize transcript",
);
assert(
  same(normalizeText("I’D  like   to book a room!"), [
    "i'd", "like", "to", "book", "a", "room",
  ]),
  "normalize answer (case, spaces, curly apostrophe)",
);

const plan = gradeDictation("I would like to book a room", "I like book a rooms");
const byStatus = (s: string) =>
  plan.wordResults.filter((r) => r.status === s);
assert(
  same(byStatus("correct").map((r) => "expected" in r && r.expected), ["I", "like", "book", "a"]),
  "plan example: correct words",
);
assert(
  same(byStatus("missing").map((r) => "expected" in r && r.expected), ["would", "to"]),
  "plan example: missing words",
);
const wrong = byStatus("incorrect")[0];
assert(
  byStatus("incorrect").length === 1 &&
    wrong.status === "incorrect" &&
    wrong.expected === "room" &&
    wrong.actual === "rooms" &&
    wrong.nearMiss,
  "plan example: rooms → room is a near-miss substitution",
);
assert(byStatus("extra").length === 0, "plan example: no extra words");
assert(plan.score === 57 && plan.correctCount === 4 && plan.totalWords === 7, "plan example score");

const perfect = gradeDictation("Hello, World!", "hello world");
assert(perfect.score === 100, "case and punctuation are ignored");

const extra = gradeDictation("book a room", "please book a nice room");
assert(extra.score === 100, "extra words do not reduce below correct ratio");
assert(same(extra.errorSummary.extra, ["please", "nice"]), "extra words listed");

const eight = gradeDictation(
  "one two three four five six seven eight",
  "one two three four five six",
);
assert(eight.score === 75, "6/8 → 75");

const empty = gradeDictation("one two", "");
assert(empty.score === 0 && empty.errorSummary.missing.length === 2, "empty answer");

let threw = false;
try {
  gradeDictation("  ... ", "x");
} catch {
  threw = true;
}
assert(threw, "empty transcript rejected");

const settings = parseDictationSettings({ maxListenCount: "3", playbackRates: [0.5, 9, 0.75] });
assert(settings.maxListenCount === 3, "max listen count parsed");
assert(same(settings.playbackRates, [0.5, 0.75, 1]), "rates filtered and include 1");
assert(parseDictationSettings(null).maxListenCount === null, "default unlimited");

console.log("test-dictation-scoring: OK");
