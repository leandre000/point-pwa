import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import en from './messages/en.json';
import rw from './messages/rw.json';
import fr from './messages/fr.json';

const messagesMap = {
  en,
  rw,
  fr,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messagesMap[locale as keyof typeof messagesMap] || messagesMap.en,
  };
});
