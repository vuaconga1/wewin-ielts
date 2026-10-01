/**
 * Left-column reading passage chrome:
 * strip "READING PASSAGE N" / standalone "below.", do not inject question
 * headings, identify the real title for bold/center rendering, and mark
 * leading paragraph letters (A/B/C) without marking an ordinary "A new study".
 *
 * Run:
 *   npx tsx scripts/test-reading-passage-chrome.ts
 */

import fs from "fs";
import {
  decorateReadingPassage,
  readingPassageTitle,
  splitReadingPassageAndTasks,
  parseReadingQuestionGroups,
  repairImportedText,
  withHeadingBank,
  withPrintedWordList,
  withParagraphLetterBank,
  withRecoveredChoices,
  withRecoveredLeadingLetter,
  withStatementBank,
  withSummaryWordList,
  withYearLetterBank,
  withYesNoBank,
} from "../src/lib/practice/reading-content";
import { splitBoxedSegments } from "../src/lib/practice/boxed-text";
import { findInlineBlankNumbers } from "../src/components/practice/inline-notes-gaps";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const groups = [
  { header: "Questions 14-18", start: 14, end: 18 },
  { header: "Questions 19-23", start: 19, end: 23 },
  { header: "Questions 24-27", start: 24, end: 27 },
];

const screenshot = `Questions 14–18
Questions 19–23
Questions 24–27
READING PASSAGE 2
below.
The Study of Chimpanzee Culture
A After studying the similarities, researchers looked at the valley below.
The note below is not a heading.`;

