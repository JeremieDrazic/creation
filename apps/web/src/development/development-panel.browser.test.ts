import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function captureVeil(page: Page) {
  const panel = page.locator('.creation-floating-panel');
  await panel.evaluate((element: HTMLElement) => {
    element.style.visibility = 'hidden';
  });
  const image = await page.locator('canvas').screenshot();
  await panel.evaluate((element: HTMLElement) => {
    element.style.visibility = '';
  });
  return image;
}

async function choosePreset(page: Page, name: string) {
  const trigger = page.getByRole('combobox', { name: 'Choisir un preset', exact: true });
  await trigger.click();
  await page.getByRole('option', { name, exact: true }).click();
  await expect(trigger).toContainText(name);
}

async function expectPresetCount(page: Page, count: number) {
  await page.getByRole('combobox', { name: 'Choisir un preset', exact: true }).click();
  await expect(page.getByRole('option')).toHaveCount(count);
  await page.keyboard.press('Escape');
}

test.use({ locale: 'fr-FR', viewport: { width: 1024, height: 768 } });

test('edits the active experience and retains one movable panel across navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4176/');
  const panel = page.getByRole('complementary', { name: 'Réglages', exact: true });
  await expect(panel).toBeVisible();
  await expect(panel.locator('.lil-controller input')).toHaveCount(5);
  await page.screenshot({ path: test.info().outputPath('atelier-default.png') });
  const canvas = await page.locator('canvas').elementHandle();
  const surface = await panel.elementHandle();
  const beforeEdit = await captureVeil(page);
  const scale = panel.getByRole('textbox', { name: 'Échelle du voile', exact: true });
  await scale.fill('1.6');
  await scale.press('Enter');
  await expect(scale).toHaveValue('1.6');
  await expect.poll(async () => (await captureVeil(page)).equals(beforeEdit)).toBe(false);
  await page.screenshot({ path: test.info().outputPath('atelier-live-edit.png') });

  const handle = panel.getByRole('button', { name: 'Déplacer le panneau', exact: true });
  const before = await panel.boundingBox();
  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(200, 200, { steps: 8 });
  await page.mouse.up();
  const after = await panel.boundingBox();
  expect(after?.x).not.toBe(before?.x);
  expect(after?.y).not.toBe(before?.y);
  await handle.focus();
  await handle.press('ArrowRight');
  expect((await panel.boundingBox())?.x).toBe((after?.x ?? 0) + 10);

  await panel.getByRole('button', { name: 'Replier le panneau', exact: true }).click();
  await expect(scale).not.toBeVisible();
  expect((await panel.boundingBox())?.width).toBeLessThanOrEqual(96);
  await page.screenshot({ path: test.info().outputPath('controls-collapsed.png') });
  await panel.screenshot({ path: test.info().outputPath('controls-collapsed-panel.png') });
  await panel.getByRole('button', { name: 'Déplier le panneau', exact: true }).click();
  await expect(scale).toHaveValue('1.6');

  const placement = await panel.boundingBox();
  await page.getByRole('link', { name: 'Découvrir Fireflies', exact: true }).click();
  await expect(panel.getByRole('textbox')).toHaveCount(0);
  await expect(panel).toContainText('Aucune expérience à régler');
  await page.getByRole('link', { name: 'Accueil', exact: true }).click();
  await expect(panel.locator('.lil-controller input')).toHaveCount(5);
  expect(await surface?.evaluate((element) => element.isConnected)).toBe(true);
  expect(await canvas?.evaluate((element) => element === document.querySelector('canvas'))).toBe(
    true
  );
  expect((await panel.boundingBox())?.x).toBe(placement?.x);
  expect((await panel.boundingBox())?.y).toBe(placement?.y);
  expect(errors).toEqual([]);
});

