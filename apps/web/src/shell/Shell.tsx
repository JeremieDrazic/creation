import * as stylex from '@stylexjs/stylex';
import { Link, Outlet } from '@tanstack/react-router';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the external document language with the active translation instance.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { colors } from '@creation/design-tokens/colors.stylex';
import { Button } from '@creation/ui/button';

import { DEFAULT_LANGUAGE } from '../localization/i18n';

const styles = stylex.create({
  shell: {
    minHeight: '100svh',
    backgroundColor: colors.background,
    color: colors.foreground,
    display: 'flex',
    flexDirection: 'column',
    paddingBlockStart: 'clamp(1.5rem, 4vw, 4rem)',
    paddingBlockEnd: 'clamp(1.5rem, 4vw, 4rem)',
    paddingInlineStart: 'clamp(1.5rem, 4vw, 4rem)',
    paddingInlineEnd: 'clamp(1.5rem, 4vw, 4rem)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  brand: {
    color: 'inherit',
    fontFamily: 'Georgia, serif',
    fontWeight: 400,
    fontSize: '2.5rem',
    textDecoration: 'none',
  },
  main: {
    flexGrow: 1,
    display: 'grid',
    placeItems: 'center',
    paddingBlock: '4rem',
    textAlign: 'center',
  },
  navigation: { display: 'flex', gap: '2rem', color: colors.muted },
  link: { color: 'inherit', textUnderlineOffset: '0.3em' },
});

/** Persistent DOM shell; route changes replace only its outlet. */
export function Shell() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
  }, [i18n.resolvedLanguage]);

  return (
    <div {...stylex.props(styles.shell)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.brand)}>
          creation
        </Link>
        <Button
          onClick={() => {
            void i18n.changeLanguage(i18n.resolvedLanguage === 'fr' ? 'en' : 'fr');
          }}
        >
          {t('language')}
        </Button>
      </header>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
      <nav aria-label={t('home')} {...stylex.props(styles.navigation)}>
        <Link to="/" {...stylex.props(styles.link)}>
          {t('home')}
        </Link>
        <Link to="/fireflies" {...stylex.props(styles.link)}>
          {t('fireflies')}
        </Link>
      </nav>
    </div>
  );
}

/** Localized fallback retaining the shell's return navigation. */
export function NotFound() {
  const { t } = useTranslation();
  return <h1>{t('notFound')}</h1>;
}
