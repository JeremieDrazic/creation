import { expect, test, vi } from 'vitest';

import { createSettingsControls } from './create-settings-controls';

function fixture() {
  const onChange = vi.fn();
  const source = createSettingsControls({
    id: 'intro',
    titleKey: 'veil',
    defaults: { scale: 1, angle: 0 },
    fields: [
      { property: 'scale', labelKey: 'scale', min: 0.1, max: 4, step: 0.1 },
      { property: 'angle', labelKey: 'angle', min: -90, max: 90, step: 1 },
    ],
    onChange,
  });
  return { source, onChange };
}

test('applies copied values, notifies subscribers and resets without changing the defaults', () => {
  const { source, onChange } = fixture();
  const listener = vi.fn();
  const unsubscribe = source.subscribe(listener);
  const input = { scale: 2, angle: 25 };
  source.applySettings(input);
  input.scale = 3;
  expect(source.getSettings()).toEqual({ scale: 2, angle: 25 });
  expect(onChange).toHaveBeenCalledExactlyOnceWith({ scale: 2, angle: 25 });
  source.reset();
  expect(source.getSettings()).toEqual({ scale: 1, angle: 0 });
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
  source.reset();
  expect(listener).toHaveBeenCalledTimes(2);
  const snapshot = source.getSettings();
  expect(snapshot).not.toBe(source.getSettings());
});

test.each([
  null,
  [],
  { scale: 2 },
  { scale: 2, angle: 0, extra: 1 },
  { scale: 2, angle: 91 },
  { scale: 0, angle: 0 },
  { scale: 2, angle: Number.NaN },
])('rejects incompatible imported settings before changing state: %j', (value) => {
  const { source, onChange } = fixture();
  expect(() => source.applySettings(value)).toThrow();
  expect(source.getSettings()).toEqual(source.getDefaults());
  expect(onChange).not.toHaveBeenCalled();
});

test('rejects an incomplete field schema', () => {
  expect(() =>
    createSettingsControls({
      id: 'intro',
      titleKey: 'veil',
      defaults: { scale: 1, angle: 0 },
      fields: [{ property: 'scale', labelKey: 'scale', min: 0, max: 4, step: 1 }],
      onChange: vi.fn(),
    })
  ).toThrow();
});
