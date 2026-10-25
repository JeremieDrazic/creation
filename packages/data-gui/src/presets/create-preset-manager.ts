import { CodedError } from '@creation/utils/errors/coded-errors';

import type { SettingsControls } from '../create-settings-controls/create-settings-controls';
import {
  parsePresetCollection,
  PRESET_ERROR_CODES,
  type PresetCollection,
  type PresetStorage,
} from './preset-data';

/** Owns named snapshots and selection, independently of DOM, filesystem and the experience. */
export function createPresetManager(source: SettingsControls, storage: PresetStorage) {
  let collection: PresetCollection = { version: 1, scope: source.id, presets: [] };
  let selectedId = '';
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };
  const unsubscribe = source.subscribe(notify);

  function validate(value: unknown): PresetCollection {
    const parsed = parsePresetCollection(value, source.id);
    return {
      ...parsed,
      presets: parsed.presets.map((preset) => ({
        ...preset,
        settings: source.validateSettings(preset.settings),
      })),
    };
  }

  async function persist(next: PresetCollection, nextSelectedId = selectedId): Promise<void> {
    const validated = validate(next);
    await storage.save(validated);
    collection = validated;
    selectedId = nextSelectedId;
    notify();
  }

  return {
    async load() {
      collection = validate(await storage.load(source.id));
      notify();
    },
    getCollection: () => structuredClone(collection),
    getSelectedId: () => selectedId,
    isModified() {
      const original =
        collection.presets.find((preset) => preset.id === selectedId)?.settings ??
        source.getDefaults();
      const current = source.getSettings();
      return Object.keys(original).some((key) => original[key] !== current[key]);
    },
    select(id: string) {
      if (id === '') {
        selectedId = '';
        source.reset();
        return;
      }
      const preset = collection.presets.find((entry) => entry.id === id);
      if (preset === undefined) {
        throw new CodedError(PRESET_ERROR_CODES.INVALID);
      }
      selectedId = id;
      source.applySettings(preset.settings);
    },
    async save(name: string) {
      const existing = collection.presets.find(
        (preset) => preset.name.toLocaleLowerCase('en') === name.trim().toLocaleLowerCase('en')
      );
      const preset = {
        id: existing?.id ?? crypto.randomUUID(),
        name: name.trim(),
        settings: source.getSettings(),
      };
      await persist(
        {
          ...collection,
          presets:
            existing === undefined
              ? [...collection.presets, preset]
              : collection.presets.map((entry) => (entry.id === preset.id ? preset : entry)),
        },
        preset.id
      );
    },
    async rename(name: string) {
      if (!selectedId) {
        throw new CodedError(PRESET_ERROR_CODES.INVALID);
      }
      await persist({
        ...collection,
        presets: collection.presets.map((preset) =>
          preset.id === selectedId ? { ...preset, name: name.trim() } : preset
        ),
      });
    },
    async remove() {
      if (!selectedId) {
        return;
      }
      await persist(
        { ...collection, presets: collection.presets.filter((preset) => preset.id !== selectedId) },
        ''
      );
    },
    async importCollection(value: unknown) {
      const incoming = validate(value);
      const retained = collection.presets.filter(
        (preset) =>
          !incoming.presets.some(
            (entry) =>
              entry.id === preset.id ||
              entry.name.toLocaleLowerCase('en') === preset.name.toLocaleLowerCase('en')
          )
      );
      const next = { ...collection, presets: [...retained, ...incoming.presets] };
      await persist(
        next,
        next.presets.some((preset) => preset.id === selectedId) ? selectedId : ''
      );
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispose() {
      unsubscribe();
      listeners.clear();
    },
  };
}
