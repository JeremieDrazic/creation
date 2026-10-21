import { afterEach, expect, test, vi } from 'vitest';

function prepareBrowser(savedLanguage: string | null, browserLanguages: string[]) {
  const storage = {
    getItem: vi.fn(() => savedLanguage),
    setItem: vi.fn(),
  };

  vi.resetModules();
  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('navigator', { languages: browserLanguages });

  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test.each([
  { saved: 'fr', browser: ['en-US'], expected: 'fr' },
  { saved: 'en', browser: ['fr-FR'], expected: 'en' },
  { saved: null, browser: ['de-DE', 'fr-FR'], expected: 'fr' },
  { saved: null, browser: ['en-US'], expected: 'en' },
  { saved: null, browser: ['de-DE'], expected: 'en' },
  { saved: 'invalid', browser: ['fr-FR'], expected: 'fr' },
])(
  'initializes $expected for saved=$saved and browser=$browser',
  async ({ saved, browser, expected }) => {
    const storage = prepareBrowser(saved, browser);
    const { i18n } = await import('./i18n');

    expect(i18n.resolvedLanguage).toBe(expected);
    expect(storage.setItem).not.toHaveBeenCalled();
  }
);

test('saves explicit changes in both directions', async () => {
  const storage = prepareBrowser(null, ['fr-FR']);
  const { i18n } = await import('./i18n');

  await i18n.changeLanguage('en');
  expect(storage.setItem).toHaveBeenLastCalledWith('creation.language-preference', 'en');

  await i18n.changeLanguage('fr');
  expect(storage.setItem).toHaveBeenLastCalledWith('creation.language-preference', 'fr');
});

test('does not save Storybook clone initialization or toolbar changes', async () => {
  const storage = prepareBrowser(null, ['fr-FR']);
  const { i18n } = await import('./i18n');
  const previewI18n = i18n.cloneInstance({ lng: 'en', initAsync: false });

  await previewI18n.changeLanguage('fr');

  expect(storage.setItem).not.toHaveBeenCalled();
  expect(i18n.resolvedLanguage).toBe('fr');
});

test('uses browser preferences if localStorage access is refused', async () => {
  prepareBrowser(null, ['fr-FR']);
  const error = new Error('Storage access refused.');
  Object.defineProperty(window, 'localStorage', {
    get() {
      throw error;
    },
  });
  const reportError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { i18n } = await import('./i18n');

  expect(i18n.resolvedLanguage).toBe('fr');
  expect(reportError).toHaveBeenCalledWith('LANGUAGE_PREFERENCE_READ_FAILED', error);
});

test('keeps a changed language usable if saving fails', async () => {
  const storage = prepareBrowser(null, ['fr-FR']);
  const error = new Error('Storage write refused.');
  storage.setItem.mockImplementation(() => {
    throw error;
  });
  const reportError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { i18n } = await import('./i18n');

  await expect(i18n.changeLanguage('en')).resolves.toBeTypeOf('function');
  expect(i18n.resolvedLanguage).toBe('en');
  expect(reportError).toHaveBeenCalledWith('LANGUAGE_PREFERENCE_WRITE_FAILED', error);
});
