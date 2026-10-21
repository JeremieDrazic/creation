import * as stylex from '@stylexjs/stylex';

/** For controls with 0.5rem inline padding: the line follows the text, inside that padding. */
export const underlineStyles = stylex.create({
  interactive: {
    backgroundImage: 'linear-gradient(currentColor, currentColor)',
    backgroundRepeat: 'no-repeat',
    // Subtract both padded edges to keep the line aligned with the label.
    backgroundSize: {
      default: '0% 1px',
      ':hover': 'calc(100% - 1rem) 1px',
      ':focus-visible': 'calc(100% - 1rem) 1px',
    },
    // Growing from the left draws the line; shrinking toward the right removes it.
    backgroundPosition: {
      default: 'right 0.5rem bottom 0.3rem',
      ':hover': 'left 0.5rem bottom 0.3rem',
      ':focus-visible': 'left 0.5rem bottom 0.3rem',
    },
    transitionProperty: 'background-size',
    transitionDuration: {
      default: '0.14s',
      ':hover': '0.35s',
      ':focus-visible': '0.35s',
      '@media (prefers-reduced-motion: reduce)': '0s',
    },
    transitionTimingFunction: {
      default: 'ease-in',
      ':hover': 'ease-out',
      ':focus-visible': 'ease-out',
    },
  },
  selected: { backgroundSize: 'calc(100% - 1rem) 1px' },
});
