import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { expect } from 'storybook/test';

import '../intro-ui.css';
import { IntroVerse } from './intro-verse';

const styles = stylex.create({
  backdrop: {
    minHeight: '28rem',
    height: 'calc(100svh - 6rem)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#03090e',
    backgroundImage: 'radial-gradient(ellipse at 85% 35%, #173344 0%, #08141d 32%, #03090e 68%)',
    color: '#f2eee4',
    fontFamily: '"Creation Cormorant Study", serif',
    fontWeight: 300,
    paddingBlockStart: 'clamp(1.5rem, 3vw, 3rem)',
    paddingBlockEnd: 'clamp(1.5rem, 3vw, 3rem)',
    paddingInlineStart: 'calc(clamp(1.5rem, 3vw, 3rem) + clamp(0rem, 5vw, 4.5rem))',
    paddingInlineEnd: 'clamp(1.5rem, 3vw, 3rem)',
  },
});

const meta = {
  title: 'Experiences/Intro/IntroVerse',
  component: IntroVerse,
  loaders: [
    async () => {
      await document.fonts.load('300 48px "Creation Cormorant Study"');
      return {};
    },
  ],
  decorators: [
    (Story) => (
      <div {...stylex.props(styles.backdrop)}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IntroVerse>;

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
    await expect(
      canvas.getByText(isEnglish ? 'Genesis 1:3 · NIV' : 'Genèse 1:3 · BDS')
    ).toBeVisible();
    await expect(canvas.getByRole('figure')).toHaveAttribute('lang', isEnglish ? 'en' : 'fr');
    await expect(canvas.getByRole('blockquote')).toHaveStyle({
      fontFamily: '"Creation Cormorant Study", serif',
      fontWeight: '300',
    });
  },
};
