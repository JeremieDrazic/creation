import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

const styles = stylex.create({
  figure: { margin: 0, maxWidth: '40rem' },
  verse: {
    margin: 0,
    fontSize: 'clamp(2.125rem, 3.4vw, 3.75rem)',
    lineHeight: 1.13,
    letterSpacing: '-0.015em',
    fontWeight: 300,
  },
  line: { display: 'block' },
  reference: {
    marginBlockStart: '1.5rem',
    fontStyle: 'italic',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.06em',
    color: '#b9c5d5',
  },
});

/** Static localized verse; entrance choreography will be designed separately. */
export function IntroVerse() {
  const { t } = useTranslation('intro', { keyPrefix: 'verse' });

  return (
    <figure lang={t('language')} {...stylex.props(styles.figure)}>
      <blockquote {...stylex.props(styles.verse)}>
        <span {...stylex.props(styles.line)}>{t('opening')}</span>{' '}
        <span {...stylex.props(styles.line)}>{t('command')}</span>{' '}
        <span {...stylex.props(styles.line)}>{t('fulfillment')}</span>
      </blockquote>
      <figcaption {...stylex.props(styles.reference)}>{t('reference')}</figcaption>
    </figure>
  );
}
