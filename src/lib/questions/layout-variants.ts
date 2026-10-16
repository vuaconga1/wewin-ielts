import type { ImportIssue, PartDraft, ParsedTestDraft, QuestionDraft } from "@/lib/import/schemas";

export const QUESTION_LAYOUT_VARIANTS = [
  "SINGLE_CHOICE",
  "MULTI_SELECT",
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "FORM_COMPLETION",
  "NOTE_COMPLETION",
  "SUMMARY_COMPLETION",
  "SENTENCE_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "SHORT_ANSWER",
  "MATCHING_HEADINGS",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
  "MAP_LABELING",
  "PLAN_LABELING",
  "DIAGRAM_LABELING",
  "WRITING_GENERAL_LETTER",
  "WRITING_ESSAY",
  "SPEAKING_PART_1",
  "SPEAKING_PART_2",
  "SPEAKING_PART_3",
] as const;

export type QuestionLayoutVariant = (typeof QUESTION_LAYOUT_VARIANTS)[number];

/** Stored question.type that each layout uses when a teacher picks it in the editor. */
export const LAYOUT_VARIANT_TYPE: Record<QuestionLayoutVariant, QuestionDraft["type"]> = {
  SINGLE_CHOICE: "MULTIPLE_CHOICE",
  MULTI_SELECT: "MULTIPLE_CHOICE",
  TRUE_FALSE_NOT_GIVEN: "TRUE_FALSE_NG",
  YES_NO_NOT_GIVEN: "TRUE_FALSE_NG",
  FORM_COMPLETION: "GAP_FILL",
  NOTE_COMPLETION: "GAP_FILL",
  SUMMARY_COMPLETION: "GAP_FILL",
  SENTENCE_COMPLETION: "GAP_FILL",
  TABLE_COMPLETION: "TABLE_COMPLETION",
  FLOW_CHART_COMPLETION: "GAP_FILL",
  SHORT_ANSWER: "SHORT_ANSWER",
  MATCHING_HEADINGS: "MATCHING",
  MATCHING_INFORMATION: "MATCHING",
  MATCHING_FEATURES: "MATCHING",
  MATCHING_SENTENCE_ENDINGS: "MATCHING",
  MAP_LABELING: "MAP_LABELING",
  PLAN_LABELING: "MAP_LABELING",
  DIAGRAM_LABELING: "MAP_LABELING",
  WRITING_GENERAL_LETTER: "ESSAY",
  WRITING_ESSAY: "ESSAY",
  SPEAKING_PART_1: "SPEAKING_PROMPT",
  SPEAKING_PART_2: "SPEAKING_PROMPT",
  SPEAKING_PART_3: "SPEAKING_PROMPT",
};

const LAYOUTS_BY_SKILL: Record<string, readonly QuestionLayoutVariant[]> = {
  LISTENING: [
    "SINGLE_CHOICE",
    "MULTI_SELECT",
    "FORM_COMPLETION",
    "NOTE_COMPLETION",
    "SUMMARY_COMPLETION",
    "SENTENCE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "SHORT_ANSWER",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MAP_LABELING",
    "PLAN_LABELING",
    "DIAGRAM_LABELING",
  ],
  READING: [
    "SINGLE_CHOICE",
    "MULTI_SELECT",
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "NOTE_COMPLETION",
    "SUMMARY_COMPLETION",
    "SENTENCE_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "SHORT_ANSWER",
    "MATCHING_HEADINGS",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "DIAGRAM_LABELING",
  ],
  WRITING: ["WRITING_GENERAL_LETTER", "WRITING_ESSAY"],
  SPEAKING: ["SPEAKING_PART_1", "SPEAKING_PART_2", "SPEAKING_PART_3"],
};

export function layoutVariantsForSkill(skill: string): QuestionLayoutVariant[] {
  return [...(LAYOUTS_BY_SKILL[skill] ?? QUESTION_LAYOUT_VARIANTS)];
}

const CHOICE_LAYOUTS = new Set<QuestionLayoutVariant>([
  "SINGLE_CHOICE",
  "MULTI_SELECT",
  "TRUE_FALSE_NOT_GIVEN",
  "YES_NO_NOT_GIVEN",
  "MATCHING_HEADINGS",
  "MATCHING_INFORMATION",
  "MATCHING_FEATURES",
  "MATCHING_SENTENCE_ENDINGS",
]);

