import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

import { ProjectResourceLink } from './project-resource-link/project-resource-link';

const PROJECT_RESOURCES = [
  { label: 'GitHub', href: 'https://github.com/JeremieDrazic/creation' },
  { label: 'Storybook', href: 'https://creation.jerem.io/design-system/' },
  { label: 'Documentation', href: 'https://creation.jerem.io/docs/' },
] as const;

const styles = stylex.create({
  list: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.25rem',
    listStyleType: 'none',
    margin: 0,
    padding: 0,
  },
});

export function ProjectResourceLinks() {
  const { t } = useTranslation('intro', { keyPrefix: 'projectResources' });

  return (
    <nav aria-label={t('navigationLabel')}>
      <ul {...stylex.props(styles.list)}>
        {PROJECT_RESOURCES.map(({ label, href }) => (
          <li key={href}>
            <ProjectResourceLink
              href={href}
              label={label}
              accessibleLabel={t('linkLabel', { label })}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
