import { CodedError } from '@creation/utils/errors/coded-errors';

export type NumericSettings = Readonly<Record<string, number>>;

export type GuiPreset = Readonly<{ id: string; name: string; settings: NumericSettings }>;
export type PresetCollection = Readonly<{
  version: 1;
  scope: string;
  presets: readonly GuiPreset[];
}>;
export type PresetStorage = Readonly<{
  load: (scope: string) => Promise<PresetCollection>;
  save: (collection: PresetCollection) => Promise<void>;
}>;

export const PRESET_ERROR_CODES = {
  INVALID: 'DATA_GUI_PRESETS_INVALID',
  LOAD_FAILED: 'DATA_GUI_PRESETS_LOAD_FAILED',
  SAVE_FAILED: 'DATA_GUI_PRESETS_SAVE_FAILED',
} as const;

export function assertPresetScope(scope: string): void {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(scope)) {
    throw new CodedError(PRESET_ERROR_CODES.INVALID);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Validates untrusted disk/import data; experience schemas perform the final range/key check. */
export function parsePresetCollection(value: unknown, scope: string): PresetCollection {
  assertPresetScope(scope);
  if (
    !isRecord(value) ||
    value['version'] !== 1 ||
    value['scope'] !== scope ||
    !Array.isArray(value['presets']) ||
    value['presets'].length > 100
  ) {
    throw new CodedError(PRESET_ERROR_CODES.INVALID);
  }
  const ids = new Set<string>();
  const names = new Set<string>();
  const presets = value['presets'].map((entry: unknown): GuiPreset => {
    if (
      !isRecord(entry) ||
      typeof entry['id'] !== 'string' ||
      !/^[a-z0-9-]{1,64}$/.test(entry['id']) ||
      typeof entry['name'] !== 'string' ||
      !entry['name'].trim() ||
      entry['name'].length > 64 ||
      !isRecord(entry['settings']) ||
      Object.keys(entry['settings']).length > 128 ||
      Object.values(entry['settings']).some(
        (number) => typeof number !== 'number' || !Number.isFinite(number)
      )
    ) {
      throw new CodedError(PRESET_ERROR_CODES.INVALID);
    }
    const name = entry['name'].trim();
    if (ids.has(entry['id']) || names.has(name.toLocaleLowerCase('en'))) {
      throw new CodedError(PRESET_ERROR_CODES.INVALID);
    }
    ids.add(entry['id']);
    names.add(name.toLocaleLowerCase('en'));
    return { id: entry['id'], name, settings: { ...entry['settings'] } as NumericSettings };
  });
  return { version: 1, scope, presets };
}
