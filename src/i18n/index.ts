/**
 * Cookie-only i18n (no `/en` URL prefix).
 *
 * - Default locale: `vi`
 * - Cookie: `wewin_locale` (+ localStorage mirror on client)
 * - Messages: `src/i18n/messages/{vi,en}.json`
 * - Client: `useTranslations('namespace')` from `@/i18n/provider`
 * - Server: `getTranslations('namespace')` from `@/i18n/server`
 * - Missing keys: never return the raw path — use `t(key, defaultMessage)` or humanized last segment
 *
 * Auth middleware is untouched — locale does not rewrite routes.
 */
export { locales, defaultLocale, LOCALE_COOKIE, type Locale } from "./config";
