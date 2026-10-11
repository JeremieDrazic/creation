import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';

import { createStylexPlugin } from '@creation/config/vite/stylex';

const config: StorybookConfig = {
  stories: ['../../../packages/ui/src/**/*.stories.tsx'],
  addons: [
    dirname(fileURLToPath(import.meta.resolve('@storybook/addon-a11y/package.json'))),
    dirname(fileURLToPath(import.meta.resolve('@storybook/addon-vitest/package.json'))),
  ],
  framework: {
    name: dirname(fileURLToPath(import.meta.resolve('@storybook/react-vite/package.json'))),
    options: {},
  },
  core: { disableTelemetry: true },
  viteFinal(config, { configType }) {
    config.base = './';
    config.plugins = [
      createStylexPlugin(configType === 'DEVELOPMENT' ? 'development' : 'production'),
      ...(config.plugins ?? []),
    ];
    return config;
  },
};

export default config;
