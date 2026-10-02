import {
  addHighlight,
  buildPassageModel,
  quoteSlice,
  sanitizeHighlights,
  splitPiece,
} from "../src/lib/practice/passage-highlights";

function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

const model = buildPassageModel(
  "[[title]]Maps[[/title]]\n\n[[plabel]]A[[/plabel]] Humans are born with a map.",
);
assert(!model.text.includes("[["), "markup stays out of visible text");
assert(model.text.startsWith("Maps\nA Humans"), `visible text was ${JSON.stringify(model.text)}`);

const label = model.blocks.find((block) => block.kind === "paragraph");
assert(label && label.kind === "paragraph", "paragraph block");
if (label && label.kind === "paragraph") {
  const bold = label.pieces.find((piece) => piece.bold);
  assert(bold?.text === "A", "label letter is the bold piece");
  assert(bold && model.text.slice(bold.start, bold.start + bold.text.length) === "A", "offset matches letter");
}

const quote = quoteSlice(model.text, 0, 4);
assert(quote === "Maps", quote);

const added = addHighlight([], 1, 0, 4, model.text);
assert(added.length === 1 && added[0]!.quote === "Maps", "add highlight");
const merged = addHighlight(added, 1, 2, 6, model.text, "keep");
assert(merged.length === 1 && merged[0]!.note === "keep", "overlap merges");
assert(merged[0]!.start === 0 && merged[0]!.end >= 6, "merged range grows");

const piece = label && label.kind === "paragraph" ? label.pieces[0]! : null;
assert(piece, "piece");
if (piece) {
  const segs = splitPiece(piece, [
    { id: "h1", start: piece.start, end: piece.start + 1 },
  ]);
  assert(segs[0]?.highlightId === "h1" && segs[0]?.text === piece.text[0], "split marks first char");
}

const clean = sanitizeHighlights([
  { id: "ok", partOrder: 1, start: 0, end: 4, quote: "Maps", note: "n" },
  { id: "", partOrder: 1, start: 0, end: 2, quote: "x", note: "" },
  { id: "bad", partOrder: 1, start: 5, end: 5, quote: "x", note: "" },
]);
assert(clean.length === 1 && clean[0]!.id === "ok", "sanitize drops bad rows");

console.log("passage highlights ok");
