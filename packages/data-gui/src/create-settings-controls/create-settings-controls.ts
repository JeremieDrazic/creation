import { CodedError } from '@creation/utils/errors/coded-errors';

import type { DataGui, NumericProperty } from '../create-data-gui/create-data-gui';
import type { NumericSettings } from '../presets/preset-data';

export type { NumericSettings } from '../presets/preset-data';
export type SettingsControls = Readonly<{
  id: string;
  titleKey: string;
  addControls: (gui: DataGui, translate: (key: string) => string) => void;
  reset: () => void;
  getSettings: () => NumericSettings;
  getDefaults: () => NumericSettings;
  validateSettings: (value: unknown) => NumericSettings;
  applySettings: (value: unknown) => void;
  subscribe: (listener: () => void) => () => void;
}>;

export type NumberField<Target> = Readonly<{
  property: NumericProperty<Target>;
  labelKey: string;
  min: number;
  max: number;
  step: number;
}>;

export const SETTINGS_ERROR_CODES = { INVALID: 'DATA_GUI_SETTINGS_INVALID' } as const;

/** Owns numeric bindings/defaults; experiences supply a schema and one application callback. */
export function createSettingsControls<Target extends Record<keyof Target, number>>(
  options: Readonly<{
    id: string;
    titleKey: string;
    defaults: Target;
    fields: readonly NumberField<Target>[];
    onChange: (values: Readonly<Target>) => void;
  }>
): SettingsControls {
  const fields = options.fields.map((field) => ({ ...field }));
  const defaults = { ...options.defaults };
  const settings = { ...defaults };
  const listeners = new Set<() => void>();

  function validateSettings(value: unknown): Target {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new CodedError(SETTINGS_ERROR_CODES.INVALID);
    }
    const keys = Object.keys(defaults);
    if (
      Object.keys(value).length !== keys.length ||
      keys.some((key) => !Object.hasOwn(value, key))
    ) {
      throw new CodedError(SETTINGS_ERROR_CODES.INVALID);
    }
    const record = value as Record<string, unknown>;
    for (const field of fields) {
      const number = record[field.property];
      if (
        typeof number !== 'number' ||
        !Number.isFinite(number) ||
        number < field.min ||
        number > field.max
      ) {
        throw new CodedError(SETTINGS_ERROR_CODES.INVALID);
      }
    }
    return { ...value } as Target;
  }

  // A complete schema is required so imports cannot bypass validation through an unbound property.
  if (
    fields.length !== Object.keys(defaults).length ||
    new Set(fields.map((field) => field.property)).size !== Object.keys(defaults).length ||
    fields.some(
      (field) =>
        !Object.hasOwn(defaults, field.property) ||
        !Number.isFinite(field.min) ||
        !Number.isFinite(field.max) ||
        field.min >= field.max ||
        !Number.isFinite(field.step) ||
        field.step <= 0
    )
  ) {
    throw new CodedError(SETTINGS_ERROR_CODES.INVALID);
  }
  validateSettings(defaults);

  function notifyChange(): void {
    options.onChange({ ...settings });
    for (const listener of listeners) {
      listener();
    }
  }

  function applySettings(value: unknown): void {
    Object.assign(settings, validateSettings(value));
    notifyChange();
  }

  return {
    id: options.id,
    titleKey: options.titleKey,
    getSettings: () => ({ ...settings }),
    getDefaults: () => ({ ...defaults }),
    validateSettings,
    applySettings,
    reset: () => applySettings(defaults),
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    addControls(gui, translate) {
      for (const field of fields) {
        // Every property is validated as numeric above; DataGui's public signature also enforces it.
        gui.addNumber(settings, field.property, {
          label: translate(field.labelKey),
          min: field.min,
          max: field.max,
          step: field.step,
          onChange: notifyChange,
        });
      }
    },
  };
}
