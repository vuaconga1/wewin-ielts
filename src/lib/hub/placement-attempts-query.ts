import { z } from "zod";

export const hubPlacementQuerySchema = z.object({
  q: z.string().max(100).optional(),
  branch: z.enum(["NTL", "XVNT"]).optional(),
  test: z.string().max(120).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  source: z.enum(["ielts", "cambridge"]).optional(),
});

export type HubPlacementQuery = z.infer<typeof hubPlacementQuerySchema>;
