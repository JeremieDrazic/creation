import { fileURLToPath } from 'node:url';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createStylexPlugin } from '@creation/config/vite/stylex';
import { dataGuiPresetFiles } from '@creation/data-gui/vite/preset-files';

export default defineConfig(({ mode }) => ({
  plugins: [
    dataGuiPresetFiles({
      directory: fileURLToPath(
        new URL(
          process.env['CREATION_GUI_TEST_PRESETS'] === '1'
            ? `../../node_modules/.cache/data-gui-presets-${process.pid}/`
            : '../../development-presets/',
          import.meta.url
        )
      ),
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.(test|spec|stories)\\.',
    }),
    createStylexPlugin(mode),
    react(),
  ],
}));
