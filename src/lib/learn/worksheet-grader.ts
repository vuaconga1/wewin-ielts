/**
 * Smart grading engine for Worksheet exercises with tolerant normalization.
 */

/**
 * Standardize text: lowercase, unify apostrophes, drop sentence punctuation and quotes, collapse spaces.
 * "/" is kept because it separates gaps in multi-gap answers.
 */
export function normalizeAnswerText(raw: string): string {
  if (!raw) return "";

  return raw
    .toLowerCase()
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D"]/g, " ")
    .replace(/[.?!,;:…]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, " / ")
    .trim();
}

/** Split a key into gaps (" / ") and per-gap alternatives ("|"). */
export function parseKeyGaps(key: string): string[][] {
  return key.split(" / ").map((gap) =>
    gap
      .split("|")
      .map((alt) => alt.trim())
      .filter(Boolean),
  );
}

/** Expand "at|on / in" into ["at / in", "on / in"]. */
function expandKey(key: string): string[] {
  if (!key.includes("|")) return [key];
  return parseKeyGaps(key).reduce<string[]>(
    (acc, alts) => acc.flatMap((prefix) => alts.map((a) => (prefix ? `${prefix} / ${a}` : a))),
    [""],
  );
}

/** Human-readable key: "(1) at / on  (2) in" for multi-gap, "at / on" for single gap. */
export function formatAnswerKey(key: string): string {
  const gaps = parseKeyGaps(key);
  if (gaps.length <= 1) return (gaps[0] ?? []).join(" / ");
  return gaps.map((alts, i) => `(${i + 1}) ${alts.join(" / ")}`).join("  ");
}

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7",
  eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14",
  fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20",
  thirty: "30", forty: "40", fifty: "50", hundred: "100",
};

/** Unambiguous contractions → full forms; number words → digits. */
function expandUnambiguous(text: string): string {
  return text
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/\bcan't\b|\bcannot\b/g, "can not")
    .replace(/\bain't\b/g, "is not")
    .replace(/\blet's\b/g, "let us")
    .replace(/n't\b/g, " not")
    .replace(/'ve\b/g, " have")
    .replace(/'ll\b/g, " will")
    .replace(/'re\b/g, " are")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\b[a-z]+\b/g, (w) => NUMBER_WORDS[w] ?? w)
    .replace(/\s+/g, " ")
    .trim();
}

const MAX_AMBIGUOUS = 4;

/**
 * Canonical variants for matching. "'s" may be is / has / possessive and "'d" may be would / had,
 * so each occurrence branches into every reading (both sides are expanded the same way).
 */
export function generateEquivalents(text: string): string[] {
  const base = normalizeAnswerText(text);
  if (!base) return [];

  const expanded = expandUnambiguous(base);
  const parts = expanded.split(/('s|'d)\b/);
  const ambiguous = Math.floor(parts.length / 2);
  if (ambiguous === 0 || ambiguous > MAX_AMBIGUOUS) return [expanded];

  let variants = [""];
  parts.forEach((part, i) => {
    const options =
      i % 2 === 0 ? [part] : part === "'s" ? ["'s", " is", " has"] : ["'d", " would", " had"];
    variants = variants.flatMap((v) => options.map((o) => v + o));
  });
  return Array.from(new Set(variants.map((v) => v.replace(/\s+/g, " ").trim())));
}

/** Questions without a usable key can't be auto-graded and must not count as wrong. */
export function hasAnswerKey(acceptedAnswers: string[] | undefined): boolean {
  return (acceptedAnswers ?? []).some((a) => normalizeAnswerText(a).length > 0);
}

/**
 * Check if the user's input matches any of the accepted answers.
 */
export function checkAnswer(
  userInput: string,
  acceptedAnswers: string[]
): { isCorrect: boolean; normalizedInput: string } {
  const normUser = normalizeAnswerText(userInput);
  if (!normUser) {
    return { isCorrect: false, normalizedInput: "" };
  }

  const userVariants = generateEquivalents(normUser);

  for (const accepted of acceptedAnswers.flatMap(expandKey)) {
    const acceptedVariants = generateEquivalents(accepted);
    // If any user variant matches any accepted variant
    const matched = userVariants.some((uv) => acceptedVariants.includes(uv));
    if (matched) {
      return { isCorrect: true, normalizedInput: normUser };
    }
  }

  return { isCorrect: false, normalizedInput: normUser };
}

