/**
 * Smart grading engine for Worksheet exercises with tolerant normalization.
 */

const CONTRACTION_PAIRS: [RegExp, string][] = [
  [/\bi am\b/gi, "i'm"],
  [/\bhe is\b/gi, "he's"],
  [/\bshe is\b/gi, "she's"],
  [/\bit is\b/gi, "it's"],
  [/\bwe are\b/gi, "we're"],
  [/\bthey are\b/gi, "they're"],
  [/\byou are\b/gi, "you're"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhad not\b/gi, "hadn't"],
  [/\bwill not\b/gi, "won't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcan not\b/gi, "can't"],
  [/\bcould not\b/gi, "couldn't"],
  [/\bshould not\b/gi, "shouldn't"],
  [/\bwould not\b/gi, "wouldn't"],
];

/**
 * Standardize text by removing extra spaces, trailing punctuation, and normalizing quotes.
 */
export function normalizeAnswerText(raw: string): string {
  if (!raw) return "";

  let text = raw
    .trim()
    .toLowerCase()
    // normalize quotation marks and apostrophes
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // collapse whitespace
    .replace(/\s+/g, " ");

  // remove trailing sentence punctuation
  text = text.replace(/[.?!,;:]+$/, "").trim();

  return text;
}

/**
 * Produce variants (with contracted and expanded forms) for flexible matching.
 */
export function generateEquivalents(text: string): string[] {
  const base = normalizeAnswerText(text);
  if (!base) return [];

  const variants = new Set<string>([base]);

  // Apply contractions (e.g. "he is" -> "he's")
  let contracted = base;
  for (const [pattern, replacement] of CONTRACTION_PAIRS) {
    contracted = contracted.replace(pattern, replacement);
  }
  variants.add(contracted);

  // Apply reverse expansions for key contractions
  let expanded = base;
  const EXPANSION_MAP: Record<string, string> = {
    "i'm": "i am",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "you're": "you are",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "won't": "will not",
    "can't": "cannot",
    "couldn't": "could not",
    "shouldn't": "should not",
    "wouldn't": "would not",
  };

  for (const [short, full] of Object.entries(EXPANSION_MAP)) {
    const rx = new RegExp(`\\b${short}\\b`, "gi");
    expanded = expanded.replace(rx, full);
  }
  variants.add(expanded);

  return Array.from(variants);
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

  for (const accepted of acceptedAnswers) {
    const acceptedVariants = generateEquivalents(accepted);
    // If any user variant matches any accepted variant
    const matched = userVariants.some((uv) => acceptedVariants.includes(uv));
    if (matched) {
      return { isCorrect: true, normalizedInput: normUser };
    }
  }

  return { isCorrect: false, normalizedInput: normUser };
}

