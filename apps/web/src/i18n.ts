import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enLocales from './locales/en.json';
import viLocales from './locales/vi.json';

const resources = {
  en: {
    translation: enLocales,
  },
  vi: {
    translation: viLocales,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'vi', // Default to Vietnamese
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
