import type { Meta, StoryObj } from '@storybook/react';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { expect, fn, waitFor } from 'storybook/test';

import '../intro-ui.css';
import { ExperienceLink } from './experience-link';

function readArrowOffset(arrow: SVGSVGElement): number {
  const transform = getComputedStyle(arrow).transform;

  return transform === 'none' ? 0 : new DOMMatrix(transform).m41;
}

const meta = {
  title: 'Experiences/Intro/ExperienceLink',
  component: ExperienceLink,
  args: {
    href: '/fireflies',
    children: 'Discover Fireflies',
    onClick: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
  },
  // The locale toolbar supplies the label in this preview.
  argTypes: { children: { control: false } },
  loaders: [
    async () => {
      await document.fonts.load('300 24px "Creation Cormorant Study"');
      return {};
    },
  ],
  render: function LocalizedExperienceLink(args) {
    const { t } = useTranslation('intro');

    return <ExperienceLink {...args}>{t('discoverFireflies')}</ExperienceLink>;
  },
} satisfies Meta<typeof ExperienceLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, globals }) => {
    const link = canvas.getByRole('link', {
      name: globals['locale'] === 'en' ? 'Discover Fireflies' : 'Découvrir Fireflies',
    });

    await expect(link).toHaveAttribute('href', '/fireflies');
    await expect(link).toHaveStyle({
      fontFamily: '"Creation Cormorant Study", serif',
      fontWeight: '300',
    });
  },
};

/** Navigation is prevented in this preview; automated activation stays out of the visual story. */
export const KeyboardAndAction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, args, globals }) => {
    const link = canvas.getByRole('link', {
      name: globals['locale'] === 'en' ? 'Discover Fireflies' : 'Découvrir Fireflies',
    });

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link).toHaveStyle({
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: 'rgb(224, 204, 157)',
    });
    const arrow = link.querySelector('svg');
    await expect(arrow).not.toBeNull();

    if (arrow !== null) {
      await waitFor(() => expect(Math.abs(readArrowOffset(arrow))).toBeGreaterThan(0));
    }

    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
    await expect(link).toHaveFocus();
  },
};

export const ArrowMotion: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent, globals }) => {
    const label = globals['locale'] === 'en' ? 'Discover Fireflies' : 'Découvrir Fireflies';
    const link = canvas.getByRole('link', { name: label });
    const text = canvas.getByText(label);
    const initialTextPosition = text.getBoundingClientRect();
    const arrow = link.querySelector('svg');
    await expect(arrow).not.toBeNull();

    if (arrow === null) {
      return;
    }

    await expect(arrow.parentElement).toHaveStyle({ overflow: 'hidden', width: '26px' });
    await userEvent.hover(link);
    await waitFor(() => expect(readArrowOffset(arrow)).toBeGreaterThan(0));
    await expect(text.getBoundingClientRect()).toMatchObject({
      x: initialTextPosition.x,
      y: initialTextPosition.y,
      width: initialTextPosition.width,
      height: initialTextPosition.height,
    });
    await waitFor(() => expect(readArrowOffset(arrow)).toBeLessThan(0));
    await waitFor(() => expect(readArrowOffset(arrow)).toBeCloseTo(0, 3));
    await expect(text.getBoundingClientRect()).toMatchObject({
      x: initialTextPosition.x,
      y: initialTextPosition.y,
      width: initialTextPosition.width,
      height: initialTextPosition.height,
    });
  },
};

export const MotionCleanup: Story = {
  tags: ['!dev', '!autodocs'],
  render: function UnmountableExperienceLink(args) {
    const [isMounted, setMounted] = useState(true);
    const { t } = useTranslation('intro');

    return (
      <>
        <button type="button" onClick={() => setMounted(false)}>
          Unmount link
        </button>
        {isMounted && <ExperienceLink {...args}>{t('discoverFireflies')}</ExperienceLink>}
      </>
    );
  },
  play: async ({ canvas, userEvent, globals, parameters }) => {
    const link = canvas.getByRole('link', {
      name: globals['locale'] === 'en' ? 'Discover Fireflies' : 'Découvrir Fireflies',
    });
    const arrow = link.querySelector('svg');
    await expect(arrow).not.toBeNull();

    if (arrow === null) {
      return;
    }

    await userEvent.hover(link);
    await waitFor(() => expect(readArrowOffset(arrow)).toBeGreaterThan(0));

    if (parameters['finishMotionBeforeUnmount'] === true) {
      await waitFor(() => expect(readArrowOffset(arrow)).toBeLessThan(0));
      await waitFor(() => expect(readArrowOffset(arrow)).toBeCloseTo(0, 3));
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Unmount link' }));
    await expect(link).not.toBeInTheDocument();
    await expect(arrow.style.transform).toBe('');
    await expect(arrow.getAttribute('transform')).toBeNull();
  },
};

export const CompletedMotionCleanup: Story = {
  ...MotionCleanup,
  tags: ['!dev', '!autodocs'],
  parameters: { finishMotionBeforeUnmount: true },
};
