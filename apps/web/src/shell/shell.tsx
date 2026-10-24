import * as stylex from '@stylexjs/stylex';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the external document language with the active translation instance.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_LANGUAGE } from '../utils/localization/i18n';
import { ApplicationRendering } from './application-rendering/application-rendering';
import { resolveRouteExperience } from './route-experiences/route-experiences';

const styles = stylex.create({
  shell: {
    minHeight: '100svh',
    backgroundColor: '#03090e',
    color: '#f2eee4',
    isolation: 'isolate',
  },
  graphics: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
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

/** Persistent graphics surface behind route-owned UI; does not own rendering resources. */
export function Shell() {
  const { i18n } = useTranslation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const prepareExperience = resolveRouteExperience(pathname);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
  }, [i18n.resolvedLanguage]);

  return (
    <main {...stylex.props(styles.shell)}>
      <div aria-hidden="true" {...stylex.props(styles.graphics)}>
        <ApplicationRendering prepareExperience={prepareExperience} />
      </div>
      <div {...stylex.props(styles.content)}>
        <Outlet />
      </div>
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
