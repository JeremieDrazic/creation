import * as stylex from '@stylexjs/stylex';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

export type CreationIdentityProps = Readonly<{
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}>;

const styles = stylex.create({
  link: {
    color: { default: '#f2eee4', ':hover': '#e0cc9d' },
    fontFamily: '"Creation Cormorant Study", serif',
    fontWeight: 300,
    fontSize: 'clamp(2rem, 2.6vw, 2.75rem)',
    lineHeight: 1,
    textDecoration: 'none',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineOffset: '6px',
  },
});

/** Creation's text identity and native home link; artistic interaction is deferred. */
export function CreationIdentity({ onClick }: CreationIdentityProps) {
  const { t } = useTranslation('intro');

  return (
    <a href="/" aria-label={t('homeLabel')} onClick={onClick} {...stylex.props(styles.link)}>
      Creation
    </a>
  );
}
