import { getLocale } from "./get-locale";
import { getMessages } from "./get-messages";
import { createTranslator } from "./translate";
import { defaultLocale } from "./config";

/**
 * Static / ISR-safe translator — default locale only, no cookies().
 * Prefer this on catalog pages so soft nav can hit CDN/ISR.
 * Client I18nProvider still shows the user's preferred language.
 */
export function getTranslationsStatic(namespace?: string) {
  const messages = getMessages(defaultLocale);
  return {
    locale: defaultLocale,
    t: createTranslator(messages, namespace),
  };
}

/** Server Components / RSC: `const t = await getTranslations('nav')` */
export async function getTranslations(namespace?: string) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return {
    locale,
    t: createTranslator(messages, namespace),
  };
}

export { getLocale } from "./get-locale";
export { getMessages } from "./get-messages";
