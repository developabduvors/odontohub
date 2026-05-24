import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'ru',
  localePrefix: 'always',
});
