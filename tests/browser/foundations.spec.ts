import { expect, test } from '@playwright/test';

test('routes, back navigation and language changes keep the shared shell usable', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { name: 'Creation', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Fireflies', exact: true }).click();
  await expect(page).toHaveURL(/\/fireflies$/);
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('A word will become light.')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Creation', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Passer en français' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a direct experience URL works and unknown routes show a useful fallback', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4173/fireflies');
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await page.goto('http://127.0.0.1:4173/missing');
  await expect(page.getByRole('heading', { name: 'Cette page n’existe pas.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accueil', exact: true })).toBeVisible();
});

test('shared StyleX styles and tokens survive both production builds', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  const webButton = page.getByRole('button');
  await expect(webButton).toHaveCSS('border-radius', '999px');
  await expect(webButton).toHaveCSS('color', 'rgb(242, 238, 228)');
  await webButton.focus();
  await expect(webButton).toHaveCSS('outline-style', 'solid');
  await expect(webButton).toHaveCSS('outline-width', '2px');

  await page.goto('http://127.0.0.1:6006/iframe.html?id=ui-button--default&viewMode=story');
  const storyButton = page.getByRole('button', { name: 'Laisser danser' });
  await expect(storyButton).toHaveCSS('border-radius', '999px');
  await expect(storyButton).toHaveCSS('color', 'rgb(242, 238, 228)');
  await page.goto('http://127.0.0.1:6006/iframe.html?id=ui-button--disabled&viewMode=story');
  await expect(page.getByRole('button', { name: 'Laisser danser' })).toBeDisabled();
});
