import type { StorybookConfig } from '@storybook/react-vite';
import { createStylexPlugin } from '@creation/config/vite/stylex';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.tsx'],
  addons: [dirname(fileURLToPath(import.meta.resolve('@storybook/addon-a11y/package.json')))],
  framework: {
    name: dirname(fileURLToPath(import.meta.resolve('@storybook/react-vite/package.json'))),
    options: {},
  },
  core: { disableTelemetry: true },
  viteFinal(config, { configType }) {
    config.plugins = [
      createStylexPlugin(configType === 'DEVELOPMENT' ? 'development' : 'production'),
      ...(config.plugins ?? []),
    ];
    return config;
  },
};

export default config;