function main() {
  const split = splitReadingPassageAndTasks(
    `You should spend about 20 minutes on Questions 14-27, which are based on
READING PASSAGE 2
 below.
The Study of Chimpanzee Culture
A After studying the similarities, researchers looked at the valley below.
The note below is not a heading.

Questions 14-18
Which paragraph contains the following information?`,
  );

  assert(!/^READING PASSAGE 2\s*$/m.test(split.passage), "READING PASSAGE 2 is stripped");
  assert(!/^below\.?\s*$/m.test(split.passage), "standalone below. is stripped");
  assert(/valley below/.test(split.passage), "a sentence containing below stays");
  assert(/note below/.test(split.passage), "another sentence containing below stays");
  assert(/Questions 14-18/.test(split.tasks), "right-side tasks keep the question heading");

  const left = decorateReadingPassage(screenshot, groups);
  assert(!left.includes("[[section]]"), "left passage does not gain section markers");
  assert(!/Questions\s+14/.test(left), "left passage does not gain Questions 14–18");
  assert(!/^READING PASSAGE 2\s*$/m.test(left), "decorated text drops READING PASSAGE 2");
  assert(!/^below\.?\s*$/m.test(left), "decorated text drops standalone below.");
  assert(
    readingPassageTitle(screenshot, groups) === "The Study of Chimpanzee Culture",
    "title line is identifiable",
  );
  assert(
    left.includes("[[title]]The Study of Chimpanzee Culture[[/title]]"),
    "title is marked for bold/center",
  );

  const segments = splitBoxedSegments(left);
  const title = segments.find((segment) => segment.kind === "title");
  assert(title?.value === "The Study of Chimpanzee Culture", "title segment is the heading");
  const body = segments
    .filter((segment) => segment.kind === "text")
    .map((segment) => segment.value)
    .join("\n");
  assert(
    /\[\[plabel\]\]A\[\[\/plabel\]\] After studying/.test(body),
    "paragraph A label is marked and the paragraph stays in the body",
  );
  assert(
    body.includes("The note below is not a heading."),
    "a sentence containing below stays in the body",
  );
  assert(
    !body.includes("The Study of Chimpanzee Culture"),
    "the title is not repeated in the body",
  );
  assert(!/Questions\s+1[49]/.test(body), "body does not keep question-range headings");

  const test13 = JSON.parse(
    fs.readFileSync("data/tests/test-13-reading.json", "utf8"),
  ) as { parts: { content: string }[] };
  const passage2 = splitReadingPassageAndTasks(test13.parts[1]!.content);
  const decorated = decorateReadingPassage(passage2.passage, groups);
  assert(
    readingPassageTitle(passage2.passage, groups) === "The Study of Chimpanzee Culture",
    "Test 13 passage 2 title",
  );
  assert(!/^READING PASSAGE\s+\d+\s*$/m.test(decorated), "Test 13 drops passage labels");
  assert(!/^below\.?\s*$/m.test(decorated), "Test 13 drops standalone below.");
  assert(!decorated.includes("[[section]]"), "Test 13 left passage has no section markers");
  assert(!/Questions\s+14/.test(decorated), "Test 13 left passage has no Questions 14 heading");
  assert(
    /\[\[plabel\]\]A\[\[\/plabel\]\] After studying/.test(decorated),
    "Test 13 paragraph A remains and its letter is marked",
  );
  assert(
    /\[\[plabel\]\]A\[\[\/plabel\]\][\s\S]*\n\n\[\[plabel\]\]B\[\[\/plabel\]\] During/.test(
      decorated,
    ),
    "Test 13 paragraphs A and B are separated for the passage gap",
  );
  assert(
    !/\[\[plabel\]\]A\[\[\/plabel\]\] new study/.test(decorated),
    "Test 13 does not mark an article inside paragraph A",
  );
  assert(/Questions\s+14/.test(passage2.tasks), "Test 13 right-side tasks still have questions");

  const passage1 = splitReadingPassageAndTasks(test13.parts[0]!.content);
  assert(
    readingPassageTitle(passage1.passage) === "The Innovation of Grocery Stores",
    "Test 13 passage 1 title",
  );
  const passage3 = splitReadingPassageAndTasks(test13.parts[2]!.content);
  assert(
    readingPassageTitle(passage3.passage) === "Quantitative Research in Education",
    "Test 13 passage 3 title",
  );

  const structured = decorateReadingPassage(
    "[[section]]Questions 1–6[[/section]]\n\n[[box]]\nA  GWYN HOUSE\n[[/box]]",
    [{ header: "Questions 1-6", start: 1, end: 6 }],
  );
  assert(
    structured.includes("[[section]]Questions 1–6[[/section]]"),
    "structured reading texts keep their own section labels",
  );
  assert(!structured.includes("[[plabel]]"), "boxed option lines are not paragraph labels");

  const article = decorateReadingPassage(
    `The Study of Chimpanzee Culture
A new study of chimpanzees found new patterns in the valley.
B During the past two years, researchers met in the forest.
I went back to check the notes the next morning.`,
    groups,
  );
  assert(
    /A new study of chimpanzees/.test(article),
    "an ordinary article A stays in the paragraph",
  );
  assert(
    !/\[\[plabel\]\]A\[\[\/plabel\]\] new study/.test(article),
    "A new study is not a paragraph label",
  );
  assert(
    /\[\[plabel\]\]B\[\[\/plabel\]\] During the past two years/.test(article),
    "paragraph B is still marked after an article line",
  );
  assert(
    !/\[\[plabel\]\]I\[\[\/plabel\]\] went/.test(article),
    "pronoun I at the start of a sentence is not a paragraph label",
  );

  const dotted = decorateReadingPassage(
    `A Journey Through World Cuisine
A. Food brings people together across cities.
B) Asian cuisine is famous for its flavors.`,
  );
  assert(
    readingPassageTitle(
      `A Journey Through World Cuisine
A. Food brings people together across cities.
B) Asian cuisine is famous for its flavors.`,
    ) === "A Journey Through World Cuisine",
    "a title that starts with A is not treated as paragraph A",
  );
  assert(
    /\[\[plabel\]\]A\.\[\[\/plabel\]\] Food brings/.test(dotted),
    "A. labels the paragraph, not the whole sentence",
  );
  assert(
    /\[\[plabel\]\]B\)\[\[\/plabel\]\] Asian cuisine/.test(dotted),
    "B) is a paragraph label",
  );
  assert(/\n\n\[\[plabel\]\]B\)/.test(dotted), "dotted paragraphs are separated");

  const bare = decorateReadingPassage(
    `A Brief History of Tea
A
The story of tea began in ancient China over 5,000 years ago.
B
Tea consumption spread throughout Chinese culture.`,
  );
  assert(
    /\[\[plabel\]\]A\[\[\/plabel\]\] The story of tea began/.test(bare),
    "a letter on its own line joins the following paragraph",
  );
  assert(
    /\[\[plabel\]\]B\[\[\/plabel\]\] Tea consumption spread/.test(bare),
    "bare paragraph B joins its body",
  );
  assert(!/\nA\n/.test(bare), "the bare letter is not left as its own line");

  const named = decorateReadingPassage(
    `Flower Power

Paragraph A

Why do people give flowers to friends and family?

Paragraph B

Research confirms that flowers change our emotional state.`,
  );
  assert(/Paragraph \[\[plabel\]\]A\[\[\/plabel\]\]/.test(named), "Paragraph A marks the letter");
  assert(
    /Why do people give flowers/.test(named) && !/\[\[plabel\]\]Why/.test(named),
    "the paragraph body after Paragraph A is not a label",
  );

  const ui = fs.readFileSync("src/components/practice/boxed-content.tsx", "utf8");
  assert(ui.includes("space-y-5") && ui.includes("text-justify indent-8 leading-7"), "passage paragraphs are justified, indented, and openly spaced");
  assert(
    ui.includes("text-lg font-bold"),
    "paragraph labels render larger and bold",
  );
  assert(ui.includes("plabel"), "the passage renderer reads plabel markers");
  const session = fs.readFileSync(
    "src/components/practice/practice-session.tsx",
    "utf8",
  );
  assert(
    session.includes("<BoxedContent text={leftBody} passageLayout />"),
    "only the reading passage column opts into paragraph layout",
  );

  const test12 = JSON.parse(
    fs.readFileSync("data/tests/test-12-reading.json", "utf8"),
  ) as {
    parts: {
      content: string;
      questions: {
        number: number;
        type: string;
        content: { stem?: string; options?: { label: string; text: string }[] };
      }[];
    }[];
  };
  const test12p2 = splitReadingPassageAndTasks(test12.parts[1]!.content);
  assert(
    /UNFAIR ADVANTAGE IN SPORT/.test(test12p2.passage),
    "Test 12 passage 2 title stays on the left",
  );
  assert(
    /Ron Clarke/.test(test12p2.passage),
    "Test 12 passage paragraphs stay on the left",
  );
  assert(
    !/Ron Clarke/.test(test12p2.tasks),
    "Test 12 passage paragraphs are not left in the question column",
  );
  assert(
    /List of Headings/.test(test12p2.tasks),
    "Test 12 heading list stays with the questions",
  );
  assert(/Questions 21/.test(test12p2.tasks), "Test 12 later questions stay on the right");
  const repaired = withHeadingBank(test12.parts[1]!.questions, test12p2.tasks);
  const q14 = repaired.find((q) => q.number === 14);
  assert(q14?.content.options?.[0]?.label === "i", "heading bank starts at i");
  assert(
    q14?.content.options?.some((opt) => opt.label === "vii"),
    "heading bank includes vii",
  );
  assert(
    !q14?.content.options?.some((opt) => /Ron Clarke/.test(opt.text)),
    "heading bank is not the passage paragraphs",
  );

  const test11 = JSON.parse(
    fs.readFileSync("data/tests/test-11-reading.json", "utf8"),
  ) as typeof test12;
  const test11p2 = splitReadingPassageAndTasks(test11.parts[1]!.content);
  assert(
    /THE FASHION INDUSTRY/.test(test11p2.passage),
    "Test 11 passage title stays on the left",
  );
  assert(
    /multibillion-dollar/.test(test11p2.passage),
    "Test 11 section A stays on the left",
  );
  assert(
    /has seven sections/.test(test11p2.tasks),
    "wrapped Reading Passage sentence stays one instruction",
  );
  const fashion = withHeadingBank(test11.parts[1]!.questions, test11p2.tasks);
  const fashion14 = fashion.find((q) => q.number === 14);
  assert(fashion14?.type === "MATCHING", "section A is a heading match, not radios");
  assert(fashion14?.content.stem === "Section A", "question 14 stem is Section A");
  assert(
    fashion14?.content.options?.some((opt) => opt.label === "v" && /fashion industry/.test(opt.text)),
    "heading v is the importance of the fashion industry",
  );
  assert(
    !fashion14?.content.options?.some((opt) => /multibillion-dollar/.test(opt.text)),
    "passage paragraphs are not the heading options",
  );
  for (const number of [15, 16, 17, 18, 19, 20]) {
    const item = fashion.find((q) => q.number === number);
    assert(item?.type === "MATCHING", `question ${number} uses the heading bank`);
    assert(
      (item?.content.options?.length ?? 0) >= 8,
      `question ${number} lists i-viii`,
    );
    assert(/Section [A-G]/.test(item?.content.stem ?? ""), `question ${number} stem is its section`);
  }
  const summary = fashion.find((q) => q.number === 21);
  assert(summary?.type === "GAP_FILL", "summary questions stay gap fill");

  const test11p3 = splitReadingPassageAndTasks(test11.parts[2]!.content);
  const pterosaur = withPrintedWordList(test11.parts[2]!.questions, test11p3.tasks);
  const q27 = pterosaur.find((q) => q.number === 27);
  assert(
    q27?.content.options?.some((opt) => opt.label === "L" && /hair/i.test(opt.text)),
    "printed list restores L hair",
  );
  const p3groups = parseReadingQuestionGroups(test11p3.tasks, pterosaur);
  const summaryGroup = p3groups.find((group) => group.start === 27 && group.end === 32);
  assert(summaryGroup, "questions 27-32 are one group");
  assert(
    /Pterosaurs are believed/.test(summaryGroup?.notes ?? ""),
    "the summary stays one paragraph",
  );
  assert(/27\s+\./.test(summaryGroup?.notes ?? "") || /27\s/.test(summaryGroup?.notes ?? ""), "gap 27 stays in the summary");
  assert(/32\s/.test(summaryGroup?.notes ?? ""), "gap 32 stays in the summary");
  assert(!/front feet/.test(summaryGroup?.notes ?? ""), "word list is not copied into the summary");

  const test10 = JSON.parse(
    fs.readFileSync("data/tests/test-10-reading.json", "utf8"),
  ) as typeof test12;
  const test10p2 = splitReadingPassageAndTasks(test10.parts[1]!.content);
  assert(/Born to trade/.test(test10p2.passage), "Test 10 passage title is on the left");
  assert(/Humans are born to trade/.test(test10p2.passage), "Test 10 section A is on the left");
  assert(!/Humans are born to trade/.test(test10p2.tasks), "Test 10 passage is not left in the questions");
  assert(/List of Headings/.test(test10p2.tasks), "Test 10 heading list stays on the right");
  const trade = withRecoveredChoices(
    withSummaryWordList(test10.parts[1]!.questions, test10p2.tasks),
    test10p2.tasks,
  );
  const beads = trade.find((q) => q.number === 21);
  assert((beads?.content.options?.length ?? 0) === 4, "question 21 recovers A-D");
  assert(/Blombos caves/.test(beads?.content.stem ?? ""), "question 21 stem includes the wrapped line");
  const valued = trade.find((q) => q.number === 22);
  assert(valued?.type === "MATCHING", "summary gaps 22-26 share the word list");
  assert(
    valued?.content.options?.some((opt) => opt.label === "A" && /competitiveness/.test(opt.text)),
    "word list starts at competitiveness",
  );
  const p2groups = parseReadingQuestionGroups(test10p2.tasks, trade);
  const summary22 = p2groups.find((group) => group.start === 22);
  assert(/certain objects are valued/.test(summary22?.notes ?? ""), "summary 22-26 stays in the notes");
  assert(!/competitiveness/.test(summary22?.notes ?? ""), "A-E list is not copied into the summary");

  const fixed = repairImportedText("Ddomestic crafts\nthe ddomestic crafts");
  assert(fixed.startsWith("domestic crafts"), "glued extra letter is dropped");
  assert(!/ddomestic/.test(fixed), "ddomestic becomes domestic");
  assert(!/^D\s+domestic/m.test(fixed), "the stray D is not kept as a paragraph label");

  const test10p1 = splitReadingPassageAndTasks(test10.parts[0]!.content);
  const p1body = decorateReadingPassage(test10p1.passage, []);
  assert(/long before sunrise/.test(p1body), "passage 1 hard wraps reflow into sentences");
  assert(/\[\[phead\]\]The melatonin shift\[\[\/phead\]\]/.test(p1body), "The melatonin shift is a bold heading");
  assert(/\[\[phead\]\]Schools respond\[\[\/phead\]\]/.test(p1body), "Schools respond is a bold heading");
  const lead = p1body.split(/\n\n/).find((block) => block.startsWith("A grow body"));
  assert(lead?.includes("good things happen."), "the opening two sentences are one paragraph");
  assert(lead && !/With classes/.test(lead), "the opening paragraph stops before With classes");
  const fueled = p1body.split(/\n\n/).find((block) => block.startsWith("Now, fueled"));
  assert(fueled?.includes("a little more."), "the resistance paragraph stays together");
  assert(fueled && !/According to Kyla/.test(fueled), "According to Kyla starts the next paragraph");
  const asleep = p1body.split(/\n\n/).find((block) => block.startsWith("As a result, teens"));
  assert(asleep?.includes("keep sleeping."), "the sleepiness paragraph stays together");
  assert(asleep && !/In addition to the mood/.test(asleep), "In addition starts the next paragraph");
  const caffeine = p1body.split(/\n\n/).find((block) => block.startsWith("To stay awake"));
  assert(caffeine?.includes("weight gain."), "the caffeine paragraph stays together");
  assert(caffeine && !/Schools respond/.test(caffeine), "Schools respond is not inside the caffeine paragraph");
  const test10p3 = splitReadingPassageAndTasks(test10.parts[2]!.content);
  const p3body = decorateReadingPassage(test10p3.passage, []);
  assert(/\[\[title\]\]Objects made by previous generations/.test(p3body), "passage 3 standfirst is centered like the title");
  assert(/domestic crafts do not build/.test(p3body), "passage 3 reflows the opening");
  assert(!/\[\[plabel\]\]D/.test(p3body) && !/\bD domestic\b/.test(p3body), "the stray D is removed");
  const ocean = p3body.split(/\n\n/).find((block) => /domestic crafts do not build/.test(block));
  assert(ocean?.includes("Pacific Ocean."), "the first body paragraph ends at the Pacific Ocean");
  assert(ocean && !/Women of previous generations expected/.test(ocean), "sewing starts the next paragraph");
  const crafts = p3body.split(/\n\n/).find((block) => block.startsWith("It does not help"));
  assert(crafts?.includes("Why not?"), "the crafts-versus-art paragraph stays together");
  assert(crafts?.includes("Worse, they are made"), "Worse stays in the crafts paragraph");
  const dig = p3body.split(/\n\n/).find((block) => block.startsWith("It might be argued"));
  assert(dig?.includes("physical evidence."), "the archaeology paragraph stays together");
  assert(dig?.includes("Archaeology is a combination"), "Archaeology stays in that paragraph");
  const magazines = p3body.split(/\n\n/).find((block) => /domestic crafts of this period/.test(block));
  assert(magazines?.includes("publications was"), "the page break stays inside the magazines paragraph");
  assert(magazines?.includes("paramount."), "the magazines paragraph ends at paramount");
  assert(/READING PASSAGE 3 in boxes/.test(test10p3.tasks), "passage label stays inside the instruction");
  assert(/YES if the statement agrees/.test(test10p3.tasks), "YES gloss is one line");
  assert(/NOT GIVEN if it is impossible/.test(test10p3.tasks), "NOT GIVEN gloss is one line");
  const needle = withYesNoBank(
    withSummaryWordList(test10.parts[2]!.questions, test10p3.tasks),
    test10p3.tasks,
  );
  const q33 = needle.find((q) => q.number === 33);
  const labels = (q33?.content.options ?? []).map((opt) => opt.label).join("");
  assert(labels === "ABCDEFG", "questions 33-36 restore the full word list");
  assert(
    q33?.content.options?.some((opt) => opt.label === "B" && /creative/.test(opt.text)),
    "creative is in the word list",
  );
  const q37 = needle.find((q) => q.number === 37);
  assert(
    (q37?.content.options ?? []).map((opt) => opt.label).join("|") === "YES|NO|NOT GIVEN",
    "questions 37-40 use YES NO NOT GIVEN",
  );
  const needleGroups = parseReadingQuestionGroups(test10p3.tasks, needle);
  const summary33 = needleGroups.find((group) => group.start === 33);
  assert(/Needlework in the first half/.test(summary33?.notes ?? ""), "summary 33-36 stays in the notes");
  assert(!/skilful/.test(summary33?.notes ?? ""), "the word list is not copied into the summary");

  const test8 = JSON.parse(
    fs.readFileSync("data/tests/test-8-reading.json", "utf8"),
  ) as typeof test12;
  const test8p2 = splitReadingPassageAndTasks(test8.parts[1]!.content);
  const filters = withSummaryWordList(test8.parts[1]!.questions, test8p2.tasks);
  const flow14 = filters.find((q) => q.number === 14);
  assert(flow14?.type === "GAP_FILL", "flowchart gaps stay word answers");
  assert((flow14?.content.options?.length ?? 0) === 0, "flowchart gaps do not inherit the later A-D list");
  const filterGroups = parseReadingQuestionGroups(test8p2.tasks, filters);
  const flow = filterGroups.find((group) => group.start === 14);
  assert(/Step-by-step guide/.test(flow?.notes ?? ""), "flowchart title stays in the notes");
  assert(/\n↓\n/.test(flow?.notes ?? "") || (flow?.notes ?? "").includes("↓"), "flowchart keeps the down arrows");
  const test8p3 = splitReadingPassageAndTasks(test8.parts[2]!.content);
  const sounds = withStatementBank(test8.parts[2]!.questions, test8p3.tasks);
  const q38 = sounds.find((q) => q.number === 38);
  assert(
    (q38?.content.options ?? []).map((opt) => opt.label).join("") === "ABCD",
    "questions 38-40 restore A and B",
  );
  assert(
    q38?.content.options?.some((opt) => opt.label === "A" && /less effort/.test(opt.text)),
    "option A is the less-effort statement",
  );

  const test7 = JSON.parse(
    fs.readFileSync("data/tests/test-7-reading.json", "utf8"),
  ) as typeof test12;
  const test7p1 = splitReadingPassageAndTasks(test7.parts[0]!.content);
  const people = withRecoveredLeadingLetter(test7.parts[0]!.questions, test7p1.tasks);
  const q1 = people.find((q) => q.number === 1);
  assert(
    (q1?.content.options ?? []).map((opt) => opt.label).join("") === "ABCDEF",
    "questions 1-6 restore labels A-F",
  );
  assert(
    q1?.content.options?.some((opt) => opt.label === "A" && /Scott Klara/.test(opt.text)),
    "option A is Scott Klara",
  );
  assert(
    q1?.content.options?.find((opt) => opt.label === "B")?.text ===
      "Intergovernmental Panel on Climate Change",
    "label B stays Intergovernmental Panel on Climate Change",
  );
  assert(q1?.type === "MATCHING", "questions 1-6 stay a matching dropdown bank");
  const q7bare = people.find((q) => q.number === 7);
  assert((q7bare?.content.options?.length ?? 0) === 0, "questions 7-9 do not inherit the people list");
  const paragraphs = withParagraphLetterBank(test7.parts[0]!.questions, test7p1.tasks);
  const q7 = paragraphs.find((q) => q.number === 7);
  assert(
    (q7?.content.options ?? []).map((opt) => opt.label).join("") === "ABCDEFGHIJ",
    "questions 7-9 use paragraph letters A-J",
  );
  assert(q7?.type === "MATCHING", "questions 7-9 stay matching dropdowns");
  assert(
    paragraphs.find((q) => q.number === 1)?.content.options?.some((opt) =>
      /Intergovernmental Panel/.test(opt.text),
    ),
    "paragraph letters do not replace the people list",
  );

  const test7p2 = splitReadingPassageAndTasks(test7.parts[1]!.content);
  assert(
    /Science and the Stradivarius/.test(test7p2.passage),
    "Test 7 passage 2 title is on the left",
  );
  assert(
    /Violins made by long-dead/.test(test7p2.passage),
    "Test 7 paragraph A is on the left",
  );
  assert(
    !/Choose the correct heading/.test(test7p2.passage),
    "Test 7 heading instruction is not on the left",
  );
  assert(
    !/List of Headings/.test(test7p2.passage),
    "Test 7 heading list is not on the left",
  );
  assert(
    !/Paragraph A/.test(test7p2.passage),
    "Test 7 heading stems are not on the left",
  );
  assert(
    /violinmakers optimise/.test(test7p2.passage),
    "Test 7 paragraph C stays on the left",
  );
  assert(
    !/violinmakers optimise/.test(test7p2.tasks),
    "Test 7 paragraph C is not in the question column",
  );
  assert(/List of Headings/.test(test7p2.tasks), "Test 7 heading list stays on the right");
  assert(/Questions 14-21/.test(test7p2.tasks), "Test 7 questions 14-21 stay on the right");
  assert(/Questions 22-26/.test(test7p2.tasks), "Test 7 questions 22-26 stay on the right");
  const strad = withHeadingBank(test7.parts[1]!.questions, test7p2.tasks);
  const coat = strad.find((q) => q.number === 14);
  assert(coat?.content.options?.[0]?.label === "i", "Test 7 heading bank starts at i");
  assert(
    /protective coatings/.test(coat?.content.options?.[0]?.text ?? ""),
    "heading i is an analysis of protective coatings",
  );
  assert(
    coat?.content.options?.some(
      (opt) => opt.label === "xii" && /challenge for scientists/.test(opt.text),
    ),
    "heading xii stays in the bank",
  );
  assert(
    (coat?.content.options?.length ?? 0) === 12,
    "questions 14-21 list headings i-xii",
  );
  assert(
    !coat?.content.options?.some((opt) => /violinmakers/i.test(opt.text)),
    "the violinmakers paragraph is not a heading option",
  );
  for (const number of [15, 16, 17, 18, 19, 20, 21]) {
    const item = strad.find((q) => q.number === number);
    assert(
      item?.content.options?.[0]?.label === "i" &&
        (item?.content.options?.length ?? 0) === 12,
      `question ${number} shares the heading bank`,
    );
    assert(
      !item?.content.options?.some((opt) => /violinmakers/i.test(opt.text)),
      `question ${number} does not include the passage`,
    );
  }
  const note = strad.find((q) => q.number === 22);
  assert(
    (note?.content.options ?? []).map((opt) => opt.label).join("|") ===
      "TRUE|FALSE|NOT GIVEN",
    "questions 22-26 stay TRUE FALSE NOT GIVEN",
  );
  const stradGroups = parseReadingQuestionGroups(test7p2.tasks, strad);
  const headingsGroup = stradGroups.find((group) => group.start === 14);
  const statements = stradGroups.find((group) => group.start === 22);
  assert(
    /List of Headings/.test(headingsGroup?.instructions.join("\n") ?? ""),
    "the heading list belongs to questions 14-21",
  );
  assert(
    /Example Paragraph B/.test(headingsGroup?.instructions.join("\n") ?? ""),
    "paragraph B stays an example line",
  );
  assert(
    !/List of Headings|violinmakers|protective coatings/.test(
      [statements?.instructions.join("\n"), statements?.notes].join("\n"),
    ),
    "the heading list is not dumped under questions 22-26",
  );
  const stradBody = decorateReadingPassage(test7p2.passage, []);
  assert(
    /\[\[title\]\]Science and the Stradivarius:/.test(stradBody),
    "the Stradivarius title is centered",
  );
  assert(
    /\[\[title\]\]Uncovering the secret of quality/.test(stradBody),
    "the subtitle is centered",
  );
  assert(/\[\[plabel\]\]A/.test(stradBody), "paragraph A keeps its letter");
  assert(
    !/Choose the correct heading/.test(stradBody),
    "the decorated passage does not start with the heading task",
  );

  const test5 = JSON.parse(
    fs.readFileSync("data/tests/test-5-reading.json", "utf8"),
  ) as typeof test12;
  const test5p1 = splitReadingPassageAndTasks(test5.parts[0]!.content);
  const mansfield = parseReadingQuestionGroups(
    test5p1.tasks,
    test5.parts[0]!.questions,
  );
  const adultYears = mansfield.find((group) => group.start === 7);
  assert(adultYears?.end === 13, "questions 7-13 stay one notes group");
  assert(
    findInlineBlankNumbers(adultYears?.notes ?? "").join(",") ===
      "7,8,9,10,11,12,13",
    "questions 7-13 are all inline gaps, including the space blank at 9",
  );
  assert(
    !mansfield.some((group) => group.start === 9 && group.end === 9),
    "question 9 is not split into its own group",
  );

  const test5p2 = splitReadingPassageAndTasks(test5.parts[1]!.content);
  const parrotQs = withParagraphLetterBank(
    test5.parts[1]!.questions,
    test5p2.tasks,
  );
  const q16 = parrotQs.find((q) => q.number === 16);
  assert(
    (q16?.content.options ?? []).map((opt) => opt.label).join("") ===
      "ABCDEFGHIJ",
    "questions 14-19 use paragraph letters A-J",
  );
  const parrotGroups = parseReadingQuestionGroups(test5p2.tasks, parrotQs);
  assert(
    !parrotGroups.some((group) => group.header === "Questions 1-6"),
    "local boxes 1-6 do not become a question group",
  );
  assert(
    !parrotGroups.some((group) => group.start === 10 && group.end === 13),
    "local boxes 10-13 do not steal the parrot summary",
  );
  const parrotSummary = parrotGroups.find((group) => group.start === 23);
  assert(
    /345 varieties/.test(parrotSummary?.notes ?? "") &&
      parrotSummary?.end === 26,
    "questions 23-26 keep the parrot summary",
  );

  const test5p3 = splitReadingPassageAndTasks(test5.parts[2]!.content);
  const yawnQs = withSummaryWordList(test5.parts[2]!.questions, test5p3.tasks);
  const yawn27 = yawnQs.find((q) => q.number === 27);
  assert(
    (yawn27?.content.options ?? []).map((opt) => opt.label).join("") ===
      "ABCDEFGHIJK",
    "questions 27-32 use the A-K yawn word list",
  );
  assert(
    yawn27?.content.options?.some((opt) => opt.label === "K" && /half-yawns/.test(opt.text)),
    "option K is half-yawns",
  );
  const yawnGroups = parseReadingQuestionGroups(test5p3.tasks, yawnQs);
  const yawnSummary = yawnGroups.find((group) => group.start === 27);
  assert(
    /typical yawn lasts/.test(yawnSummary?.notes ?? "") &&
      !/half-yawns/.test(yawnSummary?.notes ?? ""),
    "the yawn summary keeps its gaps and drops the word table",
  );
  assert(
    !yawnGroups.some((group) => group.header === "Questions 1-6"),
    "local boxes 1-6 do not split the yawn summary",
  );

  const test1 = JSON.parse(
    fs.readFileSync("data/tests/test-1-reading.json", "utf8"),
  ) as typeof test12;
  const test1p3 = splitReadingPassageAndTasks(test1.parts[2]!.content);
  const ronalds = withParagraphLetterBank(
    withYearLetterBank(test1.parts[2]!.questions, test1p3.tasks),
    test1p3.tasks,
  );
  const year27 = ronalds.find((q) => q.number === 27);
  assert(
    (year27?.content.options ?? []).map((opt) => `${opt.label}${opt.text}`).join(",") ===
      "A1753,B1806,C1816,D1823,E1825,F1837,G1843",
    "questions 27-31 use the year letter bank",
  );
  assert(
    (ronalds.find((q) => q.number === 32)?.content.options?.length ?? 0) === 0,
    "questions 32-35 stay short answers",
  );
  const q36 = ronalds.find((q) => q.number === 36);
  assert(
    (q36?.content.options ?? []).map((opt) => opt.label).join("") === "ABCDEFGHI",
    "questions 36-40 use paragraph letters A-I",
  );
  assert(
    !/Source stem looks copy-pasted/.test(q36?.content.stem ?? ""),
    "questions 36-37 keep the Word sentence",
  );
  const ronaldsGroups = parseReadingQuestionGroups(test1p3.tasks, ronalds);
  const yearGroup = ronaldsGroups.find((group) => group.start === 27);
  assert(
    /correct year/.test(yearGroup?.instructions.join(" ") ?? "") &&
      !/1753/.test(yearGroup?.notes ?? ""),
    "the year instruction stays and the table is not dumped into notes",
  );

  console.log("reading-passage-chrome: ok");
}

main();
