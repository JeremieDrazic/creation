import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'web-runtime',
    environment: 'node',
    include: [
      'src/development/**/*.test.ts',
      'src/experiences/**/*.test.ts',
      'src/rendering-probe/**/*.test.ts',
      'src/runtime/**/*.test.ts',
      'src/stores/**/*.test.ts',
      'src/utils/**/*.test.ts',
    ],
    exclude: ['src/development/**/*.browser.test.ts'],
    allowOnly: !process.env['CI'],
  },
});