export function layoutUsesChoices(variant: QuestionLayoutVariant): boolean {
  return CHOICE_LAYOUTS.has(variant);
}

type ChoiceOption = { label: string; text: string };

function isChoiceOption(value: unknown): value is ChoiceOption {
  if (!value || typeof value !== "object") return false;
  const option = value as { label?: unknown; text?: unknown };
  return typeof option.label === "string" && typeof option.text === "string";
}

/** Keep existing choices when they already fit. Otherwise seed a usable bank. */
export function optionsForLayout(
  variant: QuestionLayoutVariant,
  current: unknown,
): ChoiceOption[] | undefined {
  if (!layoutUsesChoices(variant)) return undefined;
  const options = Array.isArray(current) ? current.filter(isChoiceOption) : [];
  const labels = options.map((option) => option.label.trim().toUpperCase());
  if (variant === "TRUE_FALSE_NOT_GIVEN") {
    if (labels.includes("TRUE") && labels.includes("FALSE")) return options;
    return [
      { label: "TRUE", text: "TRUE" },
      { label: "FALSE", text: "FALSE" },
      { label: "NOT GIVEN", text: "NOT GIVEN" },
    ];
  }
  if (variant === "YES_NO_NOT_GIVEN") {
    if (labels.includes("YES") && labels.includes("NO")) return options;
    return [
      { label: "YES", text: "YES" },
      { label: "NO", text: "NO" },
      { label: "NOT GIVEN", text: "NOT GIVEN" },
    ];
  }
  if (options.length >= 2) return options;
  return [
    { label: "A", text: "" },
    { label: "B", text: "" },
    { label: "C", text: "" },
  ];
}

/** Apply a teacher-selected layout without dropping the stem or answer key. */
export function applyLayoutVariant(
  question: QuestionDraft,
  variant: QuestionLayoutVariant,
): QuestionDraft {
  const content: Record<string, unknown> = { ...question.content, variant };
  const seeded = optionsForLayout(variant, content.options);
  if (seeded) content.options = seeded;
  if (variant === "MULTI_SELECT") {
    const selectCount =
      typeof content.selectCount === "number" && content.selectCount >= 2
        ? content.selectCount
        : 2;
    content.selectCount = selectCount;
  }
  if (variant === "SINGLE_CHOICE") {
    delete content.selectCount;
    delete content.covers;
  }
  if (variant === "SPEAKING_PART_1") content.speakingPart = 1;
  if (variant === "SPEAKING_PART_2") content.speakingPart = 2;
  if (variant === "SPEAKING_PART_3") content.speakingPart = 3;
  if (variant === "WRITING_GENERAL_LETTER" && typeof content.minWords !== "number") {
    content.minWords = 150;
  }
  if (variant === "WRITING_ESSAY" && typeof content.minWords !== "number") {
    content.minWords = question.number === 1 ? 150 : 250;
  }
  return { ...question, type: LAYOUT_VARIANT_TYPE[variant], content };
}

type Content = Record<string, unknown> & {
  stem?: string;
  variant?: QuestionLayoutVariant;
  options?: { label: string; text: string }[];
  selectCount?: number;
  covers?: number[];
  imageUrl?: string;
  minWords?: number;
  speakingPart?: number;
};

function textFor(question: QuestionDraft, part: PartDraft): string {
  const content = question.content as Content;
  return [part.title, part.content, content.stem]
    .filter((value): value is string => typeof value === "string")
    .join("\n")
    .toLowerCase();
}

