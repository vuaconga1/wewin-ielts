/**
 * GT Reading sections hold two texts: text 1, its questions, then
 * "Read the text below and answer Questions 22–27.", text 2, its questions.
 * Both texts belong in the passage column; the lead-in line separates them.
 *
 * Run:
 *   npx tsx scripts/test-reading-multi-passage.ts
 */
import {
  decorateReadingPassage,
  parseReadingQuestionGroups,
  splitReadingPassageAndTasks,
} from "../src/lib/practice/reading-content";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

// Cambridge IELTS 11 GT Test 1 Reading, Section 2 (DB content, paragraphs shortened).
const section = [
  "Read the text below and answer Questions 15–21.",
  "",
  "GZJ Travel – Recruitment Info",
  "",
  "We're looking for keen and effective people who are passionate about travel to work as Travel Sales Consultants in our ",
  "rapidly-growing team. Our recruitment process has five stages. Here's how it works:",
  "",
  "Next, in Stage Four, you'll be introduced to the Area Leader and you'll also visit one of our shops, where you'll meet ",
  "the team and find out more about the sort of work that's involved.",
  "",
  "Questions 15–21",
  "",
  "Complete the flow-chart below.",
  "",
  "Choose NO MORE THAN THREE WORDS from the text for each answer.",
  "",
  "Write your answers in boxes 15–21 on your answer sheet.",
  "",
  "GZJ Travel – Recruitment Process",
  "",
  "Stage Four – Individual interview: Meet a manager, and the 21 ............... working in a particular store",
  "",
  "↓",
  "",
  "Stage Five – Job offer: Job offer sent out to successful applicants",
  "",
  "Read the text below and answer Questions 22–27.",
  "",
  "Hilton Laboratory",
  "",
  "Health and safety in the workplace",
  "",
  "Personal safety",
  "",
  "You must be familiar with the emergency procedures in your building so that you know what to do in the event of fire, ",
  "spillages or other accidents.",
  "",
  "Staying alert",
  "",
  "If you become mentally or physically tired during the working day, make sure that you take regular breaks when necessary.",
  "",
  "Questions 22–27",
  "",
  "Complete the sentences below.",
  "",
  "Choose NO MORE THAN TWO WORDS from the text for each answer.",
  "",
  "Write your answers in boxes 22–27 on your answer sheet.",
  "",
  "22 There are certain places in the building that staff should avoid unless they have ______________ .",
  "",
  "27 You should have ______________ while you are working.",
].join("\n");

const { passage, tasks } = splitReadingPassageAndTasks(section);
assert(passage.includes("Hilton Laboratory"), "text 2 title moves to the passage column");
assert(passage.includes("Staying alert"), "text 2 body moves to the passage column");
assert(
  passage.indexOf("GZJ Travel – Recruitment Info") < passage.indexOf("Hilton Laboratory"),
  "text 1 stays before text 2",
);
assert(!tasks.includes("Hilton Laboratory"), "text 2 is not left in the questions column");
assert(!/Read the text below and answer Questions 22/.test(tasks), "text 2 lead-in leaves the questions column");
assert(tasks.includes("Stage Five – Job offer"), "the flow-chart stays with its questions");
assert(tasks.includes("Questions 22–27") && tasks.includes("27 You should have"), "Questions 22–27 stay");

const decorated = decorateReadingPassage(passage);
for (const marked of [
  "[[section]]Read the text below and answer Questions 15–21.[[/section]]",
  "[[title]]GZJ Travel – Recruitment Info[[/title]]",
  "[[section]]Read the text below and answer Questions 22–27.[[/section]]",
  "[[title]]Hilton Laboratory[[/title]]",
]) {
  assert(decorated.includes(marked), `passage marks ${marked}\n---\n${decorated}`);
}
assert(!decorated.includes("[[title]]Read the text"), "a lead-in line is never the text title");

const groups = parseReadingQuestionGroups(
  tasks,
  [21, 22, 27].map((number) => ({ number, type: "GAP_FILL", content: { stem: "", blank: true } })),
);
const flow = groups.find((group) => group.start === 15);
assert(flow, "Questions 15–21 group exists");
assert(!flow.instructions.some((line) => /^Read the text below/i.test(line)), "lead-in is not a flow-chart instruction");
assert(!flow.notes.includes("Hilton") && !flow.notes.includes("emergency procedures"), "flow-chart notes stop before text 2");
assert(flow.notes.includes("Stage Five"), "flow-chart notes keep the last step");

// C11 GT Test 1 Reading, Section 1: a headline question is the text title.
const school = decorateReadingPassage(
  "Read the text below and answer Questions 1–5.\n\nIs Your Child at School Today?\n\nSchool Attendance Information for Parents/Carers\n\nIntroduction\n\nReceiving a good full-time education will give your child the best possible start in life.",
);
assert(school.includes("[[title]]Is Your Child at School Today?[[/title]]"), `headline question is the title\n${school}`);

// A single-text section is unchanged.
const single = splitReadingPassageAndTasks(
  "Read the text below and answer Questions 1–5.\n\nTitle\n\nBody text that is long enough to be a passage paragraph here.\n\nQuestions 1–5\n\nDo the following statements agree?\n\n1 First statement.",
);
assert(single.passage.includes("Body text") && single.tasks.startsWith("Questions 1–5"), "single text split unchanged");

console.log("reading multi-passage regression: ok");
