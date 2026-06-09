import { cookies } from 'next/headers';

import ru from '../locales/ru.json';
import tg from '../locales/tg.json';
import en from '../locales/en.json';

// NOTE: deliberately NOT importing from ./i18n — that module initializes
// react-i18next (createContext), which breaks when pulled into a server bundle.
const LANG_STORAGE_KEY = 'i18nextLng';
const SUPPORTED_LANGUAGES = ['ru', 'tg', 'en'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const dictionaries: Record<SupportedLanguage, any> = { ru, tg, en };

function lookup(dict: any, key: string): string | undefined {
  return key.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dict);
}

/**
 * Server-side translation helper for the admin dashboard (server components
 * can't use the react-i18next hook). Reads the saved language from the
 * `i18nextLng` cookie that LanguageToggle writes, falling back to ru.
 */
export function getAdminT() {
  const cookieLang = cookies().get(LANG_STORAGE_KEY)?.value as SupportedLanguage | undefined;
  const lang: SupportedLanguage =
    cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang) ? cookieLang : 'ru';

  return (key: string): string => {
    const value = lookup(dictionaries[lang], key);
    if (typeof value === 'string') return value;
    const fallback = lookup(dictionaries.ru, key);
    return typeof fallback === 'string' ? fallback : key;
  };
}
