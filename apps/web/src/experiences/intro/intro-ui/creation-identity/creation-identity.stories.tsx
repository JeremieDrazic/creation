import type { Meta, StoryObj } from '@storybook/react';
import type { MouseEvent } from 'react';
import { expect, fn } from 'storybook/test';

import '../intro-ui.css';
import { CreationIdentity } from './creation-identity';

const meta = {
  title: 'Experiences/Intro/CreationIdentity',
  component: CreationIdentity,
  args: {
    onClick: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
  },
  loaders: [
    async () => {
      await document.fonts.load('300 48px "Creation Cormorant Study"');
      return {};
    },
  ],
} satisfies Meta<typeof CreationIdentity>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, globals }) => {
    const link = canvas.getByRole('link', {
      name: globals['locale'] === 'en' ? 'Creation, home' : 'Creation, accueil',
    });

    await expect(link).toHaveTextContent('Creation');
    await expect(link).toHaveAttribute('href', '/');
    await expect(link).toHaveStyle({
      fontFamily: '"Creation Cormorant Study", serif',
      fontWeight: '300',
    });
  },
};

/** Native navigation is prevented in the preview; activation runs only in automated tests. */
export const KeyboardAndAction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, args, globals }) => {
    const link = canvas.getByRole('link', {
      name: globals['locale'] === 'en' ? 'Creation, home' : 'Creation, accueil',
    });

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveStyle({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: 'rgb(224, 204, 157)',
    });
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
