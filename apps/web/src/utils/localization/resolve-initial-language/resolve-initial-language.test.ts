import { expect, test } from 'vitest';

import { resolveInitialLanguage } from './resolve-initial-language';

test.each([
  { saved: 'fr', browser: ['en-US'], expected: 'fr' },
  { saved: 'en', browser: ['fr-FR'], expected: 'en' },
])('prefers the saved $saved choice over browser languages', ({ saved, browser, expected }) => {
  expect(resolveInitialLanguage(saved, browser)).toBe(expected);
});

test.each([
  { browser: ['fr-FR'], expected: 'fr' },
  { browser: ['fr-CA'], expected: 'fr' },
  { browser: ['en-US'], expected: 'en' },
  { browser: ['en-GB'], expected: 'en' },
  { browser: ['FR-fr'], expected: 'fr' },
  { browser: ['de-DE', 'fr-FR', 'en-US'], expected: 'fr' },
  { browser: ['en-US', 'fr-FR'], expected: 'en' },
])('uses the first supported browser preference from $browser', ({ browser, expected }) => {
  expect(resolveInitialLanguage(null, browser)).toBe(expected);
});

test.each(['', 'de', 'null', '{invalid'])('ignores an unsupported saved value %j', (saved) => {
  expect(resolveInitialLanguage(saved, ['fr-FR'])).toBe('fr');
});

test.each([{ browser: [] }, { browser: ['de-DE'] }, { browser: ['es-ES', 'ja-JP'] }])(
  'defaults to English when no language is supported in $browser',
  ({ browser }) => {
    expect(resolveInitialLanguage(null, browser)).toBe('en');
  }
);
