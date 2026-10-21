import * as stylex from '@stylexjs/stylex';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

const styles = stylex.create({
  placeholder: {
    minHeight: '100svh',
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    gap: '1.5rem',
    padding: '2rem',
    textAlign: 'center',
  },
  home: {
    color: 'inherit',
    textUnderlineOffset: '0.3em',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '6px',
  },
});

/** Temporary route placeholder until the Fireflies experience is implemented. */
function Page() {
  const { t } = useTranslation();
  return (
    <section {...stylex.props(styles.placeholder)}>
      <h1>Fireflies</h1>
      <p>{t('firefliesWaiting')}</p>
      <Link to="/" {...stylex.props(styles.home)}>
        {t('home')}
      </Link>
    </section>
  );
}

export const Route = createFileRoute('/fireflies')({ component: Page });
