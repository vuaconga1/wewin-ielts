/**
 * Allowlist for cross-site post-login redirects (Admin Panel / sibling apps).
 * Pure helpers — safe to unit-test from tsx without Next request context.
 */

function allowedOrigins(): string[] {
  const raw = process.env.WEWIN_HUB_ALLOWED_RETURN_ORIGINS?.trim();
  if (!raw) {
    return ["https://wewin.edu.vn"];
  }
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isLocalDevOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

/** Absolute URL whose origin is allowlisted (blocks open redirects). */
export function isAllowedReturnTo(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    return false;
  }
  if (url.username || url.password) return false;

  const origin = url.origin;
  if (allowedOrigins().some((allowed) => allowed === origin)) return true;
  return isLocalDevOrigin(origin);
}
