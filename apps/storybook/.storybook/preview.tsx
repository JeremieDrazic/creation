import type { Preview } from '@storybook/react-vite';
import * as stylex from '@stylexjs/stylex';

import { colors } from '@creation/design-tokens/colors.stylex';
import '@creation/ui/global.css';

const styles = stylex.create({
  stage: {
    backgroundColor: colors.background,
    color: colors.foreground,
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
