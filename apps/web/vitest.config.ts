import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'web-runtime',
    environment: 'node',
    include: ['src/rendering-probe/**/*.test.ts', 'src/runtime/**/*.test.ts'],
    allowOnly: !process.env['CI'],
  },
});