test('keeps controls reachable after dragging beyond the viewport and shrinking the window', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4176/');
  const panel = page.getByRole('complementary', { name: 'Réglages', exact: true });
  await expect(panel.locator('.lil-controller input')).toHaveCount(5);
  await panel.getByRole('button', { name: 'Déplacer le panneau', exact: true }).hover();
  await page.mouse.down();
  await page.mouse.move(1300, 1100, { steps: 4 });
  await page.mouse.up();
  await page.setViewportSize({ width: 420, height: 400 });
  await expect
    .poll(async () => {
      const bounds = await panel.boundingBox();
      return (
        bounds !== null &&
        bounds.x >= 12 &&
        bounds.y >= 12 &&
        bounds.x + bounds.width <= 408 &&
        bounds.y + bounds.height <= 388
      );
    })
    .toBe(true);
  await expect(
    panel.getByRole('button', { name: 'Replier le panneau', exact: true })
  ).toBeVisible();
  await panel
    .getByRole('textbox', { name: 'Taille des grains', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    panel.getByRole('textbox', { name: 'Taille des grains', exact: true })
  ).toBeVisible();
});

test('translates live controls, resets defaults and copies versioned JSON', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('http://127.0.0.1:4176/');
  const panel = page.locator('.creation-floating-panel');
  const scale = panel.getByRole('textbox', { name: 'Échelle du voile', exact: true });
  await expect(scale).toBeVisible();
  await scale.fill('1.6');
  await scale.press('Enter');
  await panel.getByRole('button', { name: 'Copier les réglages', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Réglages copiés en JSON.');
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual({
    version: 1,
    experience: 'intro',
    settings: {
      rotationDegrees: 0,
      scale: 1.6,
      offsetXViewportRatio: 0,
      offsetYViewportRatio: 0,
      grainScale: 1,
    },
  });
  const handle = await panel.elementHandle();
  const placement = await panel.boundingBox();
  await page.getByRole('button', { name: 'EN, display in English', exact: true }).click();
  await expect(panel).toHaveAttribute('aria-label', 'Controls');
  await expect(panel).toContainText('Celestial veil');
  await expect(panel.getByRole('textbox', { name: 'Veil scale', exact: true })).toHaveValue('1.6');
  expect((await panel.boundingBox())?.x).toBe(placement?.x);
  expect(await handle?.evaluate((element) => element.isConnected)).toBe(true);
  await panel.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Default values restored.');
  await expect(panel.getByRole('textbox', { name: 'Veil scale', exact: true })).toHaveValue('1');
  await panel.getByRole('button', { name: 'Copy settings', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Settings copied as JSON.');
  const exported: unknown = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(exported).toEqual(
    expect.objectContaining({
      settings: {
        rotationDegrees: 0,
        scale: 1,
        offsetXViewportRatio: 0,
        offsetYViewportRatio: 0,
        grainScale: 1,
      },
    })
  );
  await page.getByRole('button', { name: 'FR, afficher en français', exact: true }).click();
  await expect(panel).toHaveAttribute('aria-label', 'Réglages');
  await expect(panel.getByRole('button', { name: 'Réinitialiser', exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('atelier-refined.png') });
});

test('persists named presets in project files and compares, renames, exports and imports them', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('http://127.0.0.1:4176/');
  const panel = page.locator('.creation-floating-panel');
  const select = panel.getByRole('combobox', { name: 'Choisir un preset', exact: true });
  const name = panel.getByRole('textbox', { name: 'Nom du preset', exact: true });
  const scale = panel.getByRole('textbox', { name: 'Échelle du voile', exact: true });
  await expect(name).toBeEnabled();
  await scale.fill('1.4');
  await scale.press('Enter');
  await name.fill('Large');
  await panel.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(panel.getByRole('status')).toHaveText('Preset enregistré dans le projet.');
  await scale.fill('2.2');
  await scale.press('Enter');
  await name.fill('Proche');
  await panel.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expectPresetCount(page, 3);
  const saved = await page.request.get('http://127.0.0.1:4176/__data-gui/presets/intro');
  expect(await saved.json()).toEqual(
    expect.objectContaining({
      version: 1,
      scope: 'intro',
      presets: [
        expect.objectContaining({
          name: 'Large',
          settings: expect.objectContaining({ scale: 1.4 }),
        }),
        expect.objectContaining({
          name: 'Proche',
          settings: expect.objectContaining({ scale: 2.2 }),
        }),
      ],
    })
  );
  await page.reload();
  await expect(select).toBeEnabled();
  await expectPresetCount(page, 3);
  await choosePreset(page, 'Large');
  await expect(scale).toHaveValue('1.4');
  await choosePreset(page, 'Proche');
  await expect(scale).toHaveValue('2.2');
  await panel.getByText('Gérer les presets', { exact: true }).click();
  const download = page.waitForEvent('download');
  await panel.getByRole('button', { name: 'Exporter', exact: true }).click();
  const stream = await (await download).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const exported = Buffer.concat(chunks);
  const parsed: unknown = JSON.parse(exported.toString('utf8'));
  expect(parsed).toEqual(await saved.json());
  await choosePreset(page, 'Large');
  await name.fill('Large renommé');
  await panel.getByRole('button', { name: 'Renommer', exact: true }).click();
  await expect(select).toContainText('Large renommé');
  await choosePreset(page, 'Proche');
  await panel.getByRole('button', { name: 'Supprimer', exact: true }).click();
  await expectPresetCount(page, 2);
  await panel
    .locator('input[type=file]')
    .setInputFiles({ name: 'intro-presets.json', mimeType: 'application/json', buffer: exported });
  await expectPresetCount(page, 3);
  await choosePreset(page, 'Proche');
  await expect(scale).toHaveValue('2.2');
  await select.click();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('controls-select-open.png') });
  await page
    .locator('.creation-preset-popup')
    .screenshot({ path: test.info().outputPath('controls-select-popup.png') });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: test.info().outputPath('controls-presets.png') });
  await panel.screenshot({ path: test.info().outputPath('controls-presets-panel.png') });
  const before: unknown = await (
    await page.request.get('http://127.0.0.1:4176/__data-gui/presets/intro')
  ).json();
  await panel.locator('input[type=file]').setInputFiles({
    name: 'wrong.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, scope: 'fireflies', presets: [] })),
  });
  await expect(panel.getByRole('status')).toContainText('Impossible de charger');
  expect(
    await (await page.request.get('http://127.0.0.1:4176/__data-gui/presets/intro')).json()
  ).toEqual(before);
  await expect(scale).toHaveValue('2.2');
});

