import * as stylex from '@stylexjs/stylex';
import { theme } from '@creation/design-tokens/theme.stylex';
import { Button } from '@creation/ui/button';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const Route = createRootRoute({ component: Shell, notFoundComponent: NotFound });

function Shell() {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'fr';
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

function NotFound() {
  const { t } = useTranslation();
  return <h1>{t('notFound')}</h1>;
}

const styles = stylex.create({
  shell: {
    minHeight: '100svh',
    backgroundColor: theme.background,
    color: theme.foreground,
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
  navigation: { display: 'flex', gap: '2rem', color: theme.muted },
  link: { color: 'inherit', textUnderlineOffset: '0.3em' },
});
