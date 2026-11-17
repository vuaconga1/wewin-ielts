/**
 * Shared production field validators (client + server safe).
 * Prefer these over ad-hoc `.includes("@")` / minLength HTML-only checks.
 */

import { z } from "zod";

/** bcrypt / DoS guard — never accept unbounded password strings. */
export const PASSWORD_MAX = 128;
export const PASSWORD_MIN = 8;
export const USERNAME_MIN = 2;
export const USERNAME_MAX = 32;
export const FULL_NAME_MAX = 120;
export const CLASS_CODE_MAX = 200;
export const EMAIL_MAX = 254;

/**
 * Known provider typos (local-part@domain). Zod `.email()` accepts these;
 * production apps should reject and suggest the correct domain.
 */
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.cpm": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "icloud.con": "icloud.com",
  "icoud.com": "icloud.com",
};

/** Local@domain with TLD ≥ 2 chars; rejects consecutive dots / trailing dots. */
const EMAIL_FORMAT =
  /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

const USERNAME_FORMAT = /^[a-zA-Z0-9._-]+$/;

export type FieldIssue = { code: string; message: string; path: string };

export function firstIssue(
  error: z.ZodError,
): FieldIssue {
  const issue = error.issues[0] as (z.ZodIssue & { params?: Record<string, unknown> }) | undefined;
  const path = issue?.path?.map(String).join(".") || "";
  const code =
    typeof issue?.params?.code === "string"
      ? issue.params.code
      : typeof issue?.message === "string" && /^[A-Z][A-Z0-9_]+$/.test(issue.message)
        ? issue.message
        : "INVALID_INPUT";
  return {
    code,
    message: issue?.message ?? "INVALID_INPUT",
    path,
  };
}

function issue(code: string, message?: string) {
  return { message: message ?? code, params: { code } };
}

export function emailDomainTypo(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  const suggestion = EMAIL_DOMAIN_TYPOS[domain];
  return suggestion ?? null;
}

/** Required email: trim → lower → format → typo block. */
export const requiredEmailSchema = z
  .string({ error: () => issue("EMAIL_REQUIRED") })
  .trim()
  .min(1, issue("EMAIL_REQUIRED"))
  .max(EMAIL_MAX, issue("EMAIL_TOO_LONG"))
  .transform((v) => v.toLowerCase())
  .refine((v) => EMAIL_FORMAT.test(v), issue("INVALID_EMAIL"))
  .superRefine((v, ctx) => {
    const typo = emailDomainTypo(v);
    if (typo) {
      ctx.addIssue({
        code: "custom",
        message: "EMAIL_DOMAIN_TYPO",
        params: { code: "EMAIL_DOMAIN_TYPO", suggestion: typo },
      });
    }
  });

/**
 * Optional email for admin-created username-only accounts.
 * Missing / empty / whitespace → null; otherwise same rules as required.
 * (Zod 4: use `.nullable().optional()` so omitted object keys are accepted.)
 */
export const optionalEmailSchema = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    if (v == null) return null;
    const trimmed = v.trim().toLowerCase();
    return trimmed ? trimmed : null;
  })
  .superRefine((v, ctx) => {
    if (v == null) return;
    if (v.length > EMAIL_MAX) {
      ctx.addIssue({
        code: "custom",
        message: "EMAIL_TOO_LONG",
        params: { code: "EMAIL_TOO_LONG" },
      });
      return;
    }
    if (!EMAIL_FORMAT.test(v)) {
      ctx.addIssue({
        code: "custom",
        message: "INVALID_EMAIL",
        params: { code: "INVALID_EMAIL" },
      });
      return;
    }
    const typo = emailDomainTypo(v);
    if (typo) {
      ctx.addIssue({
        code: "custom",
        message: "EMAIL_DOMAIN_TYPO",
        params: { code: "EMAIL_DOMAIN_TYPO", suggestion: typo },
      });
    }
  });

export const passwordSchema = z
  .string({ error: () => issue("PASSWORD_REQUIRED") })
  .min(PASSWORD_MIN, issue("WEAK_PASSWORD"))
  .max(PASSWORD_MAX, issue("PASSWORD_TOO_LONG"))
  .refine((v) => /[A-Za-zÀ-ỹ]/.test(v), issue("PASSWORD_NEED_LETTER"))
  .refine((v) => /[0-9]/.test(v), issue("PASSWORD_NEED_NUMBER"));

/** Login only — do not leak password policy to attackers. */
export const loginPasswordSchema = z
  .string({ error: () => issue("PASSWORD_REQUIRED") })
  .min(1, issue("PASSWORD_REQUIRED"))
  .max(PASSWORD_MAX, issue("PASSWORD_TOO_LONG"));

export const usernameSchema = z
  .string({ error: () => issue("USERNAME_REQUIRED") })
  .trim()
  .min(USERNAME_MIN, issue("INVALID_USERNAME"))
  .max(USERNAME_MAX, issue("USERNAME_TOO_LONG"))
  .regex(USERNAME_FORMAT, issue("INVALID_USERNAME_FORMAT"));

/** Optional display name on public register (maps to username when set). */
export const optionalUsernameSchema = z
  .string()
  .optional()
  .transform((v) => {
    if (v == null) return undefined;
    const trimmed = v.trim();
    return trimmed ? trimmed : undefined;
  })
  .superRefine((v, ctx) => {
    if (v == null) return;
    const parsed = usernameSchema.safeParse(v);
    if (!parsed.success) {
      const first = firstIssue(parsed.error);
      ctx.addIssue({
        code: "custom",
        message: first.code,
        params: { code: first.code },
      });
    }
  });

export const optionalFullNameSchema = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    if (v == null) return null;
    const trimmed = v.trim();
    return trimmed ? trimmed.slice(0, FULL_NAME_MAX) : null;
  });

export const optionalClassCodeSchema = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    if (v == null) return null;
    const trimmed = v.trim();
    return trimmed ? trimmed.slice(0, CLASS_CODE_MAX) : null;
  });

export const roleSchema = z.enum(["ADMIN", "TEACHER", "STUDENT", "VISITOR"], {
  error: () => issue("INVALID_ROLE"),
});

/** Login identifier: email OR username (not empty). */
export const loginIdentifierSchema = z
  .string({ error: () => issue("IDENTIFIER_REQUIRED") })
  .trim()
  .min(1, issue("IDENTIFIER_REQUIRED"))
  .max(EMAIL_MAX, issue("IDENTIFIER_TOO_LONG"))
  .superRefine((v, ctx) => {
    if (v.includes("@")) {
      const email = requiredEmailSchema.safeParse(v);
      if (!email.success) {
        const first = firstIssue(email.error);
        ctx.addIssue({
          code: "custom",
          message: first.code,
          params: { code: first.code, suggestion: (email.error.issues[0] as any)?.params?.suggestion },
        });
      }
      return;
    }
    if (v.length < USERNAME_MIN || v.length > USERNAME_MAX || !USERNAME_FORMAT.test(v)) {
      ctx.addIssue({
        code: "custom",
        message: "INVALID_USERNAME",
        params: { code: "INVALID_USERNAME" },
      });
    }
  });

export function validationSuggestion(error: z.ZodError): string | undefined {
  for (const issue of error.issues) {
    const suggestion = (issue as any).params?.suggestion;
    if (typeof suggestion === "string" && suggestion) return suggestion;
  }
  return undefined;
}
