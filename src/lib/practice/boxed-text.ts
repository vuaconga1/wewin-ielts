/**
 * Word tables and bordered boxes that are not real multi-column grids
 * are stored as `[[box]]` … `[[/box]]` so the practice UI can keep the frame.
 * A price chip inside a box uses `[[price]]` … `[[/price]]`.
 */

export type BoxedSegment =
  | { kind: "text"; value: string }
  | { kind: "box"; value: string }
  | { kind: "section"; value: string }
  | { kind: "title"; value: string }
  | { kind: "phead"; value: string };

const MARK_RE = /\[\[(box|section|title|phead)\]\]\r?\n?([\s\S]*?)\[\[\/\1\]\]/g;

export function splitBoxedSegments(text: string): BoxedSegment[] {
  const source = text.replace(/\r\n/g, "\n");
  if (
    !source.includes("[[box]]") &&
    !source.includes("[[section]]") &&
    !source.includes("[[title]]") &&
    !source.includes("[[phead]]")
  ) {
    return [{ kind: "text", value: source }];
  }

  const segments: BoxedSegment[] = [];
  let last = 0;
  const re = new RegExp(MARK_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    if (match.index > last) {
      segments.push({ kind: "text", value: source.slice(last, match.index) });
    }
    const kind =
      match[1] === "section"
        ? "section"
        : match[1] === "title"
          ? "title"
          : match[1] === "phead"
            ? "phead"
            : "box";
    segments.push({
      kind,
      value: match[2]!.replace(/^\n+|\n+$/g, "").trim(),
    });
    last = match.index + match[0].length;
  }
  if (last < source.length) {
    segments.push({ kind: "text", value: source.slice(last) });
  }
  return segments.filter(
    (segment) => segment.kind !== "text" || segment.value.trim(),
  );
}

export type PricePiece =
  | { kind: "text"; value: string }
  | { kind: "price"; value: string };

export function splitPricePieces(text: string): PricePiece[] {
  const re = /\[\[price\]\]([\s\S]*?)\[\[\/price\]\]/g;
  const pieces: PricePiece[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      pieces.push({ kind: "text", value: text.slice(last, match.index) });
    }
    pieces.push({ kind: "price", value: match[1]!.trim() });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    pieces.push({ kind: "text", value: text.slice(last) });
  }
  return pieces.filter((piece) => piece.kind === "price" || piece.value.trim());
}
