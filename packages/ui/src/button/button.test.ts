import { expect, test } from '@playwright/test';

test('StyleX styles survive the application and Storybook production builds', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  const verse = page.getByRole('blockquote');
  await expect(verse).toHaveCSS('font-family', '"Creation Cormorant Study", serif');
  await expect(verse).toHaveCSS('font-weight', '300');
  await expect(verse).toHaveCSS('color', 'rgb(242, 238, 228)');

  await page.goto(
    'http://127.0.0.1:4175/design-system/iframe.html?id=ui-button--default&viewMode=story'
  );
  const storyButton = page.getByRole('button', { name: 'Laisser danser' });
  await expect(storyButton).toHaveCSS('border-radius', '999px');
  await expect(storyButton).toHaveCSS('color', 'rgb(242, 238, 228)');
});
