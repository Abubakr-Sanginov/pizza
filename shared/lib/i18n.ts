import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from '../locales/ru.json';
import tg from '../locales/tg.json';
import en from '../locales/en.json';

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
