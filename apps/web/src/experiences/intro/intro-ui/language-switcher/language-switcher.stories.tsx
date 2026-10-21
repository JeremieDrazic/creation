import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';

import { LanguageSwitcher } from './language-switcher';

const meta = {
  title: 'Experiences/Intro/LanguageSwitcher',
  component: LanguageSwitcher,
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, globals }) => {
    await expect(canvas.getByRole('button', { name: 'FR, afficher en français' })).toHaveAttribute(
      'aria-pressed',
      String(globals['locale'] !== 'en')
    );
    await expect(canvas.getByRole('button', { name: 'EN, display in English' })).toHaveAttribute(
      'aria-pressed',
      String(globals['locale'] === 'en')
    );

    const selected = canvas.getByRole('button', { pressed: true });
    const unselected = canvas.getByRole('button', { pressed: false });

    await expect(selected).toHaveStyle({ backgroundSize: 'calc(100% - 16px) 1px' });
    await expect(unselected).toHaveStyle({ backgroundSize: '0% 1px' });
  },
};

/** Automated language changes stay out of the browsable preview. */
export const KeyboardAndLanguage: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, globals }) => {
    const french = canvas.getByRole('button', { name: 'FR, afficher en français' });
    const english = canvas.getByRole('button', { name: 'EN, display in English' });

    await userEvent.tab();
    await expect(french).toHaveFocus();
    await userEvent.tab();
    await expect(english).toHaveFocus();
    await waitFor(() => expect(english).toHaveStyle({ backgroundSize: 'calc(100% - 16px) 1px' }));
    await userEvent.keyboard(' ');
    await waitFor(async () => {
      await expect(english).toHaveAttribute('aria-pressed', 'true');
      await expect(french).toHaveAttribute('aria-pressed', 'false');
    });
    await expect(english).toHaveFocus();

    await userEvent.tab({ shift: true });
    await userEvent.keyboard('{Enter}');
    await waitFor(async () => {
      await expect(french).toHaveAttribute('aria-pressed', 'true');
      await expect(english).toHaveAttribute('aria-pressed', 'false');
    });
    await expect(french).toHaveFocus();

    if (globals['locale'] === 'en') {
      await userEvent.click(english);
    }
  },
};
