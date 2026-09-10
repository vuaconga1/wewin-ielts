"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeToHtmlLang,
  type Locale,
} from "./config";
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

type Props = {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
};

export function I18nProvider({ locale, messages, children }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = useMemo(() => createTranslator(messages), [messages]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      writeLocaleCookie(next);
      startTransition(() => {
        router.refresh();
      });
    },
    [locale, router],
  );

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