export function inferQuestionLayoutVariant(
  question: QuestionDraft,
  part: PartDraft,
  examType: ParsedTestDraft["examType"],
): QuestionLayoutVariant {
  const content = question.content as Content;
  if (content.variant && QUESTION_LAYOUT_VARIANTS.includes(content.variant)) {
    return content.variant;
  }
  const text = textFor(question, part);

  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return (content.selectCount ?? 1) >= 2 ? "MULTI_SELECT" : "SINGLE_CHOICE";
    case "TRUE_FALSE_NG":
      return /yes\s*\/\s*no|yes if|no if|views? or claims?/.test(text)
        ? "YES_NO_NOT_GIVEN"
        : "TRUE_FALSE_NOT_GIVEN";
    case "MATCHING":
      if (content.options?.length && content.options.every((o) => /^[ivx]+$/i.test(o.label))) {
        return "MATCHING_HEADINGS";
      }
      if (/sentence endings?|complete each sentence/.test(text)) return "MATCHING_SENTENCE_ENDINGS";
      if (/list of headings?|correct heading/.test(text)) return "MATCHING_HEADINGS";
      if (/matching features?|which person|which researcher|which year|which place/.test(text)) {
        return "MATCHING_FEATURES";
      }
      return "MATCHING_INFORMATION";
    case "TABLE_COMPLETION":
      return "TABLE_COMPLETION";
    case "MAP_LABELING":
      if (/\bplan\b|floor plan/.test(text)) return "PLAN_LABELING";
      if (/\bdiagram\b/.test(text)) return "DIAGRAM_LABELING";
      return "MAP_LABELING";
    case "SHORT_ANSWER":
      return "SHORT_ANSWER";
    case "GAP_FILL":
      if (/flow[ -]?chart|process/.test(text)) return "FLOW_CHART_COMPLETION";
      if (/complete the form|application form|booking form/.test(text)) return "FORM_COMPLETION";
      if (/complete the summary/.test(text)) return "SUMMARY_COMPLETION";
      if (/complete the sentences?/.test(text)) return "SENTENCE_COMPLETION";
      return "NOTE_COMPLETION";
    case "ESSAY":
      return examType === "GENERAL" && question.number === 1
        ? "WRITING_GENERAL_LETTER"
        : "WRITING_ESSAY";
    case "SPEAKING_PROMPT": {
      const part = content.speakingPart;
      if (part === 2 || /part\s*2|section\s*2\b|cue card|long turn|you should say/.test(text)) return "SPEAKING_PART_2";
      if (part === 3 || /part\s*3|section\s*3\b|discussion/.test(text)) return "SPEAKING_PART_3";
      return "SPEAKING_PART_1";
    }
    default:
      return "SHORT_ANSWER";
  }
}

export function applyQuestionLayoutVariants(draft: ParsedTestDraft): ParsedTestDraft {
  return {
    ...draft,
    parts: draft.parts.map((part) => ({
      ...part,
      questions: part.questions.map((question) => ({
        ...question,
        content: {
          ...question.content,
          variant: inferQuestionLayoutVariant(question, part, draft.examType),
        },
      })),
    })),
  };
}

function optionLabels(content: Content): string[] {
  return (content.options ?? []).map((option) => option.label.trim()).filter(Boolean);
}

function instructionWordLimit(text: string): number | null {
  const match = text.match(/(?:no more than|up to)\s+(one|two|three|four|\d+)\s+words?/i);
  if (!match) return null;
  const values: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
  return values[match[1]!.toLowerCase()] ?? Number(match[1]);
}

function answerWordCount(value: string): number {
  return value.trim().split(/\s+/).filter((token) => token && !/^\d+(?:[.,]\d+)?$/.test(token)).length;
}
function answerTokens(answer: unknown): string[] {
  if (Array.isArray(answer)) return answer.flatMap(answerTokens);
  if (typeof answer !== "string") return [];
  return answer.split(/\s*(?:\||\/)\s*/).map((value) => value.trim()).filter(Boolean);
}

