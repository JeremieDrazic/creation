import { expect, test } from '@playwright/test';

test.use({ locale: 'fr-FR' });

test('intro navigation and persisted language keep the shell usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('region', { name: 'Introduction à Creation' })).toBeVisible();
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
  await expect(page.getByRole('button', { name: 'Son', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('complementary', { name: 'Temporary rendering validation' })
  ).toHaveCount(0);

  const initialDocumentTime = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('button', { name: 'EN, display in English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('blockquote')).toContainText('and there was light.');
  await page.getByRole('link', { name: 'Discover Fireflies' }).click();
  await expect(page).toHaveURL(/\/fireflies$/);
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await expect(page.getByText('A word will become light.')).toBeVisible();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocumentTime);

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('blockquote')).toContainText('and there was light.');
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocumentTime);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'EN, display in English' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  await page.getByRole('button', { name: 'FR, afficher en français' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
  expect(errors).toEqual([]);
});

test('a direct experience URL works and unknown routes provide a way home', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/fireflies');
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await page.getByRole('link', { name: 'Accueil', exact: true }).click();
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
  await page.goto('http://127.0.0.1:4173/missing');
  await expect(page.getByRole('heading', { name: 'Cette page n’existe pas.' })).toBeVisible();
  await page.getByRole('link', { name: 'Accueil', exact: true }).click();
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
});
