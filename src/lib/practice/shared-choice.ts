/**
 * Questions that reuse one answer bank (True/False/Not Given, Yes/No/Not Given,
 * matching headings / features / information, summary word lists, choose-two).
 * The exam UI shows that bank once, then a dropdown per answer slot.
 */

import { isMultiSelectQuestion } from "@/lib/practice/multi-select";

export type ChoiceOption = { label: string; text: string };

export type ClusterableQuestion = {
  number: number;
  type: string;
  content: {
    options?: ChoiceOption[];
    selectCount?: number;
    covers?: number[];
    pairedFrom?: number;
  };
};

export type ChoiceCluster<T> =
  | { kind: "single"; question: T }
  | { kind: "bank"; questions: T[] };

const CLOSED_SET = /^(TRUE|FALSE|YES|NO|NOT GIVEN)$/i;

export function isRepeatingChoiceType(type: string): boolean {
  return type === "TRUE_FALSE_NG" || type === "MATCHING";
}

/** Stable identity for “these questions share the same option list”. */
export function optionBankKey(
  options: ChoiceOption[] | undefined,
): string | null {
  if (!options || options.length < 2) return null;
  return options
    .map((opt) => `${opt.label.trim()}\t${opt.text.trim()}`)
    .join("\n");
}

/**
 * Dropdown text: the letter (A, B, i, ii) or the closed-set word
 * (TRUE, FALSE, NOT GIVEN, YES, NO). Full wording stays in the option box.
 */
export function dropdownChoiceLabel(opt: ChoiceOption): string {
  const label = opt.label.trim();
  const text = opt.text.trim();
  if (
    !text ||
    label.localeCompare(text, undefined, { sensitivity: "accent" }) === 0
  ) {
    return label;
  }
  if (/^[A-Z]$/i.test(label) || /^(?:viii|vii|vi|iv|iii|ii|ix|x|v|i)$/i.test(label)) {
    return label;
  }
  if (CLOSED_SET.test(label)) return label;
  return label;
}

/**
 * A bank whose every row is only the letter (A / A, or an empty text)
 * is not a word list. Do not draw that box.
 */
export function optionBankIsLetterOnly(options: ChoiceOption[]): boolean {
  if (options.length < 2) return false;
  return options.every((opt) => {
    const label = opt.label.trim();
    const text = opt.text.trim();
    const same =
      !text ||
      label.localeCompare(text, undefined, { sensitivity: "accent" }) === 0;
    return same && /^[A-Z]$/i.test(label);
  });
}

/**
 * Short letter + phrase lists (A gravitational pull … F disk) sit in a
 * 3-column table, the same shape as a Word summary word box
 * (3×2 for A–F, 3×4 for A–L). Longer matching lines stay a single column.
 */
export function optionBankUsesWordGrid(options: ChoiceOption[]): boolean {
  if (options.length < 4 || options.length > 12) return false;
  if (optionBankIsLetterOnly(options)) return false;
  return options.every((opt) => {
    const label = opt.label.trim();
    const text = opt.text.trim();
    if (!/^[A-Z]$/i.test(label)) return false;
    return text.length > 0 && text.length <= 28 && !text.includes("\n");
  });
}

/**
 * Matching questions whose numbers already sit in the summary blanks
 * share one word list. The list is drawn once under the summary.
 */
export function inlineChoiceBank<T extends ClusterableQuestion>(
  questions: T[],
  inlineNumbers: Set<number>,
): ChoiceOption[] | null {
  const hit = questions.filter(
    (q) =>
      inlineNumbers.has(q.number) &&
      isRepeatingChoiceType(q.type) &&
      (q.content.options?.length ?? 0) >= 2,
  );
  if (hit.length === 0) return null;
  const key = optionBankKey(hit[0]!.content.options);
  if (!key) return null;
  if (!hit.every((q) => optionBankKey(q.content.options) === key)) return null;
  return hit[0]!.content.options ?? null;
}

/** TRUE / NOT GIVEN need a wider control than a single letter. */
export function choiceLabelsAreWords(options: ChoiceOption[]): boolean {
  return options.some((opt) => {
    const label = opt.label.trim();
    if (CLOSED_SET.test(label)) return true;
    return label.length > 1 && !/^(?:viii|vii|vi|iv|iii|ii|ix|x|v|i)$/i.test(label);
  });
}

/**
 * Group consecutive questions that should share one option box.
 * A lone multiple-choice item keeps its own radio list.
 * True/False/Not Given, matching, and choose-N always use the bank,
 * even when the group has a single question.
 */
export function clusterSharedChoices<T extends ClusterableQuestion>(
  questions: T[],
): ChoiceCluster<T>[] {
  const out: ChoiceCluster<T>[] = [];
  let run: T[] = [];
  let runKey: string | null = null;

  const flush = () => {
    if (run.length === 0) return;
    const useBank =
      Boolean(runKey) &&
      (run.length >= 2 ||
        run.some(
          (q) =>
            isRepeatingChoiceType(q.type) ||
            isMultiSelectQuestion(q.content),
        ));
    if (useBank) out.push({ kind: "bank", questions: run });
    else {
      for (const q of run) out.push({ kind: "single", question: q });
    }
    run = [];
    runKey = null;
  };

  for (const q of questions) {
    const key = optionBankKey(q.content.options);
    if (!key) {
      flush();
      out.push({ kind: "single", question: q });
      continue;
    }
    if (runKey === key) {
      run.push(q);
      continue;
    }
    flush();
    run = [q];
    runKey = key;
  }
  flush();
  return out;
}
