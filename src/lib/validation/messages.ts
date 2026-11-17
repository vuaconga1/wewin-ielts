/**
 * Client-side map from validation `code` → i18n-friendly default (vi).
 * Prefer `useTranslations('validation').t(code, fallback)`.
 */

export const VALIDATION_DEFAULTS_VI: Record<string, string> = {
  INVALID_INPUT: "Thông tin chưa hợp lệ. Kiểm tra lại các trường.",
  EMAIL_REQUIRED: "Vui lòng nhập email.",
  INVALID_EMAIL: "Email không đúng định dạng.",
  EMAIL_TOO_LONG: "Email quá dài.",
  EMAIL_DOMAIN_TYPO: "Email có vẻ gõ sai tên miền. Kiểm tra lại.",
  PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu.",
  WEAK_PASSWORD: "Mật khẩu cần ít nhất 8 ký tự.",
  PASSWORD_TOO_LONG: "Mật khẩu quá dài.",
  PASSWORD_NEED_LETTER: "Mật khẩu cần có ít nhất một chữ cái.",
  PASSWORD_NEED_NUMBER: "Mật khẩu cần có ít nhất một chữ số.",
  USERNAME_REQUIRED: "Vui lòng nhập username.",
  INVALID_USERNAME: "Username cần 2–32 ký tự.",
  INVALID_USERNAME_FORMAT:
    "Username chỉ gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.",
  USERNAME_TOO_LONG: "Username quá dài.",
  IDENTIFIER_REQUIRED: "Nhập email hoặc username.",
  IDENTIFIER_TOO_LONG: "Email/username quá dài.",
  INVALID_ROLE: "Vai trò không hợp lệ.",
  NO_CHANGES: "Không có thay đổi nào.",
  NO_USERS_SELECTED: "Chưa chọn tài khoản hoặc thời hạn.",
};

export const VALIDATION_DEFAULTS_EN: Record<string, string> = {
  INVALID_INPUT: "Some fields are invalid. Please check them.",
  EMAIL_REQUIRED: "Please enter your email.",
  INVALID_EMAIL: "Enter a valid email address.",
  EMAIL_TOO_LONG: "Email is too long.",
  EMAIL_DOMAIN_TYPO: "That email domain looks mistyped. Please check it.",
  PASSWORD_REQUIRED: "Please enter your password.",
  WEAK_PASSWORD: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  PASSWORD_NEED_LETTER: "Password must include at least one letter.",
  PASSWORD_NEED_NUMBER: "Password must include at least one number.",
  USERNAME_REQUIRED: "Please enter a username.",
  INVALID_USERNAME: "Username must be 2–32 characters.",
  INVALID_USERNAME_FORMAT:
    "Username may only contain letters, numbers, dots, underscores, or hyphens.",
  USERNAME_TOO_LONG: "Username is too long.",
  IDENTIFIER_REQUIRED: "Enter your email or username.",
  IDENTIFIER_TOO_LONG: "Email/username is too long.",
  INVALID_ROLE: "Invalid role.",
  NO_CHANGES: "No changes to save.",
  NO_USERS_SELECTED: "Select accounts and an access period.",
};

export function formatEmailTypoMessage(
  suggestion: string | undefined,
  locale: "vi" | "en",
): string {
  if (!suggestion) {
    return locale === "en"
      ? VALIDATION_DEFAULTS_EN.EMAIL_DOMAIN_TYPO
      : VALIDATION_DEFAULTS_VI.EMAIL_DOMAIN_TYPO;
  }
  return locale === "en"
    ? `Did you mean @${suggestion}?`
    : `Có lẽ bạn muốn dùng @${suggestion}?`;
}
