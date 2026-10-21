import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, waitFor } from 'storybook/test';

import { SoundToggle } from './sound-toggle';

const meta = {
  title: 'Experiences/Intro/SoundToggle',
  component: SoundToggle,
  args: { isSoundEnabled: false, onToggleSound: fn() },
  // The interactive preview owns this state; changing it uses the button itself.
  argTypes: { isSoundEnabled: { control: false } },
  render: function InteractiveSoundToggle(args) {
    const [isSoundEnabled, setSoundEnabled] = useState(args.isSoundEnabled);

    function toggleSound() {
      setSoundEnabled((wasSoundEnabled) => !wasSoundEnabled);
      args.onToggleSound();
    }

    return <SoundToggle isSoundEnabled={isSoundEnabled} onToggleSound={toggleSound} />;
  },
} satisfies Meta<typeof SoundToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Local visual state only; persistence belongs to the dedicated sound PR. */
export const Default: Story = {};

/** Automated actions stay out of the browsable preview. No real storage or audio is used. */
export const KeyboardAndState: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, args, globals }) => {
    const isEnglish = globals['locale'] === 'en';
    const button = canvas.getByRole('button', { name: isEnglish ? 'Sound' : 'Son' });

    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(button).toHaveTextContent(isEnglish ? 'Sound off' : 'Son désactivé');
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(async () => {
      await expect(button).toHaveAttribute('aria-pressed', 'true');
    });
    await expect(button).toHaveTextContent(isEnglish ? 'Sound on' : 'Son activé');
    await expect(button).toHaveAccessibleName(isEnglish ? 'Sound' : 'Son');
    await userEvent.keyboard(' ');
    await waitFor(async () => {
      await expect(button).toHaveAttribute('aria-pressed', 'false');
    });
    await expect(args.onToggleSound).toHaveBeenCalledTimes(2);
    await expect(button).toHaveFocus();
  },
};
