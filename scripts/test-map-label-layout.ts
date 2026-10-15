import { normalizeMapLabelPart } from "../src/lib/questions/map-label-layout";
import type { QuestionDraft } from "../src/lib/import/schemas";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const options = ["A", "B", "C"].map((label) => ({ label, text: label }));
const numbered: QuestionDraft[] = [11, 12].map((number) => ({
  number,
  order: number - 11,
  type: "MATCHING",
  content: { stem: number === 11 ? "Bike sheds" : "Snack shop", options },
}));
const numberedResult = normalizeMapLabelPart(
  "Questions 11-12\nLabel the map below.\nWrite the correct letter, A-C, next to questions 11-12.\n11. Bike sheds\n12. Snack shop",
  numbered,
);
assert(!numberedResult.content?.includes("11. Bike sheds"), "static numbered map row is removed");
assert(numberedResult.questions.every((q) => q.type === "MAP_LABELING"), "map rows use MAP_LABELING");
assert(numberedResult.questions[0]!.content.stem === "Bike sheds _____", "input marker stays on label row");
assert(!("options" in numberedResult.questions[0]!.content), "letter-only matching options are removed");

const unnumbered: QuestionDraft[] = [15, 16].map((number) => ({
  number,
  order: number - 15,
  type: "MAP_LABELING",
  content: { stem: "", blank: true },
}));
const unnumberedResult = normalizeMapLabelPart(
  "Questions 15-16 Label the map below.\nWrite the correct letter, A-D.\nRegistration area ........\nDining area ........",
  unnumbered,
);
assert(unnumberedResult.questions[0]!.content.stem === "Registration area _____", "unnumbered first label is recovered");
assert(unnumberedResult.questions[1]!.content.stem === "Dining area _____", "unnumbered labels preserve order");
assert(!unnumberedResult.content?.includes("Registration area"), "unnumbered static rows are removed");

const secondPass = normalizeMapLabelPart(unnumberedResult.content, unnumberedResult.questions);
assert(JSON.stringify(secondPass.questions) === JSON.stringify(unnumberedResult.questions), "normalization is idempotent");
console.log("map label layout regression: ok");