test('Base UI preset select supports keyboard selection, cancellation and viewport collision handling', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const settings = {
    rotationDegrees: 0,
    scale: 1,
    offsetXViewportRatio: 0,
    offsetYViewportRatio: 0,
    grainScale: 1,
  };
  await page.request.put('http://127.0.0.1:4176/__data-gui/presets/intro', {
    data: {
      version: 1,
      scope: 'intro',
      presets: [
        { id: 'clair', name: 'Clair', settings: { ...settings, scale: 1.2 } },
        { id: 'cuivre', name: 'Cuivre', settings: { ...settings, scale: 1.5 } },
        { id: 'etoile', name: 'Étoile', settings: { ...settings, scale: 1.8 } },
      ],
    },
  });
  await page.goto('http://127.0.0.1:4176/');
  const trigger = page.getByRole('combobox', { name: 'Choisir un preset', exact: true });
  const scale = page.getByRole('textbox', { name: 'Échelle du voile', exact: true });
  await expect(trigger).toBeEnabled();
  expect(await trigger.evaluate((element) => element.tagName)).toBe('BUTTON');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expect(trigger).toContainText('Valeurs par défaut');
  await expect(scale).toHaveValue('1');
  await trigger.click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Étoile');
  await expect(scale).toHaveValue('1.8');
  await trigger.click();
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('Clair');
  await expect(scale).toHaveValue('1.2');
  await trigger.click();
  await page.mouse.click(40, 160);
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.setViewportSize({ width: 420, height: 400 });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect
    .poll(async () => {
      const rect = await page.locator('.creation-preset-popup').boundingBox();
      return (
        rect !== null &&
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x + rect.width <= 420 &&
        rect.y + rect.height <= 400
      );
    })
    .toBe(true);
  await page.keyboard.press('Escape');
});
