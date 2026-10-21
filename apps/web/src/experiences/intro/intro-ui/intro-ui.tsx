import * as stylex from '@stylexjs/stylex';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import { CreationIdentity } from './creation-identity/creation-identity';
import { ExperienceLink } from './experience-link/experience-link';
import { IntroVerse } from './intro-verse/intro-verse';
import { LanguageSwitcher } from './language-switcher/language-switcher';
import { ProjectResourceLinks } from './project-resource-links/project-resource-links';
import { SoundToggle } from './sound-toggle/sound-toggle';
import './intro-ui.css';

export type IntroUiProps = Readonly<{
  isSoundEnabled?: boolean;
  onRequestSound?: () => void;
  onDiscoverFireflies?: MouseEventHandler<HTMLAnchorElement>;
  onReturnHome?: MouseEventHandler<HTMLAnchorElement>;
}>;

// Study values remain local until composition/type/contrast review; no shared token changes yet.
const styles = stylex.create({
  surface: {
    width: '100%',
    height: '100%',
    minHeight: '28rem',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto',
    paddingBlockStart: 'clamp(1.5rem, 3vw, 3rem)',
    paddingBlockEnd: 'clamp(1.5rem, 3vw, 3rem)',
    paddingInlineStart: 'clamp(1.5rem, 3vw, 3rem)',
    paddingInlineEnd: 'clamp(1.5rem, 3vw, 3rem)',
    color: '#f2eee4',
    fontFamily: '"Creation Cormorant Study", serif',
    fontWeight: 300,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' },
  verseArea: {
    display: 'flex',
    alignItems: 'center',
    paddingBlockStart: 'clamp(1.5rem, 4vh, 4rem)',
    paddingBlockEnd: 'clamp(1.5rem, 4vh, 4rem)',
    paddingInlineStart: 'clamp(0rem, 5vw, 4.5rem)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  footerUtilities: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  discover: {
    marginInlineStart: 'auto',
    display: 'flex',
  },
});

/** Intro composition; the caller supplies routing and, when available, sound controls. */
export function IntroUi({
  isSoundEnabled,
  onRequestSound,
  onDiscoverFireflies,
  onReturnHome,
}: IntroUiProps) {
  const { t, i18n } = useTranslation('intro');

  return (
    <section
      lang={i18n.resolvedLanguage}
      aria-label={t('introductionLabel')}
      {...stylex.props(styles.surface)}
    >
      <header {...stylex.props(styles.header)}>
        <CreationIdentity onClick={onReturnHome} />
        <LanguageSwitcher />
      </header>
      <div {...stylex.props(styles.verseArea)}>
        <IntroVerse />
      </div>
      <footer {...stylex.props(styles.footer)}>
        <div {...stylex.props(styles.footerUtilities)}>
          {isSoundEnabled !== undefined && onRequestSound !== undefined && (
            <SoundToggle isSoundEnabled={isSoundEnabled} onToggleSound={onRequestSound} />
          )}
          <ProjectResourceLinks />
        </div>
        <div {...stylex.props(styles.discover)}>
          <ExperienceLink href="/fireflies" onClick={onDiscoverFireflies}>
            {t('discoverFireflies')}
          </ExperienceLink>
        </div>
      </footer>
    </section>
  );
}
