import { z } from "zod";

export const SkillSchema = z.enum([
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
]);

export const ExamTypeSchema = z.enum(["ACADEMIC", "GENERAL"]);

export const QuestionTypeSchema = z.enum([
  "GAP_FILL",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE_NG",
  "MATCHING",
  "SHORT_ANSWER",
  "TABLE_COMPLETION",
  "MAP_LABELING",
  "ESSAY",
  "SPEAKING_PROMPT",
]);

const StringTrimmed = z.string().trim().min(1);

export const QuestionDraftSchema = z.object({
  number: z.number().int().positive(),
  order: z.number().int().nonnegative(),
  type: QuestionTypeSchema,
  content: z.record(z.string(), z.unknown()),
  /** Writing Task 1 diagram / chart URL under /uploads/… */
  mediaUrl: z.string().optional(),
  correctAnswer: z.unknown().optional(),
  acceptableAnswers: z.array(z.string()).optional(),
  explanation: z.string().optional(),
});

export const PartDraftSchema = z.object({
  title: StringTrimmed,
  order: z.number().int().nonnegative(),
  content: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  questions: z.array(QuestionDraftSchema).min(0),
});

export const ParsedTestDraftSchema = z.object({
  title: StringTrimmed,
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  skill: SkillSchema,
  examType: ExamTypeSchema.default("ACADEMIC"),
  timeLimitMinutes: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  sourceFolder: z.string().optional(),
  /** Google Drive folder ID when imported via Drive sync */
  driveFolderId: z.string().optional(),
  /** Map of downloaded filename → Drive file ID */
  driveFileIds: z.record(z.string(), z.string()).optional(),
  description: z.string().optional(),
  parts: z.array(PartDraftSchema).min(1, "At least one part is required"),
  audioFiles: z.array(z.string()).optional(),
});

export type QuestionDraft = z.infer<typeof QuestionDraftSchema>;
export type PartDraft = z.infer<typeof PartDraftSchema>;
export type ParsedTestDraft = z.infer<typeof ParsedTestDraftSchema>;

export type ImportIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  partOrder?: number;
  questionNumber?: number;
};

export type ImportParseResult = {
  draft: ParsedTestDraft | null;
  issues: ImportIssue[];
};
