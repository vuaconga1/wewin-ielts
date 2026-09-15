/**
 * Strip teacher-filled answers / markup from Listening notes so students
 * see blanks only (Test 1 Listening often ships with answers typed into dots).
 */

/**
 * Teacher-filled blanks usually look like `1 ......database..............`
 * (answer nestled in dots). Require trailing blank marks so we do not eat
 * real sentence tails like `6 ................ is required`.
 */
const FILLED_BLANK_RE =
  /(\d{1,2})[^\S\n]*((?:[$£€][^\S\n]*)?)((?:[.…_…]|\.){2,}|\u2026+|_{2,})[^\S\n]*([A-Za-z0-9][A-Za-z0-9/'%.|-]*(?:\/[A-Za-z0-9]+)?(?:[^\S\n]+[A-Za-z0-9][A-Za-z0-9/'%.|-]*){0,4})[^\S\n]*((?:[.…_…]|\.){2,}|\u2026+|_{2,})/gu;

/** Standalone map-style filled letter blanks without a leading number on same token */
const FILLED_LETTER_BLANK_RE =
  /((?:[.…_…]|\.){2,}|\u2026+)\s*([A-I])\s*((?:[.…_…]|\.){2,}|\u2026+)/g;

export function stripFilledListeningAnswers(text: string): {
  text: string;
  stripped: number;
} {
  if (!text?.trim()) return { text: text ?? "", stripped: 0 };
  let stripped = 0;

  // Strip markup before blanks so `= free for 7......` does not eat Q7
  let out = text.replace(
    /\s*=\s*[A-Za-z][A-Za-z\s.,'-]{0,35}(?=\s|$)/g,
    () => {
      stripped += 1;
      return "";
    },
  );

  out = out.replace(/\(\s*x\s*\d+\s*\)\s*/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(/\bsửa\s+lần\s+\d+\b/gi, () => {
    stripped += 1;
    return "";
  });
  out = out.replace(
    /\bWORDS?\s+LIMIT\b|\bFINAL\s+DECISION\b|\bwasn'?t\s+crowded\b|\bshow\s+emotions\s*—?>?\s*plant\b|\(\s*trees\s*\)/gi,
    () => {
      stripped += 1;
      return "";
    },
  );

  out = out.replace(FILLED_BLANK_RE, (_m, num, currency) => {
    stripped += 1;
    const cur = currency ? String(currency).trim() + " " : "";
    return `${num} ${cur}........`;
  });

  out = out.replace(FILLED_LETTER_BLANK_RE, () => {
    stripped += 1;
    return "........";
  });

  // Matching labels with teacher letter filled in: "On the Water D" / "Faces A"
  out = out.replace(
    /^(?:[A-F]\.\s*)?([A-Za-z][A-Za-z0-9 &'/-]{2,40}?)\s+([A-F])\s*$/gm,
    (_m, label) => {
      stripped += 1;
      return String(label).trim();
    },
  );

  // Collapse spaces left by markup removal (keep newlines)
  out = out
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  return { text: out.trim(), stripped };
}
