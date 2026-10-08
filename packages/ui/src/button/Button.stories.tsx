import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Laisser danser', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Laisser danser' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button).toHaveStyle({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '5px',
    });
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole('button', { name: 'Laisser danser' });
    await expect(button).toBeDisabled();
    await expect(button).toHaveStyle({ opacity: '0.45' });
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
