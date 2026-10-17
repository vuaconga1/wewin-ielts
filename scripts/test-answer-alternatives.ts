/**
 * Answer keys with "/" accept either alternative; parenthesised text is optional.
 *
 * Run:
 *   npx tsx scripts/test-answer-alternatives.ts
 */

import { checkExerciseAnswer } from "../src/lib/learn/store";
import {
  gradeAnswers,
  isAnswerCorrect,
  matchMultiSelectAnswers,
} from "../src/lib/scoring";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function main() {
  assert(isAnswerCorrect("ádasd", "ádasd/ádag"), "slash: left side");
  assert(isAnswerCorrect("ádag", "ádasd/ádag"), "slash: right side");
  assert(isAnswerCorrect("ÁDASD", "ádasd/ádag"), "slash: case fold");
  assert(isAnswerCorrect("ádasd/ádag", "ádasd/ádag"), "slash: full key still accepted");
  assert(
    isAnswerCorrect("ádasd / ádag", "ádasd/ádag"),
    "slash: spaced full key still accepted",
  );
  assert(!isAnswerCorrect("nope", "ádasd/ádag"), "slash: reject unrelated word");
  assert(!isAnswerCorrect("", "ádasd/ádag"), "slash: blank is not correct");

  assert(isAnswerCorrect("camera", "camera(s)"), "glued suffix: without the suffix");
  assert(isAnswerCorrect("cameras", "camera(s)"), "glued suffix: with the suffix");
  assert(isAnswerCorrect("camera(s)", "camera(s)"), "glued suffix: literal key still accepted");
  assert(!isAnswerCorrect("s", "camera(s)"), "glued suffix: suffix alone is not enough");
  assert(!isAnswerCorrect("wrong", "camera(s)"), "glued suffix: reject unrelated word");
  assert(isAnswerCorrect("10 September", "10(th) September"), "glued ordinal: without th");
  assert(isAnswerCorrect("10th September", "10(th) September"), "glued ordinal: with th");
  assert(!isAnswerCorrect("th", "10(th) September"), "glued ordinal: th alone is not enough");
  assert(!isAnswerCorrect("st", "1(st) October"), "glued ordinal: st alone is not enough");
  assert(isAnswerCorrect("blond", "blond(e)"), "glued letter: without e");
  assert(isAnswerCorrect("blonde", "blond(e)"), "glued letter: with e");
  assert(!isAnswerCorrect("e", "blond(e)"), "glued letter: e alone is not enough");
  assert(isAnswerCorrect("multicoloured", "multi(-)coloured / multi(-)colored"), "glued hyphen: without it");
  assert(isAnswerCorrect("multi-colored", "multi(-)coloured / multi(-)colored"), "glued hyphen: with it");
  assert(!isAnswerCorrect("-", "multi(-)coloured / multi(-)colored"), "glued hyphen: hyphen alone is not enough");

  assert(isAnswerCorrect("colour", "colour"), "plain key still requires that word");
  assert(isAnswerCorrect("  Colour  ", "colour"), "plain key keeps case and space folding");
  assert(!isAnswerCorrect("color", "colour"), "plain key rejects a different word");

  assert(isAnswerCorrect("A", "A"), "letter A matches A");
  assert(isAnswerCorrect("a", "A"), "letter A matches lowercase a");
  assert(!isAnswerCorrect("B", "A"), "letter A does not match B");
  assert(!isAnswerCorrect("A/B", "A"), "letter A is not split into a slash key");
  assert(isAnswerCorrect("vii", "vii"), "roman numeral vii matches");
  assert(isAnswerCorrect("VII", "vii"), "roman numeral keeps case folding");
  assert(!isAnswerCorrect("vi", "vii"), "roman numeral vii does not match vi");

  assert(isAnswerCorrect("T", "TRUE"), "TRUE still accepts T");
  assert(isAnswerCorrect("not given", "NOT GIVEN"), "NOT GIVEN still matches");
  assert(isAnswerCorrect("n/g", "NOT GIVEN"), "n/g is still a NOT GIVEN alias");
  assert(!isAnswerCorrect("n", "n/g"), "n/g is not split into n");
  assert(isAnswerCorrect("1/2", "1/2"), "numeric fraction stays one answer");
  assert(!isAnswerCorrect("1", "1/2"), "numeric fraction does not accept one side");
  assert(isAnswerCorrect("10", "10/ten"), "number-or-word slash accepts the number");
  assert(isAnswerCorrect("ten", "10/ten"), "number-or-word slash accepts the word");

  assert(
    isAnswerCorrect("weather condition", "weather condition / severe weather"),
    "spaced slash: left phrase",
  );
  assert(
    isAnswerCorrect("severe weather", "weather condition / severe weather"),
    "spaced slash: right phrase",
  );
  assert(
    !isAnswerCorrect("weather", "weather condition / severe weather"),
    "spaced slash: reject a fragment",
  );

  assert(
    isAnswerCorrect("royal antelope", "(the) royal antelope"),
    "optional bracket: phrase without the word",
  );
  assert(
    isAnswerCorrect("the royal antelope", "(the) royal antelope"),
    "optional bracket: phrase with the word",
  );
  assert(!isAnswerCorrect("the", "(the) royal antelope"), "optional bracket: word alone is not enough");
  assert(isAnswerCorrect("20.25", "20.25 (am)"), "optional trailing bracket: number");
  assert(isAnswerCorrect("20.25 am", "20.25 (am)"), "optional trailing bracket: number plus word");
  assert(!isAnswerCorrect("am", "20.25 (am)"), "optional trailing bracket: word alone is not enough");

  assert(isAnswerCorrect("colour", "colour()"), "empty parens leave the word");
  assert(isAnswerCorrect("indoor", "indoor (staff/employees)"), "slash inside parens: without the group");
  assert(isAnswerCorrect("indoor staff", "indoor (staff/employees)"), "slash inside parens: first inner");
  assert(isAnswerCorrect("indoor employees", "indoor (staff/employees)"), "slash inside parens: second inner");
  assert(!isAnswerCorrect("staff", "indoor (staff/employees)"), "slash inside parens: inner alone is not enough");
  assert(isAnswerCorrect("chinese architecture", "(unique) (Chinese) architecture"), "two optional groups: one kept");
  assert(isAnswerCorrect("architecture", "(unique) (Chinese) architecture"), "two optional groups: none kept");
  assert(isAnswerCorrect("unique chinese architecture", "(unique) (Chinese) architecture"), "two optional groups: both kept");
  assert(isAnswerCorrect("photos", "(provide) photograph/(provide) photographs/(provide) photos"), "slash then optional word");
  assert(isAnswerCorrect("provide photographs", "(provide) photograph/(provide) photographs/(provide) photos"), "slash then optional word kept");
  assert(!isAnswerCorrect("provide", "(provide) photograph/(provide) photographs/(provide) photos"), "slash then optional word alone");

  assert(
    isAnswerCorrect("ádag", "nope", ["ádasd/ádag"]),
    "acceptableAnswers list is expanded the same way",
  );

  const graded = gradeAnswers(
    [
      {
        number: 1,
        type: "GAP_FILL",
        content: { stem: "sample" },
        correctAnswer: "ádasd/ádag",
        sectionTitle: "Reading",
        sectionOrder: 1,
      },
      {
        number: 2,
        type: "GAP_FILL",
        content: { stem: "sample" },
        correctAnswer: "camera(s)",
        sectionTitle: "Reading",
        sectionOrder: 1,
      },
    ],
    { "1": "ádag", "2": "cameras" },
  );
  assert(graded.correct === 2, "gradeAnswers counts either alternative as correct");
  assert(graded.items[0]?.status === "correct", "result status for one slash side");
  assert(graded.items[1]?.status === "correct", "result status for one paren side");
  assert(
    graded.items[0]?.correctAnswer === "ádasd/ádag",
    "result still shows the original slash key",
  );
  assert(
    graded.items[1]?.correctAnswer === "camera(s)",
    "result still shows the original parenthesis key",
  );

  const multi = matchMultiSelectAnswers(["color", "B"], ["colour/color", "A/B"]);
  assert(multi[0] === true && multi[1] === true, "multi-select uses the same alternatives");
  assert(
    matchMultiSelectAnswers(["A", "B"], ["B", "A"]).every(Boolean),
    "multi-select letter order stays independent",
  );
  assert(
    matchMultiSelectAnswers(["E", "B", "D"], ["B", "D", "E"]).every(Boolean),
    "choose THREE: E, B, D matches key B, D, E",
  );
  const oneWrong = matchMultiSelectAnswers(["A", "B", "D"], ["B", "D", "E"]);
  assert(
    oneWrong[0] === false && oneWrong[1] === true && oneWrong[2] === true,
    "choose THREE: a wrong letter scores only the correct ones",
  );
  const repeated = matchMultiSelectAnswers(["B", "B", "D"], ["B", "D", "E"]);
  assert(
    repeated.filter(Boolean).length === 2 && repeated[1] === false,
    "choose THREE: a repeated letter does not score twice",
  );

  const chooseThreeOptions = [
    { label: "A", text: "Coding behaviour" },
    { label: "B", text: "Easy conversation" },
    { label: "C", text: "Closed categories" },
    { label: "D", text: "Full of details" },
    { label: "E", text: "Open-ended answers" },
    { label: "F", text: "Note-taking" },
  ];
  const test13ChooseThree = [
    {
      number: 37,
      type: "MULTIPLE_CHOICE",
      content: {
        stem: "Which THREE are mentioned",
        options: chooseThreeOptions,
        selectCount: 3,
        covers: [37, 38, 39],
      },
      correctAnswer: "B",
      sectionTitle: "Reading Passage 3",
      sectionOrder: 3,
    },
    {
      number: 38,
      type: "MULTIPLE_CHOICE",
      content: { stem: "", pairedFrom: 37 },
      correctAnswer: "D",
      sectionTitle: "Reading Passage 3",
      sectionOrder: 3,
    },
    {
      number: 39,
      type: "MULTIPLE_CHOICE",
      content: { stem: "", pairedFrom: 37 },
      correctAnswer: "E",
      sectionTitle: "Reading Passage 3",
      sectionOrder: 3,
    },
    {
      number: 40,
      type: "MULTIPLE_CHOICE",
      content: {
        stem: "What is the main idea of the passage?",
        options: [
          { label: "A", text: "quantitative" },
          { label: "B", text: "society" },
          { label: "C", text: "ideas" },
          { label: "D", text: "flawless" },
        ],
      },
      correctAnswer: "C",
      sectionTitle: "Reading Passage 3",
      sectionOrder: 3,
    },
  ];

  const reordered = gradeAnswers(test13ChooseThree, {
    "37": "E",
    "38": "B",
    "39": "D",
    "40": "C",
  });
  const byNumber = (n: number) =>
    reordered.items.find((item) => item.questionNumber === n);
  assert(reordered.correct === 4, "Test 13 Q37–40: reordered letters plus Q40");
  assert(byNumber(37)?.status === "correct", "Q37 E is correct in the set");
  assert(byNumber(38)?.status === "correct", "Q38 B is correct in the set");
  assert(byNumber(39)?.status === "correct", "Q39 D is correct in the set");
  assert(byNumber(40)?.status === "correct", "Q40 stays a separate single choice");

  const partial = gradeAnswers(test13ChooseThree, {
    "37": "A",
    "38": "B",
    "39": "D",
    "40": "B",
  });
  const partialBy = (n: number) =>
    partial.items.find((item) => item.questionNumber === n);
  assert(partialBy(37)?.status === "wrong", "wrong letter A does not score");
  assert(partialBy(38)?.status === "correct", "B still scores");
  assert(partialBy(39)?.status === "correct", "D still scores");
  assert(partial.correct === 2, "one wrong letter in the set scores two");
  assert(partialBy(40)?.status === "wrong", "Q40 B is not the single key C");

  const dupes = gradeAnswers(test13ChooseThree, {
    "37": "B",
    "38": "B",
    "39": "D",
  });
  const dupeBy = (n: number) =>
    dupes.items.find((item) => item.questionNumber === n);
  assert(dupeBy(37)?.status === "correct", "first B scores");
  assert(dupeBy(38)?.status === "wrong", "second B does not score again");
  assert(dupeBy(39)?.status === "correct", "D still scores");
  assert(dupes.correct === 2, "repeated letter does not add a third mark");

  assert(checkExerciseAnswer("ádasd", ["ádasd/ádag"]), "learn: slash left side");
  assert(checkExerciseAnswer("ádag", ["ádasd/ádag"]), "learn: slash right side");
  assert(!checkExerciseAnswer("nope", ["ádasd/ádag"]), "learn: slash rejects a wrong word");
  assert(checkExerciseAnswer("cameras", ["camera(s)"]), "learn: glued suffix kept");
  assert(!checkExerciseAnswer("s", ["camera(s)"]), "learn: glued suffix alone is not enough");
  assert(
    checkExerciseAnswer("B", ["B", "B. Nắm ý chính / cấu trúc bài"]),
    "learn: option letter still counts",
  );
  assert(
    checkExerciseAnswer("B. Nắm ý chính / cấu trúc bài", [
      "B",
      "B. Nắm ý chính / cấu trúc bài",
    ]),
    "learn: full option sentence still counts",
  );
  assert(
    !checkExerciseAnswer("cấu trúc bài", ["B", "B. Nắm ý chính / cấu trúc bài"]),
    "learn: slash inside an option sentence is not an alternative split",
  );

  console.log("answer alternatives: ok");
}

main();
