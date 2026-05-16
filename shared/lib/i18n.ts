import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from '../locales/ru.json';
import tg from '../locales/tg.json';
import en from '../locales/en.json';

/**
 * IMPORTANT: We deliberately do NOT use i18next-browser-languagedetector here.
 *
 * The detector picks up the saved language from localStorage on the client but
 * has nothing on the server → server always renders the fallback ('ru'). On the
 * client first render it immediately switches to the saved language, which makes
 * React see a different DOM than the server emitted → hydration error #418/#423/#425.
 *
 * Instead, we always init with `lng: 'ru'` (matches server fallback) and read the
 * user's saved language on the client AFTER mount (see ProvidersI18nBootstrap in
 * providers.tsx). The first render is always Russian, then a single re-render
 * switches to the saved language. No mismatch.
 */
i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    tg: { translation: tg },
    en: { translation: en },
  },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
});

export const SUPPORTED_LANGUAGES = ['ru', 'tg', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANG_STORAGE_KEY = 'i18nextLng';

export default i18n;
