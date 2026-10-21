import * as stylex from '@stylexjs/stylex';
import { Link, Outlet } from '@tanstack/react-router';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the external document language with the active translation instance.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LANGUAGE } from '../utils/localization/i18n';

const styles = stylex.create({
  shell: {
    minHeight: '100svh',
    backgroundColor: '#03090e',
    color: '#f2eee4',
  },
  fallback: {
    minHeight: '100svh',
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    gap: '1.5rem',
    padding: '2rem',
    textAlign: 'center',
  },
  link: {
    color: 'inherit',
    textUnderlineOffset: '0.3em',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '6px',
  },
});

/** Persistent page surface; each route owns its experience UI. */
export function Shell() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
  }, [i18n.resolvedLanguage]);

  return (
    <main {...stylex.props(styles.shell)}>
      <Outlet />
    </main>
  );
}

/** Localized fallback with an explicit way home, independent of experience controls. */
export function NotFound() {
  const { t } = useTranslation();

  return (
    <section {...stylex.props(styles.fallback)}>
      <h1>{t('notFound')}</h1>
      <Link to="/" {...stylex.props(styles.link)}>
        {t('home')}
      </Link>
    </section>
  );
}
