export const locales = ["vi", "en"] as const;

export type Locale = (typeof locales)[number];

/** Default UI language (Vietnamese). */
export const defaultLocale: Locale = "vi";

/** Cookie name — no URL locale prefix; routes stay `/tests`, `/learn`, etc. */
export const LOCALE_COOKIE = "wewin_locale";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === "vi" ? "vi" : "en";
}

export function localeToIntl(locale: Locale): string {
  return locale === "vi" ? "vi-VN" : "en-US";
}
