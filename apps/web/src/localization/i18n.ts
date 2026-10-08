import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const DEFAULT_LANGUAGE = 'fr';
const FALLBACK_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = ['fr', 'en'];

/** Application-owned translation instance, initialized from bundled resources before mounting. */
export const i18n = createInstance();

await i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  resources: {
    fr: {
      translation: {
        home: 'Accueil',
        waiting: 'L’expérience prend forme.',
        fireflies: 'Fireflies',
        firefliesWaiting: 'Un mot deviendra lumière.',
        notFound: 'Cette page n’existe pas.',
        language: 'Switch to English',
      },
    },
    en: {
      translation: {
        home: 'Home',
        waiting: 'The experience is taking shape.',
        fireflies: 'Fireflies',
        firefliesWaiting: 'A word will become light.',
        notFound: 'This page does not exist.',
        language: 'Passer en français',
      },
    },
  },
});
