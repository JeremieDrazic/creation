import { afterEach, expect, test, vi } from 'vitest';

import { createSettingsControls } from '@creation/data-gui/create-settings-controls';

import { experienceControlsStore, registerExperienceControls } from './experience-controls';

function source(id: string) {
  return createSettingsControls({
    id,
    titleKey: id,
    defaults: { scale: 1 },
    fields: [{ property: 'scale', labelKey: 'scale', min: 0.1, max: 4, step: 0.1 }],
    onChange: vi.fn(),
  });
}

afterEach(() => experienceControlsStore.setState({ source: null }));

test('publishes an experience binding and removes it on release', () => {
  const intro = source('intro');
  const release = registerExperienceControls(intro);
  expect(experienceControlsStore.getState().source).toBe(intro);
  release();
  release();
  expect(experienceControlsStore.getState().source).toBeNull();
});

test('late cleanup cannot remove the next experience controls', () => {
  const releaseIntro = registerExperienceControls(source('intro'));
  const next = source('fireflies');
  const releaseNext = registerExperienceControls(next);
  releaseIntro();
  expect(experienceControlsStore.getState().source).toBe(next);
  releaseNext();
  expect(experienceControlsStore.getState().source).toBeNull();
});
