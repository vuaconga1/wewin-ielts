import type { Locale } from "./config";
import type { Messages } from "./translate";
import vi from "./messages/vi.json";
import en from "./messages/en.json";

const catalogs: Record<Locale, Messages> = {
  vi: vi as Messages,
  en: en as Messages,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.vi;
}
