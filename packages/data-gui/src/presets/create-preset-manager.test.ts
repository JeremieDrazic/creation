import { expect, test, vi } from 'vitest';

import { createSettingsControls } from '../create-settings-controls/create-settings-controls';
import { createPresetManager } from './create-preset-manager';
import { parsePresetCollection, type PresetCollection } from './preset-data';

function fixture() {
  const source = createSettingsControls({
    id: 'intro',
    titleKey: 'veil',
    defaults: { scale: 1 },
    fields: [{ property: 'scale', labelKey: 'scale', min: 0.1, max: 4, step: 0.1 }],
    onChange: vi.fn(),
  });
  let file: PresetCollection = { version: 1, scope: 'intro', presets: [] };
  const storage = {
    load: vi.fn(async () => structuredClone(file)),
    save: vi.fn(async (value: PresetCollection) => {
      file = structuredClone(value);
    }),
  };
  return { source, storage, manager: createPresetManager(source, storage) };
}

test('saves independent snapshots and switches between them without losing edits to another preset', async () => {
  const { source, storage, manager } = fixture();
  await manager.load();
  source.applySettings({ scale: 1.5 });
  await manager.save('Wide');
  const first = manager.getSelectedId();
  source.applySettings({ scale: 2.5 });
  expect(manager.isModified()).toBe(true);
  await manager.save('Close');
  const second = manager.getSelectedId();
  manager.select(first);
  expect(source.getSettings()).toEqual({ scale: 1.5 });
  expect(manager.isModified()).toBe(false);
  manager.select(second);
  expect(source.getSettings()).toEqual({ scale: 2.5 });
  const reloaded = createPresetManager(source, storage);
  await reloaded.load();
  expect(reloaded.getCollection()).toEqual(manager.getCollection());
  reloaded.dispose();
  manager.dispose();
});

test('renames, updates a named preset and deletes only the selected snapshot', async () => {
  const { source, manager } = fixture();
  await manager.save('A');
  const id = manager.getSelectedId();
  await manager.rename('B');
  source.applySettings({ scale: 2 });
  await manager.save('B');
  expect(manager.getCollection().presets).toEqual([{ id, name: 'B', settings: { scale: 2 } }]);
  await manager.remove();
  expect(manager.getCollection().presets).toEqual([]);
  expect(source.getSettings()).toEqual({ scale: 2 });
  manager.select('');
  expect(source.getSettings()).toEqual({ scale: 1 });
  manager.dispose();
});

test('failed writes preserve the saved collection and current selection', async () => {
  const { source, storage, manager } = fixture();
  await manager.save('A');
  const before = manager.getCollection();
  source.applySettings({ scale: 2 });
  storage.save.mockRejectedValueOnce(new Error('Disk full'));
  await expect(manager.save('A')).rejects.toThrow('Disk full');
  expect(manager.getCollection()).toEqual(before);
  expect(manager.isModified()).toBe(true);
  manager.dispose();
});

test('validates every import before saving or applying anything', async () => {
  const { source, storage, manager } = fixture();
  await manager.save('A');
  const count = storage.save.mock.calls.length;
  await expect(
    manager.importCollection({
      version: 1,
      scope: 'intro',
      presets: [{ id: 'b', name: 'B', settings: { scale: 40 } }],
    })
  ).rejects.toThrow();
  await expect(
    manager.importCollection({ version: 1, scope: 'fireflies', presets: [] })
  ).rejects.toThrow();
  expect(storage.save).toHaveBeenCalledTimes(count);
  expect(source.getSettings()).toEqual({ scale: 1 });
  manager.dispose();
});

test('merges portable collections and never mutates their input', async () => {
  const { manager } = fixture();
  await manager.save('A');
  const imported = { id: 'b', name: 'B', settings: { scale: 3 } };
  const input = { version: 1, scope: 'intro', presets: [imported] };
  await manager.importCollection(input);
  imported.settings.scale = 4;
  expect(manager.getCollection().presets.map((p) => p.settings['scale'])).toEqual([1, 3]);
  manager.dispose();
});

test.each([
  { version: 2, scope: 'intro', presets: [] },
  { version: 1, scope: '../intro', presets: [] },
  { version: 1, scope: 'intro', presets: [{ id: 'a', name: ' ', settings: { scale: 1 } }] },
  {
    version: 1,
    scope: 'intro',
    presets: [
      { id: 'a', name: 'A', settings: { scale: 1 } },
      { id: 'a', name: 'B', settings: { scale: 2 } },
    ],
  },
  {
    version: 1,
    scope: 'intro',
    presets: [
      { id: 'a', name: 'A', settings: { scale: 1 } },
      { id: 'b', name: 'a', settings: { scale: 2 } },
    ],
  },
  {
    version: 1,
    scope: 'intro',
    presets: [{ id: 'a', name: 'A', settings: { scale: Number.POSITIVE_INFINITY } }],
  },
])('rejects malformed portable data: %j', (value) => {
  expect(() => parsePresetCollection(value, 'intro')).toThrow();
});