export function validateQuestionLayouts(draft: ParsedTestDraft): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const allNumbers = new Set<number>();

  const audioCount = draft.audioFiles?.length ?? 0;
  if (draft.skill === "LISTENING" && audioCount !== 1 && audioCount !== draft.parts.length) {
    issues.push({
      level: "error",
      code: "AUDIO_SECTION_COUNT_MISMATCH",
      message: `Listening có ${draft.parts.length} section nhưng có ${draft.audioFiles?.length ?? 0} file audio.`,
    });
  }

  for (const part of draft.parts) {
    for (const question of part.questions) {
      const content = question.content as Content;
      const variant = inferQuestionLayoutVariant(question, part, draft.examType);
      const prefix = `Q${question.number} (${part.title})`;

      if (allNumbers.has(question.number)) {
        issues.push({ level: "error", code: "DUPLICATE_QUESTION_NUMBER", message: `${prefix}: trùng số câu.`, partOrder: part.order, questionNumber: question.number });
      }
      allNumbers.add(question.number);

      const labels = optionLabels(content);
      const isPairedSatellite = typeof content.pairedFrom === "number";
      if (!isPairedSatellite && ["MULTIPLE_CHOICE", "MATCHING", "TRUE_FALSE_NG"].includes(question.type) && labels.length < 2) {
        issues.push({ level: "error", code: "OPTIONS_REQUIRED", message: `${prefix}: dạng ${variant} cần ít nhất 2 lựa chọn.`, partOrder: part.order, questionNumber: question.number });
      }
      if (new Set(labels.map((label) => label.toUpperCase())).size !== labels.length) {
        issues.push({ level: "error", code: "DUPLICATE_OPTION_LABEL", message: `${prefix}: nhãn lựa chọn bị trùng.`, partOrder: part.order, questionNumber: question.number });
      }

      if (variant === "MULTI_SELECT") {
        const count = content.selectCount ?? 0;
        const covers = content.covers ?? [];
        if (count < 2 || covers.length !== count) {
          issues.push({ level: "error", code: "INVALID_MULTI_SELECT_COVERS", message: `${prefix}: selectCount phải bằng số câu trong covers.`, partOrder: part.order, questionNumber: question.number });
        }
      }

      if (["MAP_LABELING", "PLAN_LABELING", "DIAGRAM_LABELING"].includes(variant)) {
        const partImage = typeof part.meta?.imageUrl === "string" ? part.meta.imageUrl : "";
        if (!content.imageUrl && !question.mediaUrl && !partImage) {
          issues.push({ level: "error", code: "IMAGE_REQUIRED", message: `${prefix}: dạng ${variant} thiếu ảnh.`, partOrder: part.order, questionNumber: question.number });
        }
      }

      const wordLimit = instructionWordLimit(textFor(question, part));
      if (wordLimit && question.correctAnswer != null && !["MULTIPLE_CHOICE", "MATCHING", "TRUE_FALSE_NG"].includes(question.type)) {
        const tooLong = answerTokens(question.correctAnswer).filter((answer) => answerWordCount(answer) > wordLimit);
        if (tooLong.length > 0) {
          issues.push({ level: "warning", code: "ANSWER_EXCEEDS_WORD_LIMIT", message: `${prefix}: đáp án vượt giới hạn ${wordLimit} từ trong hướng dẫn.`, partOrder: part.order, questionNumber: question.number });
        }
      }
      if (variant === "WRITING_GENERAL_LETTER") {
        if (draft.examType !== "GENERAL") {
          issues.push({ level: "error", code: "GENERAL_LETTER_WRONG_EXAM", message: `${prefix}: thư General chỉ được dùng cho examType GENERAL.`, partOrder: part.order, questionNumber: question.number });
        }
        if ((content.minWords ?? 150) !== 150) {
          issues.push({ level: "warning", code: "GENERAL_LETTER_WORD_LIMIT", message: `${prefix}: Writing General Task 1 nên có tối thiểu 150 từ.`, partOrder: part.order, questionNumber: question.number });
        }
      }

      if (!isPairedSatellite && labels.length > 0 && question.correctAnswer != null && ["MULTIPLE_CHOICE", "MATCHING", "TRUE_FALSE_NG"].includes(question.type)) {
        const allowed = new Set(labels.map((label) => label.toUpperCase()));
        const invalid = answerTokens(question.correctAnswer).filter((answer) => !allowed.has(answer.toUpperCase()));
        if (invalid.length > 0) {
          issues.push({ level: "error", code: "ANSWER_NOT_IN_OPTIONS", message: `${prefix}: đáp án ${invalid.join(", ")} không có trong danh sách lựa chọn.`, partOrder: part.order, questionNumber: question.number });
        }
      }
    }
  }

  return issues;
}