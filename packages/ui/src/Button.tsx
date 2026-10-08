import * as stylex from '@stylexjs/stylex';
import { theme } from '@creation/design-tokens/theme.stylex';
import type { ComponentProps } from 'react';

type ButtonProps = Omit<ComponentProps<'button'>, 'className' | 'style'>;

export function Button({ type = 'button', ...props }: ButtonProps) {
  // oxlint-disable-next-line react/button-has-type -- Native React types constrain this forwarded value to button, submit or reset.
  return <button {...props} type={type} {...stylex.props(styles.button)} />;
}

const styles = stylex.create({
  button: {
    backgroundColor: 'transparent',
    color: { default: theme.foreground, ':hover': theme.accent },
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'currentColor',
    borderRadius: theme.controlRadius,
    paddingBlock: theme.controlPaddingBlock,
    paddingInline: theme.controlPaddingInline,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    cursor: { default: 'pointer', ':disabled': 'not-allowed' },
    outlineWidth: { default: null, ':focus-visible': '2px' },
    outlineStyle: { default: null, ':focus-visible': 'solid' },
    outlineColor: { default: null, ':focus-visible': 'currentColor' },
    outlineOffset: { default: null, ':focus-visible': '5px' },
    opacity: { default: 1, ':disabled': 0.45 },
  },
});
