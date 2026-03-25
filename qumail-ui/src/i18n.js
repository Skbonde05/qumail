import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './translations/en.json';
import translationES from './translations/es.json';
import translationFR from './translations/fr.json';
import translationDE from './translations/de.json';
import translationHI from './translations/hi.json';
import translationAR from './translations/ar.json';
import translationMR from './translations/mr.json';

const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  },
  fr: {
    translation: translationFR
  },
  de: {
    translation: translationDE
  },
  hi: {
    translation: translationHI
  },
  ar: {
    translation: translationAR
  },
  mr: {
    translation: translationMR
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
