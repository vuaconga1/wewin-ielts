/**
 * Markdown tables whose cells hold several lines (bullets typed on new lines)
 * must stay one table: every row keeps all its lines and blanks.
 *
 * Run:
 *   npx tsx scripts/test-notes-table.ts
 */
import { detectNotesTable } from "../src/lib/practice/notes-table";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

// Cambridge IELTS 13 GT Test 1 Listening, Questions 1–10 (DB content).
const cookery = [
  "COOKERY CLASSES",
  "",
  "| Cookery Class | Focus | Other Information |",
  "| --- | --- | --- |",
  "| Example: The Food Studio | how to 1 ............... and cook with seasonal products | • small classes",
  "• also offers 2 ............... classes",
  "• clients who return get a 3 ............... discount |",
  "| Bond's Cookery School | food that is 4 ............... | • includes recipes to strengthen your 5 ...............",
  "• they have a free 6 ............... every Thursday |",
  "| The 7 ............... Centre | mainly 8 ............... food | • located near the 9 ...............",
  "• a special course in skills with a 10 ............... is sometimes available |",
].join("\n");
const cookeryTable = detectNotesTable(cookery);
assert(cookeryTable, "cookery table is detected");
assert(cookeryTable.title === "COOKERY CLASSES", "cookery title is kept");
assert(cookeryTable.rows.length === 3, `cookery has 3 rows, got ${cookeryTable.rows.length}`);
assert(
  cookeryTable.rows[0]![2] ===
    "• small classes<br>• also offers 2 ............... classes<br>• clients who return get a 3 ............... discount",
  `cookery row 1 keeps its three bullets: ${JSON.stringify(cookeryTable.rows[0]![2])}`,
);
assert(cookeryTable.rows[2]![0] === "The 7 ............... Centre", "cookery row 3 starts a new row");
const cookeryText = JSON.stringify(cookeryTable.rows);
for (let n = 1; n <= 10; n++) {
  assert(new RegExp(`\\b${n} \\.{3,}`).test(cookeryText), `cookery keeps blank ${n}`);
}

// Cambridge IELTS 17 GT Test 4 Reading, Questions 22–27: a soft-wrapped sentence
// ("… 27 ……… or ⏎disruption …", previous line ends with a space) is one line.
const plumbing = [
  "The work of plumbers",
  "",
  "| Type of plumber | Work-related issues | Skills/Actions needed |",
  "| --- | --- | --- |",
  "| Residential | • Working underfloor in a 22 ............... area",
  "• Dealing with a wood product | • Plan carefully",
  "• Always use the appropriate 23 ............... for each tool",
  "• Consider how different 24 ............... will be affected |",
  "| Commercial | • Working with advanced equipment designed for integrated systems | • Fully comprehend instructions",
  "• Take images of structures to locate important materials like 25 ............... |",
  "| Service | • Diagnosing problems and their causes",
  "• Fully understanding something someone else installed, e.g., a shower unit",
  "• Providing quick, 26 ............... solutions | • Deal well with people who have a lot of 27 ............... or ",
  "disruption as a result of their problems |",
].join("\n");
const plumbingTable = detectNotesTable(plumbing);
assert(plumbingTable, "plumbing table is detected");
assert(plumbingTable.rows.length === 3, `plumbing has 3 rows, got ${plumbingTable.rows.length}`);
assert(
  plumbingTable.rows[0]![1] === "• Working underfloor in a 22 ............... area<br>• Dealing with a wood product",
  `plumbing row 1 issues cell: ${JSON.stringify(plumbingTable.rows[0]![1])}`,
);
assert(
  plumbingTable.rows[0]![2] ===
    "• Plan carefully<br>• Always use the appropriate 23 ............... for each tool<br>• Consider how different 24 ............... will be affected",
  `plumbing row 1 skills cell: ${JSON.stringify(plumbingTable.rows[0]![2])}`,
);
assert(
  plumbingTable.rows[2]![2] ===
    "• Deal well with people who have a lot of 27 ............... or disruption as a result of their problems",
  `soft-wrapped sentence is joined with a space: ${JSON.stringify(plumbingTable.rows[2]![2])}`,
);

// Academic test-4 Listening, Questions 35–40 (data/tests/test-4-listening.json):
// "||" is an empty middle cell; bullets continue on the following lines.
const tyres = [
  "RECYCLYING TYRES",
  "",
  "| Process | | Possible Uses |",
  "| --- | --- | --- |",
  "| Removal of steel 35 ........ from tyre rim || Steel pellets used in industry |",
  "| ↓ | | |",
  "| Fibres, e.g. nylon, removed || * Strengthening concrete",
  "* Sheets made of 37 ........ |",
  "| Tyres cut up into crumb rubber || * Asphalt for roads",
  "* Insulation",
  "* 38 ........ tiles |",
].join("\n");
const tyresTable = detectNotesTable(tyres);
assert(tyresTable, "tyres table is detected");
assert(tyresTable.rows.length === 4, `tyres has 4 rows, got ${tyresTable.rows.length}`);
assert(
  tyresTable.rows[3]![2] === "* Asphalt for roads<br>* Insulation<br>* 38 ........ tiles",
  `tyres row 4 keeps blank 38: ${JSON.stringify(tyresTable.rows[3]![2])}`,
);

// Single-line rows are unchanged.
const simple = detectNotesTable("| A | B |\n| --- | --- |\n| 1 ...... | x |\n| y | 2 ...... |");
assert(simple && simple.rows.length === 2 && simple.rows[1]![1] === "2 ......", "single-line rows unchanged");

console.log("notes table regression: ok");
