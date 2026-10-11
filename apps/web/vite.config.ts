import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createStylexPlugin } from '@creation/config/vite/stylex';

export default defineConfig(({ mode }) => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routeFileIgnorePattern: '\\.(test|spec|stories)\\.',
    }),
    createStylexPlugin(mode),
    react(),
  ],
}));
