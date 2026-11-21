import { z } from "zod";

const statusQuerySchema = z.enum(["OPEN", "CLOSED", "UNKNOWN", "ALL"]).optional();

export const fastbotsChatListQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  status: statusQuerySchema.default("ALL"),
  take: z.coerce.number().int().min(1).max(100).optional().default(50),
  skip: z.coerce.number().int().min(0).max(10_000).optional().default(0),
});

export type FastbotsChatListQuery = z.infer<typeof fastbotsChatListQuerySchema>;

/** Loose webhook body — Fastbots payload shapes vary; we normalize in the store. */
export const fastbotsWebhookBodySchema = z
  .union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown()))])
  .refine((v) => v !== null, { message: "EMPTY_BODY" });
