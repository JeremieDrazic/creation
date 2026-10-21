import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import type { MouseEvent } from 'react';
import { expect, fn, within } from 'storybook/test';

import { IntroUi } from './intro-ui';

const styles = stylex.create({
  frame: { minHeight: '28rem', height: 'calc(100svh - 6rem)', backgroundColor: '#03090e' },
  illuminated: {
    backgroundImage: 'radial-gradient(ellipse at 85% 35%, #173344 0%, #08141d 32%, #03090e 68%)',
  },
});

const meta = {
  title: 'Experiences/Intro/IntroUi',
  component: IntroUi,
  parameters: {
    docs: {
      description: {
        component:
          'Static bilingual composition study with local candidate colors and Cormorant Light 300. The language controls and toolbar stay synchronized. No GPU veil or audio playback is implemented.',
      },
    },
  },
  loaders: [
    async () => {
      await document.fonts.load('300 48px "Creation Cormorant Study"');
      return {};
    },
  ],
  decorators: [
    (Story, context) => (
      <div
        {...stylex.props(
          styles.frame,
          context.parameters['illuminated'] === true && styles.illuminated
        )}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    isSoundEnabled: false,
    onRequestSound: fn(),
    onDiscoverFireflies: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
  },
} satisfies Meta<typeof IntroUi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, globals }) => {
    const isEnglish = globals['locale'] === 'en';

    await expect(canvas.getByRole('blockquote')).toHaveTextContent(
      isEnglish
        ? 'And God said, “Let there be light,” and there was light.'
        : 'Et Dieu dit alors : Que la lumière soit ! Et la lumière fut.'
    );
    await expect(canvas.getByRole('blockquote')).toHaveStyle({
      fontFamily: '"Creation Cormorant Study", serif',
      fontWeight: '300',
    });
    await expect(canvas.getByRole('button', { name: isEnglish ? 'Sound' : 'Son' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    await expect(
      canvas.getByRole('link', { name: isEnglish ? 'Discover Fireflies' : 'Découvrir Fireflies' })
    ).toHaveAttribute('href', '/fireflies');
    const resources = within(
      canvas.getByRole('navigation', {
        name: isEnglish ? 'Project resources' : 'Ressources du projet',
      })
    );
    const newTabLabel = isEnglish ? 'new tab' : 'nouvel onglet';

    await expect(resources.getByRole('link', { name: `GitHub, ${newTabLabel}` })).toHaveAttribute(
      'href',
      'https://github.com/JeremieDrazic/creation'
    );
    await expect(
      resources.getByRole('link', { name: `Storybook, ${newTabLabel}` })
    ).toHaveAttribute('href', 'https://creation.jerem.io/design-system/');
    await expect(
      resources.getByRole('link', { name: `Documentation, ${newTabLabel}` })
    ).toHaveAttribute('href', 'https://creation.jerem.io/docs/');
  },
};

export const IlluminatedBackdrop: Story = {
  parameters: { illuminated: true },
};

/** Interaction checks stay out of the browsable composition previews. */
export const KeyboardAndActions: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, args, globals }) => {
    const isEnglish = globals['locale'] === 'en';

    await userEvent.tab();
    await expect(
      canvas.getByRole('link', { name: isEnglish ? 'Creation, home' : 'Creation, accueil' })
    ).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'FR, afficher en français' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'EN, display in English' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: isEnglish ? 'Sound' : 'Son' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(args.onRequestSound).toHaveBeenCalledOnce();
    for (const label of ['GitHub', 'Storybook', 'Documentation']) {
      await userEvent.tab();
      const resource = canvas.getByRole('link', {
        name: `${label}, ${isEnglish ? 'new tab' : 'nouvel onglet'}`,
      });
      await expect(resource).toHaveFocus();
      await expect(resource).toHaveAttribute('target', '_blank');
      await expect(resource).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await userEvent.tab();
    await expect(
      canvas.getByRole('link', { name: isEnglish ? 'Discover Fireflies' : 'Découvrir Fireflies' })
    ).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDiscoverFireflies).toHaveBeenCalledOnce();
  },
};
