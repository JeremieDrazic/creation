/// <reference types="vite/client" />

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import introEnglish from '../../experiences/intro/locales/en.json';
import introFrench from '../../experiences/intro/locales/fr.json';
import { resolveInitialLanguage } from './resolve-initial-language/resolve-initial-language';

export { DEFAULT_LANGUAGE } from './resolve-initial-language/resolve-initial-language';

const LANGUAGE_PREFERENCE_STORAGE_KEY = 'creation.language-preference';
const FALLBACK_LANGUAGES = ['en', 'fr'];
const SUPPORTED_LANGUAGES = ['fr', 'en'];

function readSavedLanguage(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(LANGUAGE_PREFERENCE_STORAGE_KEY);
  } catch (error) {
    console.error('LANGUAGE_PREFERENCE_READ_FAILED', error);
    return null;
  }
}

function saveLanguagePreference(language: string): void {
  if (language !== 'fr' && language !== 'en') {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_PREFERENCE_STORAGE_KEY, language);
  } catch (error) {
    console.error('LANGUAGE_PREFERENCE_WRITE_FAILED', error);
  }
}

const browserLanguages = typeof navigator === 'undefined' ? [] : navigator.languages;
const initialLanguage = resolveInitialLanguage(readSavedLanguage(), browserLanguages);

/** Application-owned translation instance, initialized from bundled resources before mounting. */
export const i18n = createInstance();

await i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: FALLBACK_LANGUAGES,
  supportedLngs: SUPPORTED_LANGUAGES,
  ns: ['translation', 'intro'],
  defaultNS: 'translation',
  interpolation: { escapeValue: false },
  resources: {
    fr: {
      intro: introFrench,
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
      intro: introEnglish,
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

// Register after initialization: browser detection alone does not create an explicit saved choice.
i18n.on('languageChanged', saveLanguagePreference);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    i18n.off('languageChanged', saveLanguagePreference);
  });
}
