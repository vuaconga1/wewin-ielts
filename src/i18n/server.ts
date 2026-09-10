import { getLocale } from "./get-locale";
import { getMessages } from "./get-messages";
import { createTranslator } from "./translate";

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
