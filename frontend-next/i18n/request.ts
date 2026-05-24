import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import ruMessages from '../messages/ru.json';

type Locale = (typeof routing.locales)[number];
type Messages = Record<string, unknown>;

// ru.json — to'liq reference (defaultLocale). Boshqa tillarda yetishmagan
// kalitlar avtomatik ru matniga fallback bo'ladi, shuning uchun next-intl
// hech qachon MISSING_MESSAGE bilan crash qilmaydi.
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    if (
      b && o &&
      typeof b === 'object' && typeof o === 'object' &&
      !Array.isArray(b) && !Array.isArray(o)
    ) {
      out[key] = deepMerge(b as Messages, o as Messages);
    } else {
      out[key] = o;
    }
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = routing.locales.includes(requested as Locale)
    ? (requested as Locale)
    : routing.defaultLocale;

  const messages =
    locale === 'ru'
      ? (ruMessages as Messages)
      : deepMerge(
          ruMessages as Messages,
          (await import(`../messages/${locale}.json`)).default as Messages,
        );

  return { locale, messages };
});
