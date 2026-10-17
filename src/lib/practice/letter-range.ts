/**
 * Map / plan / letter-bank groups print "Write the correct letter, A–H" but
 * the questions often carry no option list. The answer is still one letter,
 * so the ANSWERS column offers A…H as a dropdown instead of free text.
 */

type LetterOption = { label: string; text: string };

const HEADER = /questions?\s+(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi;
const LETTER_RANGE = /correct\s+letters?\s*,?\s*([A-Z])\s*[-–—]\s*([A-Z])\b/i;

/** Letters A…X from the instruction of the tightest "Questions x–y" group covering `number`. */
export function letterRangeOptions(text: string, number: number): LetterOption[] | null {
  if (!text) return null;
  const headers = [...text.matchAll(HEADER)].map((m) => ({
    index: m.index ?? 0,
    start: Number(m[1]),
    end: Number(m[2]),
  }));

  let best: (typeof headers)[number] | null = null;
  for (const h of headers) {
    if (number < h.start || number > h.end) continue;
    if (!best || h.end - h.start < best.end - best.start) best = h;
  }
  if (!best) return null;

  const next = headers.find(
    (h) => h.index > best.index && (h.start !== best.start || h.end !== best.end),
  );
  const segment = text.slice(best.index, next?.index ?? text.length);
  const match = LETTER_RANGE.exec(segment);
  if (!match) return null;

  const from = match[1]!.toUpperCase().charCodeAt(0);
  const to = match[2]!.toUpperCase().charCodeAt(0);
  if (to <= from || to - from > 25) return null;
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const letter = String.fromCharCode(from + i);
    return { label: letter, text: letter };
  });
}
