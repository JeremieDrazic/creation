import { expect, test } from '@playwright/test';

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
