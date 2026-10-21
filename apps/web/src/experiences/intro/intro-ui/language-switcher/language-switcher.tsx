import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

import { underlineStyles } from '../../../../utils/animation/underline-styles/underline-styles';

const styles = stylex.create({
  group: {
    borderWidth: 0,
    padding: 0,
    margin: 0,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
  },
  button: {
    color: { default: '#b9c5d5', ':hover': '#f2eee4' },
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: '0.5rem',
    cursor: 'pointer',
    font: 'inherit',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineOffset: '6px',
  },
  active: { color: '#f2eee4' },
  separator: { color: '#b9c5d5' },
});

/** Uses the provided i18n instance; application localization owns persistence. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('intro', { keyPrefix: 'languageSwitcher' });
  const activeLanguage = i18n.resolvedLanguage;

  async function changeLanguage(language: 'fr' | 'en'): Promise<void> {
    if (activeLanguage === language) {
      return;
    }

    try {
      await i18n.changeLanguage(language);
    } catch (error) {
      console.error('LANGUAGE_CHANGE_FAILED', error);
    }
  }

  return (
    <fieldset aria-label={t('label')} {...stylex.props(styles.group)}>
      <button
        type="button"
        lang="fr"
        aria-label={t('frenchLabel')}
        aria-pressed={activeLanguage === 'fr'}
        onClick={() => void changeLanguage('fr')}
        {...stylex.props(
          styles.button,
          underlineStyles.interactive,
          activeLanguage === 'fr' && styles.active,
          activeLanguage === 'fr' && underlineStyles.selected
        )}
      >
        FR
      </button>
      <span aria-hidden="true" {...stylex.props(styles.separator)}>
        /
      </span>
      <button
        type="button"
        lang="en"
        aria-label={t('englishLabel')}
        aria-pressed={activeLanguage === 'en'}
        onClick={() => void changeLanguage('en')}
        {...stylex.props(
          styles.button,
          underlineStyles.interactive,
          activeLanguage === 'en' && styles.active,
          activeLanguage === 'en' && underlineStyles.selected
        )}
      >
        EN
      </button>
    </fieldset>
  );
}
