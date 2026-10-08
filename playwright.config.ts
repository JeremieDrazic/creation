import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: [
    '**/apps/web/src/**/*.test.ts',
    '**/packages/ui/src/**/*.test.ts',
    '**/apps/docs/.vitepress/**/*.test.ts',
  ],
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { browserName: 'chromium', trace: 'retain-on-failure' },
  webServer: [
    {
      command: 'pnpm --filter @creation/docs preview',
      url: 'http://127.0.0.1:4174/docs/',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter @creation/web preview',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter @creation/storybook preview',
      url: 'http://127.0.0.1:6006/design-system/',
      reuseExistingServer: false,
    },
  ],
});
