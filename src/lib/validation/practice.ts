import { z } from "zod";

export const practiceStartBodySchema = z.object({
  slug: z.string().trim().min(1).max(200),
  mode: z.enum(["PRACTICE", "FULL"]).optional(),
  sectionOrders: z.array(z.number().int().min(0).max(50)).max(50).optional(),
  questionNumbers: z.array(z.number().int().positive().max(200)).max(200).optional(),
  speakingPartKinds: z.array(z.number().int().min(1).max(3)).max(3).optional(),
  timeLimitMinutes: z
    .union([z.number().int().min(1).max(600), z.null()])
    .optional(),
});

export const practiceSaveBodySchema = z.object({
  answers: z.record(z.string(), z.string().max(2000)).optional(),
  highlights: z.array(z.unknown()).max(500).optional(),
});

export const learnProgressBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("video"),
    lessonId: z.string().trim().min(1).max(120),
    maxWatchedSec: z.number().min(0).max(86_400),
    videoCompleted: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("exercises"),
    lessonId: z.string().trim().min(1).max(120),
    answers: z.record(z.string(), z.string().max(2000)).refine(
      (obj) => Object.keys(obj).length <= 200,
      { message: "TOO_MANY_ANSWERS" },
    ),
  }),
  z.object({
    action: z.literal("complete"),
    lessonId: z.string().trim().min(1).max(120),
  }),
]);
