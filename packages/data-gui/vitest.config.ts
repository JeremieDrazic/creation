import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'data-gui',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    allowOnly: !process.env['CI'],
  },
});
