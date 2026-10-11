import { expect, test } from '@playwright/test';

test('documentation loads at its public base path and preserves deep navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174/docs/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Creation documentation');
  await page.goto('http://127.0.0.1:4174/docs/standards.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Code standards');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(errors).toEqual([]);
});
