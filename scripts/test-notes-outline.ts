/**
 * Bordered completion notes: title, plain section lines, indented bullets.
 *
 * Run:
 *   npx tsx scripts/test-notes-outline.ts
 */

import fs from "fs";
import { findInlineBlankNumbers } from "../src/components/practice/inline-notes-gaps";
import { splitBoxedSegments } from "../src/lib/practice/boxed-text";
import { htmlTableToMarkdown } from "../src/lib/practice/notes-table";
import {
  bowChartNotes,
  classifyOutlineNotes,
  isBoldNotesLine,
  isCenteredListLeadIn,
  isNotesSectionLabel,
  isBowChartNotes,
  isFlowchartNotes,
  isNotesSubheading,
  joinOrphanBullets,
  outlineBulletRowClass,
  outlineMarkerClass,
  OUTLINE_BOX_CLASS,
  OUTLINE_CENTER_CLASS,
  OUTLINE_PLAIN_CLASS,
  OUTLINE_TITLE_CLASS,
} from "../src/lib/practice/notes-outline";
import {
  parseReadingQuestionGroups,
  splitReadingPassageAndTasks,
} from "../src/lib/practice/reading-content";
import { perQuestionSentenceStem } from "../src/lib/questions/gap-stems";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const GRAPHITE_HTML = `<table><thead><tr><th><h3><strong>The early history of graphite in Britain</strong></h3><p>Graphite was first found below a <strong>1</strong> .......... blown down in a storm.</p><p>The first use of graphite was to make marks on <strong>2</strong> ..........</p><p>The characteristics of raw graphite:</p><ul><li><ul><li>dirty to use because it is so <strong>3</strong> ..........</li><li>originally wrapped in <strong>4</strong> .......... or animal skin to make it usable as a pencil.</li></ul></li></ul><p>Graphite came to the notice of the government for military and commercial purposes.</p><ul><li><ul><li>The government completely took over the <strong>5</strong> .......... at Borrowdale.</li><li>They employed guards to protect the graphite on its journey south.</li></ul></li></ul><p>Local people began to <strong>6</strong> .......... graphite for the money involved.</p><ul><li><ul><li>The government passed a law to protect the graphite industry.</li></ul></li></ul></th></tr></thead></table>`;

const HEADINGS_HTML = `<table><tr><th><h3>List of Headings</h3><p>i Early research</p><p>ii A convenient method</p></th></tr></table>`;

const GRAPHITE_NOTES = `
[[box]]
[[ntitle]]The early history of graphite in Britain[[/ntitle]]
Graphite was first found below a 1 .......... blown down in a storm.
The first use of graphite was to make marks on 2 ..........
The characteristics of raw graphite:
[[b1]]dirty to use because it is so 3 ..........
[[b1]]originally wrapped in 4 .......... or animal skin to make it usable as a pencil.
Graphite came to the notice of the government for military and commercial purposes.
[[b1]]The government completely took over the 5 .......... at Borrowdale.
[[b1]]They employed guards to protect the graphite on its journey south.
Local people began to 6 .......... graphite for the money involved.
[[b1]]The government passed a law to protect the graphite industry.
[[/box]]
`.trim();

