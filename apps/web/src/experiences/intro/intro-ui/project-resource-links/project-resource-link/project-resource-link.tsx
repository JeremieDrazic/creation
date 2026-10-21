import * as stylex from '@stylexjs/stylex';
// oxlint-disable-next-line no-restricted-imports -- Owns the underline's input/media listeners and GSAP motion, released on unmount.
import { useEffect, useRef } from 'react';

import { createDirectionalUnderline } from '../../../../../utils/animation/create-directional-underline/create-directional-underline';

type ProjectResourceLinkProps = Readonly<{
  href: string;
  label: string;
  accessibleLabel: string;
}>;

const styles = stylex.create({
  link: {
    display: 'inline-block',
    position: 'relative',
    padding: '0.5rem',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.75rem',
    lineHeight: 1.5,
    color: { default: '#b9c5d5', ':hover': '#f2eee4' },
    textDecoration: 'none',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineOffset: '6px',
  },
  underline: {
    position: 'absolute',
    insetInline: '0.5rem',
    bottom: '0.3rem',
    height: '1px',
    backgroundColor: 'currentColor',
    transform: 'scaleX(0)',
    pointerEvents: 'none',
  },
});

export function ProjectResourceLink({ href, label, accessibleLabel }: ProjectResourceLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    const underline = underlineRef.current;

    if (link === null || underline === null) {
      return;
    }

    const interaction = createDirectionalUnderline(link, underline);
    return () => interaction.dispose();
  }, []);

  return (
    <a
      ref={linkRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleLabel}
      {...stylex.props(styles.link)}
    >
      {label}
      <span ref={underlineRef} aria-hidden="true" {...stylex.props(styles.underline)} />
    </a>
  );
}
