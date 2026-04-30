import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type AppLanguage = 'en' | 'ar';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'ar'];

export const RTL_LANGUAGES: AppLanguage[] = ['ar'];

export const isRtl = (lng: string): boolean =>
  RTL_LANGUAGES.includes(lng as AppLanguage);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'finlens.lang',
    },
  });

export default i18n;