function main() {
  const imported = htmlTableToMarkdown(GRAPHITE_HTML);
  assert(imported.startsWith("[[box]]"), "notes table should keep an outer box");
  assert(imported.includes("[[ntitle]]The early history of graphite in Britain[[/ntitle]]"), "title marker");
  assert(
    imported.includes("[[b1]]dirty to use because it is so 3 .........."),
    "level-1 bullet kept",
  );
  assert(
    !imported.split("\n").some((line) => line.startsWith("[[b") && line.includes("characteristics of raw graphite")),
    "section lead-in stays a plain line",
  );
  assert(
    imported.includes("The characteristics of raw graphite:"),
    "section lead-in text kept",
  );

  const headings = htmlTableToMarkdown(HEADINGS_HTML);
  assert(!headings.includes("[[box]]"), "heading bank is not a notes box");
  assert(headings.includes("List of Headings"), "heading bank text kept");

  const segments = splitBoxedSegments(GRAPHITE_NOTES);
  assert(segments.length === 1 && segments[0]!.kind === "box", "one box segment");
  assert(segments[0]!.kind === "box" && segments[0]!.value.includes("[[ntitle]]"), "title stays inside the box");
  assert(!segments.some((segment) => segment.kind === "title"), "ntitle is not a passage title");

  const lines = classifyOutlineNotes(segments[0]!.kind === "box" ? segments[0]!.value : "");
  const title = lines.find((line) => line.kind === "title");
  assert(title?.kind === "title" && title.text === "The early history of graphite in Britain", "centered title text");
  const section = lines.find(
    (line) => line.kind === "plain" && line.text.startsWith("The characteristics"),
  );
  assert(section?.kind === "plain", "section line is not a bullet");
  const bullets = lines.filter((line) => line.kind === "bullet");
  assert(bullets.length === 5, `expected 5 bullets, got ${bullets.length}`);
  assert(
    bullets.every((line) => line.kind === "bullet" && line.level === 1 && line.marker === "hollow"),
    "Word ilvl 1 bullets are hollow and indented one level",
  );

  assert(OUTLINE_BOX_CLASS.includes("border-zinc-500") && OUTLINE_BOX_CLASS.includes("bg-white"), "outer border");
  assert(!OUTLINE_BOX_CLASS.includes("f7f8fa"), "notes box is not the pale list");
  assert(OUTLINE_TITLE_CLASS.includes("text-center") && OUTLINE_TITLE_CLASS.includes("font-bold"), "title classes");
  assert(OUTLINE_PLAIN_CLASS.includes("text-left"), "section lines stay left aligned");
  assert(outlineBulletRowClass(1).includes("pl-9"), "level-1 indent");
  assert(outlineBulletRowClass(0).includes("pl-5"), "level-0 indent");
  assert(
    outlineBulletRowClass(2).includes("pl-14") &&
      outlineBulletRowClass(1) !== outlineBulletRowClass(2),
    "nested bullets indent further",
  );
  const hollow = outlineMarkerClass("hollow");
  assert(hollow.includes("notes-bullet-hollow") && hollow.includes("rounded-full"), "hollow circle");
  assert(hollow.includes("bg-transparent") && !hollow.includes("bg-zinc-900"), "hollow marker is not filled");
  assert(outlineMarkerClass("filled").includes("notes-bullet-filled"), "filled bullet class");

  const glyph = classifyOutlineNotes("Graphical Symbol\n• includes the logographs\n– Rosetta Stone was found");
  assert(glyph[0]?.kind === "title", "short heading above bullets is the title");
  assert(glyph[1]?.kind === "bullet" && glyph[1].marker === "filled" && glyph[1].level === 0, "filled disc");
  assert(glyph[2]?.kind === "bullet" && glyph[2].marker === "dash" && glyph[2].level === 1, "nested dash");
  const hollowWord = classifyOutlineNotes("o dirty to use because it is so 3 ..........");
  assert(hollowWord[0]?.kind === "bullet" && hollowWord[0].marker === "hollow", "o prefix is a hollow bullet");

  const numbers = findInlineBlankNumbers(GRAPHITE_NOTES);
  assert(numbers.join(",") === "1,2,3,4,5,6", `gaps 1-6, got ${numbers.join(",")}`);

  const tasks = `
Questions 1-6
Complete the notes below.
Write your answers in boxes 1-6 on your answer sheet.
${GRAPHITE_NOTES}
Questions 7-8
Complete the sentences below.
7 Clarence Saunders' first job was as ________ in a grocery store.
`.trim();
  const groups = parseReadingQuestionGroups(tasks, [
    { number: 1, type: "GAP_FILL", content: { stem: "", blank: true } },
    { number: 7, type: "GAP_FILL", content: { stem: "", blank: true } },
  ]);
  const notesGroup = groups.find((group) => group.start === 1);
  assert(notesGroup, "notes group");
  assert(notesGroup!.notes.includes("[[box]]") && notesGroup!.notes.includes("[[b1]]"), "notes stay boxed");
  assert(Object.keys(notesGroup!.sentenceStems).length === 0, "numbered gaps stay in the notes");
  const sentenceGroup = groups.find((group) => group.start === 7);
  assert(sentenceGroup?.sentenceStems[7]?.includes("Clarence"), "sentence gap still lifts");
  assert(!sentenceGroup?.notes.includes("Clarence"), "sentence is not also static notes");
  assert(
    perQuestionSentenceStem("7 Clarence Saunders' first job was as ________ in a grocery store."),
    "sentence-gap detector unchanged",
  );
  assert(
    perQuestionSentenceStem("[[b1]]dirty to use because it is so 3 ..........") === null,
    "bullet notes are not sentence gaps",
  );

  assert(isNotesSubheading("The core-accretion model"), "model heading is bold");
  assert(
    isNotesSubheading("The gravitational-instability model"),
    "second model heading is bold",
  );
  assert(
    !isNotesSubheading(
      "Hard centre becomes larger and this produces enough gravity to draw gas from the 38 .......... around it.",
    ),
    "a sentence with a gap is not a heading",
  );
  assert(!isNotesSubheading("Write the correct letter, A-F, in boxes 38-40 on your answer sheet."), "instructions stay plain");
  assert(
    !isNotesSubheading("from stars is very powerful. Heat caused by"),
    "text after a gap is not a heading",
  );
  const melatonin = joinOrphanBullets(`The melatonin shift
Biological changes
•
Melatonin is released two hours later
•
Melatonin causes 7 ..........
Caffeine
•
teens usually drink
10 ..........`);
  const outlined = classifyOutlineNotes(melatonin);
  assert(outlined.some((line) => line.kind === "title" && line.text === "The melatonin shift"), "notes title is centered");
  assert(outlined.some((line) => line.kind === "bullet" && /Melatonin is released/.test(line.text) && /10 /.test(line.text) === false), "orphan bullet joins the next line");
  const wrapped = classifyOutlineNotes(`•
Melatonin is released two hours later than before when teens start reaching
6 ........................ .
•
hormones that are released increase 9 .......... , causing risk of
obesity.`);
  const firstBullet = wrapped.find((line) => line.kind === "bullet");
  assert(firstBullet?.kind === "bullet" && /6 /.test(firstBullet.text), "wrapped gap stays on the bullet");
  const second = wrapped.filter((line) => line.kind === "bullet")[1];
  assert(second?.kind === "bullet" && /obesity/.test(second.text), "wrapped last word stays on the bullet");
  assert(isNotesSubheading("Caffeine"), "single-word section label is bold");
  assert(isNotesSubheading("Sleep loss"), "short section label is bold");
  assert(
    isFlowchartNotes("Shape the pots\n↓\nRemove the filters from the fire"),
    "a down arrow marks a flowchart",
  );
  assert(!isFlowchartNotes("Biological changes\nMelatonin causes 7 .........."), "outline notes are not a flowchart");
  assert(isBoldNotesLine("Biological changes", false), "a section line stays bold");
  assert(
    !isBoldNotesLine("Melatonin causes", true),
    "text in front of a gap is not bold",
  );
  assert(
    !isBoldNotesLine("Big drop in", true),
    "a short bullet fragment in front of a gap is not bold",
  );

  const test6 = JSON.parse(fs.readFileSync("data/tests/test-6-reading.json", "utf8")) as {
    parts: { content: string; questions: { number: number; type: string; content: { stem?: string } }[] }[];
  };
  const part3 = test6.parts[2]!;
  const bowTasks = splitReadingPassageAndTasks(part3.content).tasks;
  const bowGroups = parseReadingQuestionGroups(bowTasks, part3.questions);
  const bow = bowGroups.find((group) => group.start === 37 && group.end === 40);
  assert(bow && isBowChartNotes(bow.notes), "Test 6 questions 37-40 restore the bow chart");
  assert(
    findInlineBlankNumbers(bow!.notes).join(",") === "37,38,39,40",
    "bow chart blanks are 37-40, in the same order as figure boxes 11-14",
  );
  assert(/Find out their 38/.test(bow!.notes), "the second box is question 38");
  assert(/- 39 /.test(bow!.notes), "the first develop-through bullet is question 39");
  assert(/Processed by the 40/.test(bow!.notes), "the processed box is question 40");
  assert(/marketing intelligence activities/.test(bow!.notes), "fixed develop-through lines stay");
  assert(/Timely and accurate data description/.test(bow!.notes), "the return box stays plain");
  assert(bowChartNotes(37).startsWith("[[bow]]"), "bow chart marker is present");

  const prosopagnosia = `The challenges for prosopagnosia researchers
Causes of prosopagnosia
Prosopagnosia may be caused by
• just one 10 …… according to Martina Gruter
• a defect in the 11 …… eye according to Brad Duchaine`;
  const causes = classifyOutlineNotes(prosopagnosia);
  const lead = causes.find((line) => line.kind === "center");
  assert(
    lead?.kind === "center" && lead.text === "Prosopagnosia may be caused by",
    "the cause lead-in stays a left-aligned plain line",
  );
  assert(
    !isBoldNotesLine("Prosopagnosia may be caused by", false),
    "the cause lead-in is not bold",
  );
  assert(
    OUTLINE_CENTER_CLASS.includes("text-left") &&
      OUTLINE_CENTER_CLASS.includes("font-normal") &&
      !OUTLINE_CENTER_CLASS.includes("text-center"),
    "the cause lead-in is left aligned",
  );
  assert(isCenteredListLeadIn("Prosopagnosia may be caused by"), "lead-in detector");
  assert(
    causes.some(
      (line) => line.kind === "plain" && line.text === "Causes of prosopagnosia",
    ),
    "the section label stays a left heading",
  );
  const maps = classifyOutlineNotes(`The development of maps from the 19th century onwards
- A growing interest in travel led to the increased production of maps in the 19th century.
After 1865:
- Rand McNally made a lot of money by putting a map and a 1……………… in one publication.
- George Blum’s cycling map showed:
+ The kind of 2……………… the paths had.
+ Finding economical 3………………`);
  assert(maps[0]?.kind === "title", "maps title stays centered");
  assert(
    maps.some((line) => line.kind === "plain" && line.text === "After 1865:"),
    "date labels stay plain section lines",
  );
  assert(isNotesSectionLabel("After 1865:") && isNotesSectionLabel("1900 onwards:"), "date labels are bold section labels");
  assert(!isNotesSectionLabel("George Blum’s cycling map showed:"), "a long bullet ending with a colon is not a section label");
  const mapDash = maps.find((line) => line.kind === "bullet" && line.marker === "dash");
  const mapPlus = maps.filter((line) => line.kind === "bullet" && line.marker === "plus");
  assert(mapDash?.kind === "bullet" && mapDash.level === 1, "hyphen notes are first-level dashes");
  assert(
    mapPlus.length === 2 && mapPlus.every((line) => line.kind === "bullet" && line.level === 2),
    "plus notes nest under the hyphen",
  );
  assert(
    mapPlus[0]?.kind === "bullet" && mapPlus[0].text.startsWith("The kind of 2"),
    "the plus marker is not left in the sentence",
  );
  assert(outlineMarkerClass("plus").includes("notes-bullet-plus"), "plus marker class");

  const causeBullets = causes.filter((line) => line.kind === "bullet");
  assert(
    causeBullets.length === 2 &&
      causeBullets.every(
        (line) => line.kind === "bullet" && line.marker === "filled",
      ),
    "questions 10 and 11 are filled bullets",
  );

  console.log("notes outline ok");
}

main();
