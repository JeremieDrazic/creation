import * as stylex from '@stylexjs/stylex';
import type { ComponentProps } from 'react';

import { colors } from '@creation/design-tokens/colors.stylex';
import { controls } from '@creation/design-tokens/controls.stylex';

const styles = stylex.create({
  button: {
    backgroundColor: 'transparent',
    color: { default: colors.foreground, ':hover': colors.accent },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'currentColor',
    borderRadius: controls.controlRadius,
    paddingBlock: controls.controlPaddingBlock,
    paddingInline: controls.controlPaddingInline,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    outlineWidth: { default: null, ':focus-visible': controls.controlFocusWidth },
    outlineStyle: { default: null, ':focus-visible': 'solid' },
    outlineColor: { default: null, ':focus-visible': 'currentColor' },
    outlineOffset: { default: null, ':focus-visible': controls.controlFocusOffset },
    opacity: { default: 1, ':disabled': controls.controlDisabledOpacity },
  },
});

/** Native button attributes; styling is owned by the shared UI module. */
export type ButtonProps = Omit<ComponentProps<'button'>, 'className' | 'style'>;

/**
 * Render the shared native control with keyboard focus and disabled styling.
 *
 * @remarks
 *   Defaults to a non-submitting button; pass an explicit type for form actions.
 */
export function Button({ type = 'button', ...props }: ButtonProps) {
  // oxlint-disable-next-line react/button-has-type -- Native React types constrain this forwarded value to button, submit or reset.
  return <button {...props} type={type} {...stylex.props(styles.button)} />;
}
