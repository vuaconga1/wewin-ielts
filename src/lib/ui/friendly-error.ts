/**
 * Map technical / English API errors to short user messages.
 * Pass `t` from i18n (`errors.*` keys) when available.
 */

import type { Translator } from "@/i18n/translate";

type ErrorT = Translator;

const VI_FALLBACKS: Record<string, string> = {
  fallback: "Đã xảy ra lỗi. Vui lòng thử lại.",
  network: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
  adminRequired: "Bạn cần đăng nhập admin để tiếp tục.",
  invalidCredentials: "Email hoặc mật khẩu không đúng.",
  database: "Cơ sở dữ liệu chưa sẵn sàng. Thử lại sau hoặc báo admin.",
  timeout: "Yêu cầu quá lâu. Thử lại sau ít phút.",
};

function msg(t: ErrorT | undefined, key: keyof typeof VI_FALLBACKS): string {
  if (t) return t(key, VI_FALLBACKS[key]);
  return VI_FALLBACKS[key];
}

export function friendlyError(
  raw: unknown,
  fallback?: string,
  t?: ErrorT,
): { message: string; detail?: string } {
  const resolvedFallback = fallback ?? msg(t, "fallback");

  const detail =
    typeof raw === "string"
      ? raw
      : raw instanceof Error
        ? raw.message
        : raw != null
          ? String(raw)
          : undefined;

  if (!detail || !detail.trim()) {
    return { message: resolvedFallback };
  }

  const lower = detail.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    detail === "Lỗi mạng"
  ) {
    return {
      message: msg(t, "network"),
      detail,
    };
  }

  if (
    lower.includes("unauthorized") ||
    lower.includes("cần đăng nhập") ||
    lower.includes("admin_required")
  ) {
    return {
      message: msg(t, "adminRequired"),
      detail,
    };
  }

  if (
    lower.includes("invalid_credentials") ||
    lower.includes("email hoặc mật khẩu") ||
    lower.includes("sai mật khẩu") ||
    lower.includes("incorrect email")
  ) {
    return {
      message: msg(t, "invalidCredentials"),
      detail,
    };
  }

  if (lower.includes("mysql") || lower.includes("database") || lower.includes("prisma")) {
    return {
      message: msg(t, "database"),
      detail,
    };
  }

  if (lower.includes("timeout") || lower.includes("etimedout")) {
    return {
      message: msg(t, "timeout"),
      detail,
    };
  }

  const looksTechnical =
    /\b(Error|Exception|ECONNREFUSED|ENOENT|stack|at\s+\w+\()/i.test(detail) ||
    detail.length > 160;

  if (looksTechnical) {
    return { message: resolvedFallback, detail };
  }

  return { message: detail };
}
