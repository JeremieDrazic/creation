import type { Meta, StoryObj } from '@storybook/react';
import { useTranslation } from 'react-i18next';
import { expect } from 'storybook/test';

import { ProjectResourceLink } from './project-resource-link';

const meta = {
  title: 'Experiences/Intro/ProjectResourceLink',
  component: ProjectResourceLink,
  args: {
    href: 'https://github.com/JeremieDrazic/creation',
    label: 'GitHub',
    accessibleLabel: 'GitHub, new tab',
  },
  argTypes: { accessibleLabel: { control: false } },
  render: function LocalizedResourceLink(args) {
    const { t } = useTranslation('intro', { keyPrefix: 'projectResources' });

    return (
      <ProjectResourceLink {...args} accessibleLabel={t('linkLabel', { label: args.label })} />
    );
  },
} satisfies Meta<typeof ProjectResourceLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover from either side or use Tab/Shift+Tab to preview one complete underline pass. */
export const Default: Story = {
  play: async ({ canvas, globals, args }) => {
    const link = canvas.getByRole('link', {
      name: `${args.label}, ${globals['locale'] === 'en' ? 'new tab' : 'nouvel onglet'}`,
    });

    await expect(link).toHaveTextContent(args.label);
    await expect(link).toHaveAttribute('href', args.href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  },
};
