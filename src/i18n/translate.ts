export type Messages = Record<string, unknown>;

export type TranslateParams = Record<string, string | number>;

/** Client/server translator: `t(key)`, `t(key, params)`, or `t(key, defaultMessage)`. */
export type Translator = (
  key: string,
  paramsOrDefault?: TranslateParams | string,
  defaultMessage?: string,
) => string;

function getByPath(messages: Messages, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/** Replace `{name}` placeholders in a message string. */
export function interpolate(
  template: string,
  params?: TranslateParams,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value == null ? `{${key}}` : String(value);
  });
}

/** Last segment of a dotted key → readable words (never show the raw key path). */
export function humanizeKey(key: string): string {
  const last = key.includes(".") ? key.slice(key.lastIndexOf(".") + 1) : key;
  const spaced = last
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!spaced) return "…";
  // Title-case so SHORT_ANSWER / historyTitle → "Short answer" / "History title"
  // (never leave SCREAMING_SNAKE as the visible fallback).
  return spaced
    .split(/\s+/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
      return lower;
    })
    .join(" ");
}

function resolveArgs(
  paramsOrDefault?: TranslateParams | string,
  defaultMessage?: string,
): { params?: TranslateParams; fallback?: string } {
  if (typeof paramsOrDefault === "string") {
    return { fallback: paramsOrDefault };
  }
  return { params: paramsOrDefault, fallback: defaultMessage };
}

export function translate(
  messages: Messages,
  key: string,
  params?: TranslateParams,
  defaultMessage?: string,
): string {
  const value = getByPath(messages, key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing key: ${key}`);
  }
  if (defaultMessage != null && defaultMessage !== "") {
    return interpolate(defaultMessage, params);
  }
  // Never leak raw key paths like `tests.historyTitle` to the UI.
  return humanizeKey(key);
}

export function createTranslator(messages: Messages, namespace?: string): Translator {
  return function t(
    key: string,
    paramsOrDefault?: TranslateParams | string,
    defaultMessage?: string,
  ): string {
    const { params, fallback } = resolveArgs(paramsOrDefault, defaultMessage);
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return translate(messages, fullKey, params, fallback);
  };
}
