import * as stylex from '@stylexjs/stylex';
// oxlint-disable-next-line no-restricted-imports -- Owns the GSAP arrow animation and releases its timeline/media-query listener on unmount.
import { useEffect, useRef, type MouseEventHandler, type ReactNode } from 'react';

import { createExperienceLinkArrowAnimation } from './create-experience-link-arrow-animation/create-experience-link-arrow-animation';

export type ExperienceLinkProps = Readonly<{
  href: string;
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}>;

const styles = stylex.create({
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '0.5rem',
    color: { default: '#f2eee4', ':hover': '#e0cc9d' },
    fontFamily: '"Creation Cormorant Study", serif',
    fontWeight: 300,
    fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
    lineHeight: 1.4,
    textDecoration: 'none',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: { default: 'transparent', ':focus-visible': '#e0cc9d' },
    outlineOffset: '6px',
  },
  arrowWindow: {
    display: 'block',
    width: '26px',
    height: '12px',
    flexShrink: 0,
    overflow: 'hidden',
  },
  arrow: { display: 'block' },
});

/** The caller supplies localized content and owns any navigation interception. */
export function ExperienceLink({ href, children, onClick }: ExperienceLinkProps) {
  const arrowRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<ReturnType<typeof createExperienceLinkArrowAnimation> | null>(null);

  useEffect(() => {
    const arrow = arrowRef.current;

    if (arrow === null) {
      return;
    }

    const animation = createExperienceLinkArrowAnimation(arrow);
    animationRef.current = animation;

    return () => {
      animationRef.current = null;
      animation.dispose();
    };
  }, []);

  function playArrowAnimation(): void {
    animationRef.current?.playOnce();
  }

  return (
    <a
      href={href}
      onClick={onClick}
      onPointerEnter={playArrowAnimation}
      onFocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) {
          playArrowAnimation();
        }
      }}
      {...stylex.props(styles.link)}
    >
      <span>{children}</span>
      <span aria-hidden="true" {...stylex.props(styles.arrowWindow)}>
        <svg
          ref={arrowRef}
          width="26"
          height="12"
          viewBox="0 0 26 12"
          fill="none"
          focusable="false"
          {...stylex.props(styles.arrow)}
        >
          <path d="M1 6H24M19 1L24 6L19 11" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>
    </a>
  );
}
