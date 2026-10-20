import * as stylex from '@stylexjs/stylex';
import { Link, Outlet } from '@tanstack/react-router';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the external document language with the active translation instance.
import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';

import { colors } from '@creation/design-tokens/colors.stylex';
import { Button } from '@creation/ui/button';

import { DEFAULT_LANGUAGE } from '../localization/i18n';
import { createRenderingRuntimeStore } from '../runtime/rendering-runtime-store/rendering-runtime-store';
import type { CreationExperiencePreparationOptions } from '../types';

// Temporary validation settings; production quality/time limits remain to be selected.
const MAX_VALIDATION_PIXEL_RATIO = 2;
const MAX_VALIDATION_FRAME_DELTA_SECONDS = 0.05;

const DevelopmentRenderingCanvas = import.meta.env.DEV
  ? lazy(async () => {
      const { RenderingCanvas } = await import('../runtime/rendering-canvas/rendering-canvas');
      return { default: RenderingCanvas };
    })
  : null;

async function prepareValidationExperience(options: CreationExperiencePreparationOptions) {
  const { RenderingProbeCreation } = await import('../rendering-probe/rendering-probe-creation');
  return RenderingProbeCreation.prepare(options);
}

function readValidationPixelRatio(): number {
  return Math.min(window.devicePixelRatio, MAX_VALIDATION_PIXEL_RATIO);
}

function reportRenderingError(error: unknown): void {
  console.error('Rendering validation failed', error);
}

const styles = stylex.create({
  shell: {
    minHeight: '100svh',
    backgroundColor: colors.background,
    color: colors.foreground,
    display: 'flex',
    flexDirection: 'column',
    paddingBlockStart: 'clamp(1.5rem, 4vw, 4rem)',
    paddingBlockEnd: 'clamp(1.5rem, 4vw, 4rem)',
    paddingInlineStart: 'clamp(1.5rem, 4vw, 4rem)',
    paddingInlineEnd: 'clamp(1.5rem, 4vw, 4rem)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  brand: {
    color: 'inherit',
    fontFamily: 'Georgia, serif',
    fontWeight: 400,
    fontSize: '2.5rem',
    textDecoration: 'none',
  },
  main: {
    flexGrow: 1,
    display: 'grid',
    placeItems: 'center',
    paddingBlock: '4rem',
    textAlign: 'center',
  },
  navigation: { display: 'flex', gap: '2rem', color: colors.muted },
  link: { color: 'inherit', textUnderlineOffset: '0.3em' },
  validation: { marginBlockStart: '2rem' },
  validationViewport: { height: '40svh', backgroundColor: '#000000' },
});

/** Persistent DOM shell; route changes replace only its outlet. */
export function Shell() {
  const { t, i18n } = useTranslation();
  const [renderingStore] = useState(createRenderingRuntimeStore);
  const renderingStatus = useStore(renderingStore.statusStore);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? DEFAULT_LANGUAGE;
  }, [i18n.resolvedLanguage]);

  return (
    <div {...stylex.props(styles.shell)}>
      <header {...stylex.props(styles.header)}>
        <Link to="/" {...stylex.props(styles.brand)}>
          creation
        </Link>
        <Button
          onClick={() => {
            void i18n.changeLanguage(i18n.resolvedLanguage === 'fr' ? 'en' : 'fr');
          }}
        >
          {t('language')}
        </Button>
      </header>
      {DevelopmentRenderingCanvas !== null && (
        <aside aria-label="Temporary rendering validation" {...stylex.props(styles.validation)}>
          <p>Temporary rendering validation — static triangle</p>
          <output aria-label="Rendering status">{renderingStatus.status}</output>
          <div {...stylex.props(styles.validationViewport)}>
            <Suspense fallback={null}>
              <DevelopmentRenderingCanvas
                prepareInitialExperience={prepareValidationExperience}
                readPixelRatio={readValidationPixelRatio}
                maxDeltaSeconds={MAX_VALIDATION_FRAME_DELTA_SECONDS}
                publishStatus={renderingStore.publishStatus}
                onError={reportRenderingError}
              />
            </Suspense>
          </div>
        </aside>
      )}
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
      <nav aria-label={t('home')} {...stylex.props(styles.navigation)}>
        <Link to="/" {...stylex.props(styles.link)}>
          {t('home')}
        </Link>
        <Link to="/fireflies" {...stylex.props(styles.link)}>
          {t('fireflies')}
        </Link>
      </nav>
    </div>
  );
}

/** Localized fallback retaining the shell's return navigation. */
export function NotFound() {
  const { t } = useTranslation();
  return <h1>{t('notFound')}</h1>;
}
