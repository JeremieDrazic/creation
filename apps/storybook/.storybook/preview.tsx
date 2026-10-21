import type { Preview } from '@storybook/react-vite';
import * as stylex from '@stylexjs/stylex';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the preview i18n instance with the Storybook locale toolbar and releases its listener.
import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useGlobals } from 'storybook/preview-api';

import { colors } from '@creation/design-tokens/colors.stylex';
import '@creation/ui/global.css';

import { i18n } from '../../web/src/utils/localization/i18n';

const styles = stylex.create({
  stage: {
    backgroundColor: '#03090e',
    color: colors.foreground,
    minHeight: '100vh',
    padding: '3rem',
  },
});

type LocalizedPreviewProps = Readonly<{
  locale: 'fr' | 'en';
  onLanguageChange: (language: string) => void;
  children: ReactNode;
}>;

function LocalizedPreview({ locale, onLanguageChange, children }: LocalizedPreviewProps) {
  // Each preview owns its instance; changing the toolbar starts in the requested language.
  const previewI18n = useMemo(
    () => i18n.cloneInstance({ lng: locale, initAsync: false }),
    [locale]
  );

  useEffect(() => {
    previewI18n.on('languageChanged', onLanguageChange);

    return () => {
      previewI18n.off('languageChanged', onLanguageChange);
    };
  }, [previewI18n, onLanguageChange]);

  return (
    <div lang={locale} {...stylex.props(styles.stage)}>
      <I18nextProvider i18n={previewI18n}>{children}</I18nextProvider>
    </div>
  );
}

const preview: Preview = {
  globalTypes: {
    locale: {
      description: 'Preview language',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        dynamicTitle: true,
        items: [
          { value: 'fr', title: 'FR' },
          { value: 'en', title: 'EN' },
        ],
      },
    },
  },
  initialGlobals: { locale: 'fr' },
  decorators: [
    (Story, context) => {
      const [, updateGlobals] = useGlobals();

      function updatePreviewLanguage(language: string) {
        if (language === 'fr' || language === 'en') {
          updateGlobals({ locale: language });
        }
      }

      return (
        <LocalizedPreview
          locale={context.globals['locale'] === 'en' ? 'en' : 'fr'}
          onLanguageChange={updatePreviewLanguage}
        >
          <Story />
        </LocalizedPreview>
      );
    },
  ],
  parameters: { layout: 'fullscreen', a11y: { test: 'error' } },
};

export default preview;
