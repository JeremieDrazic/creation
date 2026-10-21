export const DEFAULT_LANGUAGE = 'en';

/** Maps browser language variants such as fr-FR or en-US to a supported language. */
function readSupportedLanguage(language: string): 'fr' | 'en' | null {
  const primaryLanguage = language.toLowerCase().split('-')[0];

  if (primaryLanguage === 'fr' || primaryLanguage === 'en') {
    return primaryLanguage;
  }

  return null;
}

/**
 * Resolves the saved choice first, then browser preferences in their original order, then English.
 * The caller reads localStorage/navigator; this calculation has no browser access or side effects.
 */
export function resolveInitialLanguage(
  savedLanguage: string | null,
  browserLanguages: readonly string[]
): 'fr' | 'en' {
  if (savedLanguage !== null) {
    const supportedSavedLanguage = readSupportedLanguage(savedLanguage);

    if (supportedSavedLanguage !== null) {
      return supportedSavedLanguage;
    }
  }

  for (const browserLanguage of browserLanguages) {
    const supportedBrowserLanguage = readSupportedLanguage(browserLanguage);

    if (supportedBrowserLanguage !== null) {
      return supportedBrowserLanguage;
    }
  }

  return DEFAULT_LANGUAGE;
}
