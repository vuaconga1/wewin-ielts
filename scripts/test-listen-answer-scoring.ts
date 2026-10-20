/**
 * Listen & answer: question validation and deterministic keyword grading.
 *
 * Run:
 *   npx tsx scripts/test-listen-answer-scoring.ts
 */
import {
  gradeListenAnswer,
  gradeQuestion,
  ListenAnswerConfigError,
  parseQuestionsJson,
  readQuestions,
  toPublicQuestions,
  validateQuestions,
} from "../src/lib/dictation/listen-answer";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function throwsCode(fn: () => unknown, code: string): boolean {
  try {
    fn();
  } catch (err) {
    return err instanceof ListenAnswerConfigError && err.code === code;
  }
  return false;
}

// Audio: James wipes the board, Kathy sweeps the floor, John takes out the trash.
const [whoTrash, jamesDoing, kathyOrJames, library, exactBus] = validateQuestions([
  { id: "q1", prompt: "Who takes out the trash?", answers: ["John"], match: "KEYWORD" },
  {
    id: "q2",
    prompt: "What does James do?",
    answers: ["wipes the board", "wipe the board", "wiped the board", "wiping the board", "cleans the board"],
    match: "KEYWORD",
  },
  {
    id: "q3",
    prompt: "Who sweeps the floor, Kathy or James?",
    answers: ["Kathy"],
    rejectAnswers: ["James"],
    match: "KEYWORD",
  },
  {
    id: "q4",
    prompt: "Where does Anna study after school?",
    answers: ["in the library"],
    match: "EXACT",
    maxWords: 4,
  },
  { id: "q5", prompt: "How does she travel?", answers: ["by bus", "on the bus"], match: "EXACT" },
]);

const status = (q: Parameters<typeof gradeQuestion>[0], a: string) => gradeQuestion(q, a).status;
const reason = (q: Parameters<typeof gradeQuestion>[0], a: string) => gradeQuestion(q, a).reason;

// Keyword: answer only needs to contain the accepted phrase as whole words.
assert(status(whoTrash, "John") === "correct", "bare keyword");
assert(status(whoTrash, "john.") === "correct", "case + punctuation");
assert(status(whoTrash, "It is John who takes out the trash") === "correct", "keyword inside a sentence");
assert(status(whoTrash, "Johnny") === "incorrect", "keyword must be a whole word");
assert(status(whoTrash, "Kathy") === "incorrect", "wrong person");
assert(status(whoTrash, "   ") === "blank", "blank");
assert(reason(whoTrash, "Not John") === "NEGATED", "negation is not a correct answer");
assert(reason(whoTrash, "John didn't") === "NEGATED", "contraction negation");

assert(status(jamesDoing, "James wiped the board") === "correct", "declared variant in a sentence");
assert(status(jamesDoing, "He is wiping the board.") === "correct", "-ing variant");
assert(status(jamesDoing, "James takes out the trash") === "incorrect", "other chore");
assert(status(jamesDoing, "the board") === "incorrect", "partial phrase is not enough");

// Either-or choice: naming both options is not an answer.
assert(status(kathyOrJames, "Kathy") === "correct", "choice correct");
assert(status(kathyOrJames, "Kathy sweeps the floor") === "correct", "choice in sentence");
assert(reason(kathyOrJames, "Kathy or James") === "WRONG_OPTION", "both options rejected");
assert(status(kathyOrJames, "James") === "incorrect", "wrong option");

// Exact + word limit (the 3–4 word table from the proposal).
assert(status(library, "In the library") === "correct", "case-insensitive");
assert(status(library, "in the library.") === "correct", "punctuation ignored");
assert(status(library, "  in   the  library ") === "correct", "whitespace collapsed");
assert(status(library, "at the library") === "incorrect", "undeclared preposition");
assert(status(library, "in a library") === "incorrect", "undeclared article");
assert(status(library, "in the school library") === "incorrect", "extra word, exact mode");
assert(reason(library, "she studies in the library") === "TOO_MANY_WORDS", "word limit");

assert(status(exactBus, "on the bus") === "correct", "declared alternative");
assert(status(exactBus, "by the bus") === "incorrect", "undeclared alternative");

// Whole exercise score.
const grade = gradeListenAnswer([whoTrash, kathyOrJames, library], {
  q1: "John",
  q3: "Kathy or James",
});
assert(grade.correctCount === 1 && grade.totalQuestions === 3, "counts");
assert(grade.score === 33, `score ${grade.score}`);
assert(grade.questionResults[2].status === "blank", "missing answer counts as blank");
assert(grade.questionResults[0].prompt === whoTrash.prompt, "prompt snapshot");

// Validation.
assert(throwsCode(() => validateQuestions([]), "NO_QUESTIONS"), "empty list");
assert(
  throwsCode(() => validateQuestions([{ id: "a", prompt: "x", answers: [] }]), "INVALID_QUESTIONS"),
  "needs an answer",
);
assert(
  throwsCode(
    () =>
      validateQuestions([
        { id: "a", prompt: "x", answers: ["y"] },
        { id: "a", prompt: "z", answers: ["w"] },
      ]),
    "INVALID_QUESTIONS",
  ),
  "duplicate ids",
);
assert(
  throwsCode(
    () => validateQuestions([{ id: "a", prompt: "x", answers: ["Kathy"], rejectAnswers: ["kathy"] }]),
    "INVALID_QUESTIONS",
  ),
  "reject overlaps accepted",
);
assert(
  throwsCode(() => validateQuestions([{ id: "a", prompt: "x", answers: ["y"], maxWords: 0 }]), "INVALID_QUESTIONS"),
  "bad word limit",
);
assert(readQuestions([{ id: "a", prompt: "x", answers: ["y"] }, { bad: true }]).length === 1, "lenient read");

// Public payload never carries answers.
const pub = JSON.stringify(toPublicQuestions([whoTrash, kathyOrJames]));
assert(!pub.includes("John") && !pub.includes("James\""), "public payload hides answers");

// JSON paste in the proposal's shape.
const pasted = parseQuestionsJson(
  JSON.stringify([
    {
      question: "Where does Anna study after school?",
      correctAnswers: ["in the library", "in a library"],
      minWords: 3,
      maxWords: 4,
      points: 1,
    },
    { question: "Who sweeps?", answer: "Kathy", wrongAnswers: ["James"], matchMode: "keyword" },
  ]),
  (i) => `q${i + 10}`,
);
assert(pasted.length === 2 && pasted[0].id === "q10" && pasted[0].maxWords === 4, "json paste");
assert(pasted[0].answers.length === 2 && pasted[1].rejectAnswers?.[0] === "James", "json aliases");
assert(throwsCode(() => parseQuestionsJson("{oops", () => "x"), "INVALID_QUESTIONS"), "bad json");

console.log("listen-answer scoring: all checks passed");
