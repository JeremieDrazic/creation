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

  await expect(page.locator('[data-rendering-status]')).toHaveAttribute(
    'data-rendering-status',
    'ready'
  );
  await expect(page.locator('canvas')).toHaveCount(1);
  const drawingCanvas = await page.locator('canvas').elementHandle();
  await page.screenshot({ path: test.info().outputPath('intro-integration.png') });
  const initialDocumentTime = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('button', { name: 'EN, display in English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('blockquote')).toContainText('and there was light.');
  await page.getByRole('link', { name: 'Discover Fireflies' }).click();
  await expect(page).toHaveURL(/\/fireflies$/);
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await expect(page.getByText('A word will become light.')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  expect(
    await drawingCanvas?.evaluate((canvas) => canvas === document.querySelector('canvas'))
  ).toBe(true);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(initialDocumentTime);

  await page.getByRole('link', { name: 'Home', exact: true }).click();
  expect(
    await drawingCanvas?.evaluate((canvas) => canvas === document.querySelector('canvas'))
  ).toBe(true);
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
  const veilRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('celestial-veil-data-')) {
      veilRequests.push(request.url());
    }
  });
  await page.goto('http://127.0.0.1:4173/fireflies');
  await expect(page.getByRole('heading', { name: 'Fireflies' })).toBeVisible();
  await expect(page.locator('[data-rendering-status]')).toHaveAttribute(
    'data-rendering-status',
    'ready'
  );
  expect(veilRequests).toHaveLength(0);
  const drawingCanvas = await page.locator('canvas').elementHandle();
  await page.getByRole('link', { name: 'Accueil', exact: true }).click();
  await expect.poll(() => veilRequests.length).toBe(1);
  expect(
    await drawingCanvas?.evaluate((canvas) => canvas === document.querySelector('canvas'))
  ).toBe(true);
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
  await page.goto('http://127.0.0.1:4173/missing');
  await expect(page.getByRole('heading', { name: 'Cette page n’existe pas.' })).toBeVisible();
  await expect(page.locator('[data-rendering-status]')).toHaveAttribute(
    'data-rendering-status',
    'ready'
  );
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('link', { name: 'Accueil', exact: true }).click();
  await expect(page.getByRole('blockquote')).toContainText('Et la lumière fut.');
});

test('keeps the intro canvas mounted across different screen proportions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('[data-rendering-status]')).toHaveAttribute(
    'data-rendering-status',
    'ready'
  );
  const drawingCanvas = await page.locator('canvas').elementHandle();

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 2560, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() =>
        page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => ({
          width: canvas.width,
          height: canvas.height,
        }))
      )
      .toEqual({ width: viewport.width, height: viewport.height });
    expect(
      await drawingCanvas?.evaluate((canvas) => canvas === document.querySelector('canvas'))
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`intro-framing-${viewport.width}x${viewport.height}.png`),
    });
  }
  expect(errors).toEqual([]);
});
