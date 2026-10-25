import { CodedError } from '@creation/utils/errors/coded-errors';

import {
  assertPresetScope,
  parsePresetCollection,
  PRESET_ERROR_CODES,
  type PresetStorage,
} from './preset-data';

export type { GuiPreset, PresetCollection, PresetStorage } from './preset-data';

/** Browser adapter for the optional development-only Vite file endpoint. No Node imports. */
export function createFilePresetStorage(baseUrl = '/__data-gui/presets'): PresetStorage {
  return {
    async load(scope) {
      assertPresetScope(scope);
      try {
        const response = await fetch(`${baseUrl}/${scope}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Preset load returned HTTP ${response.status}.`);
        }
        const value: unknown = await response.json();
        return parsePresetCollection(value, scope);
      } catch (cause) {
        throw new CodedError(PRESET_ERROR_CODES.LOAD_FAILED, { cause });
      }
    },
    async save(collection) {
      const validated = parsePresetCollection(collection, collection.scope);
      try {
        const response = await fetch(`${baseUrl}/${validated.scope}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validated),
        });
        if (!response.ok) {
          throw new Error(`Preset save returned HTTP ${response.status}.`);
        }
      } catch (cause) {
        throw new CodedError(PRESET_ERROR_CODES.SAVE_FAILED, { cause });
      }
    },
  };
}
