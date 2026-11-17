import { z } from "zod";
import {
  optionalClassCodeSchema,
  optionalEmailSchema,
  optionalFullNameSchema,
  passwordSchema,
  roleSchema,
  usernameSchema,
} from "./primitives";

/** Admin date picker value: YYYY-MM-DD (local calendar day). */
const accessExpiresAtSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "INVALID_EXPIRY" });

const accessPatchSchema = z.object({
  months: z.number().int().min(0).max(120).optional(),
  days: z.number().int().min(0).max(3660).optional(),
  expiresAt: accessExpiresAtSchema.optional(),
  unlimited: z.boolean().optional(),
});

export const createAdminUserBodySchema = z.object({
  email: optionalEmailSchema,
  username: usernameSchema,
  password: passwordSchema,
  role: roleSchema.default("STUDENT"),
  fullName: optionalFullNameSchema,
  classCode: optionalClassCodeSchema,
});

export const updateAdminUserBodySchema = z
  .object({
    username: usernameSchema.optional(),
    role: roleSchema.optional(),
    password: z
      .union([passwordSchema, z.literal(""), z.undefined()])
      .optional()
      .transform((v) => (v ? v : undefined)),
    fullName: optionalFullNameSchema.optional(),
    classCode: optionalClassCodeSchema.optional(),
    access: accessPatchSchema.optional(),
  })
  .refine(
    (data) =>
      data.access != null ||
      data.username != null ||
      data.role != null ||
      data.password != null ||
      data.fullName !== undefined ||
      data.classCode !== undefined,
    { message: "NO_CHANGES" },
  );

export const bulkAccessBodySchema = z.object({
  userIds: z
    .array(z.string().trim().min(1).max(64))
    .min(1, { message: "NO_USERS_SELECTED" })
    .max(500),
  access: accessPatchSchema,
});

export type CreateAdminUserBody = z.infer<typeof createAdminUserBodySchema>;
export type UpdateAdminUserBody = z.infer<typeof updateAdminUserBodySchema>;
