import * as stylex from '@stylexjs/stylex';
import { theme } from '@creation/design-tokens/theme.stylex';
import type { Preview } from '@storybook/react-vite';
import '@creation/ui/global.css';

const styles = stylex.create({
  stage: {
    backgroundColor: theme.background,
    color: theme.foreground,
    minHeight: '100vh',
    padding: '3rem',
  },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <div {...stylex.props(styles.stage)}>
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
};

export default preview;
