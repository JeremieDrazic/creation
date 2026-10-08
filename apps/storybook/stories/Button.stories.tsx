import { Button } from '@creation/ui/button';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Laisser danser' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
