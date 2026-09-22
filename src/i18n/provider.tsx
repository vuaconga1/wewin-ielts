"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeToHtmlLang,
  type Locale,
} from "./config";
import { getMessages } from "./get-messages";
import {
  createTranslator,
  type Messages,
  type Translator,
} from "./translate";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: Translator;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;
  try {
    localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = localeToHtmlLang(locale);
}

function readStoredLocale(): Locale | null {
  try {
    const fromLs = localStorage.getItem(LOCALE_COOKIE);
    if (isLocale(fromLs)) return fromLs;
  } catch {
    /* ignore */
  }
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return null;
  const raw = match.slice(LOCALE_COOKIE.length + 1);
  return isLocale(raw) ? raw : null;
}

type Props = {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
};

export function I18nProvider({
  locale: initialLocale,
  messages: initialMessages,
  children,
}: Props) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);
  const [isPending, startTransition] = useTransition();

  // Bootstrap preferred locale from cookie/localStorage without forcing RSC dynamic.
  useEffect(() => {
    const stored = readStoredLocale();
    if (!stored || stored === locale) return;
    startTransition(() => {
      setLocaleState(stored);
      setMessages(getMessages(stored));
      document.documentElement.lang = localeToHtmlLang(stored);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  const t = useMemo(() => createTranslator(messages), [messages]);

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    writeLocaleCookie(next);
    startTransition(() => {
      setLocaleState(next);
      setMessages(getMessages(next));
    });
  }, []);

  const value = useMemo(
    () => ({ locale, messages, t, setLocale, isPending }),
    [locale, messages, t, setLocale, isPending],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** Client hook: `const t = useTranslations('nav')` then `t('home')`. */
export function useTranslations(namespace?: string) {
  const { messages, locale, setLocale, isPending } = useI18n();
  const t = useMemo(
    () => createTranslator(messages, namespace),
    [messages, namespace],
  );
  return { t, locale, setLocale, isPending };
}

export { defaultLocale, isLocale, type Locale };
