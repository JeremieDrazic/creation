import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { ProjectResourceLinks } from './project-resource-links';

const meta = {
  title: 'Experiences/Intro/ProjectResourceLinks',
  component: ProjectResourceLinks,
} satisfies Meta<typeof ProjectResourceLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

function getUnderline(link: HTMLElement): HTMLElement {
  const underline = link.querySelector<HTMLElement>('span[aria-hidden="true"]');

  if (underline === null) {
    throw new Error('MISSING_RESOURCE_UNDERLINE');
  }

  return underline;
}

function readScale(underline: HTMLElement): number {
  const transform = getComputedStyle(underline).transform;

  return transform === 'none' ? 1 : new DOMMatrix(transform).m11;
}

function readOrigin(underline: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(underline).transformOrigin);
}

export const Default: Story = {
  play: async ({ canvas, globals }) => {
    const isEnglish = globals['locale'] === 'en';
    const navigation = canvas.getByRole('navigation', {
      name: isEnglish ? 'Project resources' : 'Ressources du projet',
    });
    const resources = within(navigation);

    await expect(resources.getAllByRole('link')).toHaveLength(3);

    for (const [label, href] of [
      ['GitHub', 'https://github.com/JeremieDrazic/creation'],
      ['Storybook', 'https://creation.jerem.io/design-system/'],
      ['Documentation', 'https://creation.jerem.io/docs/'],
    ]) {
      const link = resources.getByRole('link', {
        name: `${label}, ${isEnglish ? 'new tab' : 'nouvel onglet'}`,
      });

      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', href);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  },
};

/** Exercises focus direction without following an external destination. */
export const UnderlineKeyboard: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getAllByRole('link')[0];

    if (link === undefined) {
      throw new Error('MISSING_PROJECT_RESOURCE_LINK');
    }

    const initialBounds = link.getBoundingClientRect();
    const underline = getUnderline(link);
    await waitFor(() => expect(readScale(underline)).toBe(0));

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await waitFor(() => expect(readScale(underline)).toBeGreaterThan(0));
    await expect(readOrigin(underline)).toBe(0);
    await expect(link).toHaveStyle({ outlineColor: 'rgb(224, 204, 157)' });
    await expect(link.getBoundingClientRect()).toMatchObject({
      x: initialBounds.x,
      y: initialBounds.y,
      width: initialBounds.width,
      height: initialBounds.height,
    });
    // The pass finishes even while the link keeps keyboard focus.
    await waitFor(() => expect(readScale(underline)).toBe(0));
    await expect(link).toHaveFocus();

    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await expect(link).toHaveFocus();
    await waitFor(() => expect(readScale(underline)).toBeGreaterThan(0));
    await expect(readOrigin(underline)).toBeCloseTo(
      Number.parseFloat(getComputedStyle(underline).width),
      1
    );
    await waitFor(() => expect(readScale(underline)).toBe(0));
  },
};

export const UnderlineSinglePass: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const link = canvas.getAllByRole('link')[0];

    if (link === undefined) {
      throw new Error('MISSING_PROJECT_RESOURCE_LINK');
    }

    const underline = getUnderline(link);
    const bounds = link.getBoundingClientRect();

    link.dispatchEvent(new PointerEvent('pointerenter', { clientX: bounds.left }));
    await waitFor(() => expect(readScale(underline)).toBeGreaterThan(0));
    await expect(readOrigin(underline)).toBe(0);

    const currentTransform = underline.style.transform;
    link.dispatchEvent(new PointerEvent('pointerleave', { clientX: bounds.right }));
    link.dispatchEvent(new PointerEvent('pointerenter', { clientX: bounds.right }));
    // Re-entry must neither restart the pass nor change its chosen direction.
    await expect(underline.style.transform).toBe(currentTransform);
    await expect(readOrigin(underline)).toBe(0);
    await waitFor(() => expect(readScale(underline)).toBe(0));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await expect(readScale(underline)).toBe(0);

    // A later entry may start a new pass from the other side.
    link.dispatchEvent(new PointerEvent('pointerleave', { clientX: bounds.right }));
    link.dispatchEvent(new PointerEvent('pointerenter', { clientX: bounds.right }));
    await waitFor(() => expect(readScale(underline)).toBeGreaterThan(0));
    await expect(readOrigin(underline)).toBeCloseTo(
      Number.parseFloat(getComputedStyle(underline).width),
      1
    );
    await waitFor(() => expect(readScale(underline)).toBe(0));
  },
};

export const UnderlineCleanup: Story = {
  tags: ['!dev', '!autodocs'],
  render: function UnmountableResources() {
    const [isMounted, setMounted] = useState(true);

    return (
      <>
        <button type="button" onClick={() => setMounted(false)}>
          Unmount resources
        </button>
        {isMounted && <ProjectResourceLinks />}
      </>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getAllByRole('link')[0];

    if (link === undefined) {
      throw new Error('MISSING_PROJECT_RESOURCE_LINK');
    }

    const underline = getUnderline(link);
    await userEvent.hover(link);
    await waitFor(() => expect(readScale(underline)).toBeGreaterThan(0));
    await userEvent.click(canvas.getByRole('button', { name: 'Unmount resources' }));
    await expect(link).not.toBeInTheDocument();
    await expect(underline.style.transform).toBe('');
    await expect(underline.style.transformOrigin).toBe('');

    // Neither a detached input listener nor a surviving tween should paint again.
    link.dispatchEvent(new PointerEvent('pointerenter', { clientX: 0 }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await expect(underline.style.transform).toBe('');
    await expect(underline.style.transformOrigin).toBe('');
  },
};
