import type { ParsedTestDraft, QuestionDraft } from "../src/lib/import/schemas";
import { normalizePublishedMockDraft } from "../src/lib/import/normalize-mock-tests";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

const question = (number: number, type: QuestionDraft["type"] = "GAP_FILL"): QuestionDraft => ({
  number,
  order: number - 1,
  type,
  content: { stem: "", blank: type === "GAP_FILL" },
});
const draft = (
  slug: string,
  skill: ParsedTestDraft["skill"],
  contents: string[],
  questions: QuestionDraft[][],
): ParsedTestDraft => ({
  title: slug,
  slug,
  skill,
  examType: "GENERAL",
  parts: contents.map((content, order) => ({
    title: skill === "LISTENING" ? `Part ${order + 1}` : `Passage ${order + 1}`,
    order,
    content,
    questions: questions[order]!,
  })),
});

const listening = normalizePublishedMockDraft(draft(
  "general-listening-mocktest-1",
  "LISTENING",
  [
    "Questions 1-7\nComplete the notes below.\n| Place | Stay |\n| --- | --- |\n| Camford | Example<br>with cousin |\nQuestions 8-10\nComplete the notes below.",
    "Questions 11-20\nVolunteer work application form",
  ],
  [
    [...Array.from({ length: 7 }, (_, i) => question(i + 1)), ...Array.from({ length: 3 }, (_, i) => question(i + 8))],
    Array.from({ length: 10 }, (_, i) => question(i + 11)),
  ],
));
assert(listening.parts[0]!.title === "Section 1", "Listening Part title becomes Section");
assert(!listening.parts[0]!.content?.includes("<br>"), "HTML break is removed from table");
assert(listening.parts[0]!.questions.slice(0, 7).every((q) => q.type === "TABLE_COMPLETION" && q.content.variant === "TABLE_COMPLETION"), "Q1-7 are table completion");
assert(listening.parts[0]!.questions.slice(7).every((q) => q.content.variant === "NOTE_COMPLETION"), "Q8-10 are note completion");
assert(listening.parts[1]!.questions.every((q) => q.content.variant === "FORM_COMPLETION"), "Q11-20 are form completion");

const castle = normalizePublishedMockDraft(draft(
  "general-reading-mocktest-1",
  "READING",
  ["[[section]]Questions 1–6[[/section]]\n[[box]]Hall advert[[/box]]\n[[section]]Questions 7–10[[/section]]\n[[box]][[price]]ONLY $4.99[[/price]][[/box]]\nQuestions 1-6\nOld tasks"],
  [[
    ...Array.from({ length: 6 }, (_, i) => question(i + 1, "MATCHING")),
    ...Array.from({ length: 4 }, (_, i) => question(i + 7, "MULTIPLE_CHOICE")),
    question(11), question(12),
  ]],
));
const castleContent = castle.parts[0]!.content ?? "";
assert(!castleContent.includes("[[section]]"), "Question section markers are removed from passage");
assert(!castleContent.includes("[[price]]"), "Unsupported price marker is removed");
assert((castleContent.match(/Questions 1–6/g) ?? []).length === 1, "Question header appears once");
assert(castle.parts[0]!.questions[10]!.content.variant === "SENTENCE_COMPLETION", "Q11-12 are sentence completion");

const grade8 = normalizePublishedMockDraft(draft(
  "general-reading-grade-8",
  "READING",
  [
    "Architecture passage\nQuestions 1-5\n1. Static stem\nQuestions 6-10\n6. Static MCQ\nA. Option",
    "Cuisine passage\nQuestions 11-15\n11. Static stem\nQuestions 16-20\n16 ______",
    "Beethoven passage\nQuestions 21-25:\n21. Static TFNG\nQuestions 26-30:\n30. Static MCQ\nA. Option",
  ],
  [
    [...Array.from({ length: 5 }, (_, i) => question(i + 1, "SHORT_ANSWER")), ...Array.from({ length: 5 }, (_, i) => question(i + 6, "MULTIPLE_CHOICE"))],
    [...Array.from({ length: 5 }, (_, i) => question(i + 11, "MATCHING")), ...Array.from({ length: 5 }, (_, i) => question(i + 16))],
    [...Array.from({ length: 5 }, (_, i) => question(i + 21, "TRUE_FALSE_NG")), ...Array.from({ length: 5 }, (_, i) => question(i + 26, "MULTIPLE_CHOICE"))],
  ],
));
assert(grade8.parts.map((part) => part.title).join("/") === "Section 1/Section 2/Section 3", "Grade-8 uses Section titles");
assert(!/^\d+[.)]\s/m.test(grade8.parts[2]!.content ?? ""), "Static numbered items are removed");
assert(grade8.parts[2]!.questions.slice(0, 5).every((q) => q.content.variant === "TRUE_FALSE_NOT_GIVEN"), "Q21-25 have TFNG variant");
assert((grade8.parts[2]!.content ?? "").includes("In boxes 21–25 on your answer sheet, write"), "TFNG group has answer-sheet instruction");
assert(grade8.parts[2]!.questions.slice(5).every((q) => q.content.variant === "SINGLE_CHOICE"), "Q26-30 have MCQ variant");

const writingStem = "You should spend about 20 minutes on this task.\n\nWrite a letter to your landlord. In your letter, explain:\nFirst point\nSecond point\nThird point\n\nWrite at least 150 words.\n\nDear Sir or Madam,";
const writing = normalizePublishedMockDraft(draft(
  "general-writing-mocktest-1",
  "WRITING",
  [writingStem],
  [[{ number: 1, order: 0, type: "ESSAY", content: { stem: writingStem, minWords: 150 } }]],
));
assert(writing.parts[0]!.title === "Task 1", "Writing uses Task 1 title");
assert(writing.parts[0]!.questions[0]!.content.variant === "WRITING_GENERAL_LETTER", "Writing Task 1 variant is explicit");
assert(((writing.parts[0]!.content ?? "").match(/^• /gm) ?? []).length === 3, "Writing has three bullets");

for (const normalized of [listening, castle, grade8, writing]) {
  assert(JSON.stringify(normalizePublishedMockDraft(normalized)) === JSON.stringify(normalized), `${normalized.slug} is idempotent`);
}

console.log("published mock normalization: ok");
