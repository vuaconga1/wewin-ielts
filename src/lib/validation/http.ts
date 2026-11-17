import { NextResponse } from "next/server";
import type { z } from "zod";
import { firstIssue, validationSuggestion } from "./primitives";

/**
 * Map Zod failure → `{ code, error, detail?, suggestion?, field? }` + 400.
 * `error` stays a human Vietnamese default; clients should prefer `code`.
 */
const CODE_MESSAGES_VI: Record<string, string> = {
  INVALID_INPUT: "Thông tin chưa hợp lệ. Kiểm tra lại các trường.",
  EMAIL_REQUIRED: "Vui lòng nhập email.",
  INVALID_EMAIL: "Email không đúng định dạng.",
  EMAIL_TOO_LONG: "Email quá dài.",
  EMAIL_DOMAIN_TYPO: "Email có vẻ gõ sai tên miền. Kiểm tra lại (vd. gmail.com).",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu.",
  WEAK_PASSWORD: "Mật khẩu cần ít nhất 8 ký tự.",
  PASSWORD_TOO_LONG: "Mật khẩu quá dài.",
  PASSWORD_NEED_LETTER: "Mật khẩu cần có ít nhất một chữ cái.",
  PASSWORD_NEED_NUMBER: "Mật khẩu cần có ít nhất một chữ số.",
  USERNAME_REQUIRED: "Vui lòng nhập username.",
  INVALID_USERNAME: "Username cần 2–32 ký tự.",
  USERNAME_TOO_LONG: "Username quá dài.",
  INVALID_USERNAME_FORMAT:
    "Username chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.",
  IDENTIFIER_REQUIRED: "Nhập email hoặc username.",
  IDENTIFIER_TOO_LONG: "Email/username quá dài.",
  INVALID_ROLE: "Vai trò không hợp lệ.",
  NO_CHANGES: "Không có thay đổi nào.",
  NO_USERS_SELECTED: "Chưa chọn tài khoản hoặc thời hạn.",
};

export function invalidInputResponse(error: z.ZodError) {
  const first = firstIssue(error);
  const suggestion = validationSuggestion(error);
  const code = first.code in CODE_MESSAGES_VI ? first.code : "INVALID_INPUT";
  const message =
    CODE_MESSAGES_VI[code] ??
    (first.message && !/^[A-Z][A-Z0-9_]+$/.test(first.message)
      ? first.message
      : CODE_MESSAGES_VI.INVALID_INPUT);

  let detail = message;
  if (code === "EMAIL_DOMAIN_TYPO" && suggestion) {
    detail = `Có lẽ bạn muốn dùng @${suggestion}?`;
  }

  return NextResponse.json(
    {
      code,
      error: detail,
      ...(first.path ? { field: first.path } : {}),
      ...(suggestion ? { suggestion } : {}),
    },
    { status: 400 },
  );
}

export function parseJsonBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: invalidInputResponse(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}
