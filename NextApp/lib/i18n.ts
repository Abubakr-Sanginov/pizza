import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ru from '../locales/ru.json';
import tg from '../locales/tg.json';
import en from '../locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      tg: { translation: tg },
      en: { translation: en },
    },
    lng: Localization.getLocales()[0].languageCode ?? 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
