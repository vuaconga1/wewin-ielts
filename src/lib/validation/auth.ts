import { z } from "zod";
import {
  loginIdentifierSchema,
  loginPasswordSchema,
  optionalUsernameSchema,
  passwordSchema,
  requiredEmailSchema,
} from "./primitives";

export const loginBodySchema = z.object({
  action: z.literal("login").optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  password: loginPasswordSchema,
}).superRefine((data, ctx) => {
  const raw = (data.email ?? data.username ?? "").trim();
  const id = loginIdentifierSchema.safeParse(raw);
  if (!id.success) {
    const issue = id.error.issues[0];
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: issue?.message ?? "IDENTIFIER_REQUIRED",
      params: (issue as any)?.params,
    });
  }
});

export const registerBodySchema = z.object({
  email: requiredEmailSchema,
  password: passwordSchema,
  username: optionalUsernameSchema,
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
