import GUI from 'lil-gui';

import { CodedError } from '@creation/utils/errors/coded-errors';

type NumericProperty<Target> = {
  [Key in keyof Target]-?: Target[Key] extends number ? Key : never;
}[keyof Target] &
  string;

export type NumberControlOptions = Readonly<{
  label: string;
  min: number;
  max: number;
  step: number;
  /** Called after a GUI edit has written the property. Must not throw. */
  onChange?: () => void;
  /** Called when an edit finishes; use for costly updates. Must not throw. */
  onFinishChange?: () => void;
}>;

export type DataGui = Readonly<{
  addNumber: <Target extends object>(
    target: Target,
    property: NumericProperty<Target>,
    options: NumberControlOptions
  ) => void;
  dispose: () => void;
}>;

export const DATA_GUI_ERROR_CODES = {
  DISPOSED: 'DATA_GUI_DISPOSED',
} as const;

/** Checks a numeric binding before adding DOM controls or changing the caller's settings. */
function assertNumberControl(value: unknown, options: NumberControlOptions): void {
  const { min, max, step } = options;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(step) ||
    min >= max ||
    step <= 0 ||
    value < min ||
    value > max
  ) {
    throw new RangeError(
      'A numeric GUI control requires finite bounds, a positive step and an in-range value.'
    );
  }
}

/**
 * Development-only adapter. The caller owns a mutable settings object and the container layout;
 * this object owns the panel and its controls. GUI edits write settings directly before notifying
 * callbacks. No renderer, experience, React state or frame loop is owned here. Import dynamically
 * behind the application's development guard so this package is absent from production bundles.
 */
export function createDataGui(
  options: Readonly<{ title: string; container: HTMLElement }>
): DataGui {
  const gui = new GUI({ title: options.title, container: options.container, autoPlace: false });
  let isDisposed = false;

  function addNumber<Target extends object>(
    target: Target,
    property: NumericProperty<Target>,
    controlOptions: NumberControlOptions
  ): void {
    if (isDisposed) {
      throw new CodedError(DATA_GUI_ERROR_CODES.DISPOSED);
    }
    assertNumberControl(target[property], controlOptions);

    const control = gui
      .add(target, property, controlOptions.min, controlOptions.max, controlOptions.step)
      .name(controlOptions.label);

    if (controlOptions.onChange !== undefined) {
      control.onChange(controlOptions.onChange);
    }
    if (controlOptions.onFinishChange !== undefined) {
      control.onFinishChange(controlOptions.onFinishChange);
    }
  }

  function dispose(): void {
    if (isDisposed) {
      return;
    }
    isDisposed = true;
    gui.destroy();
  }

  return { addNumber, dispose };
}
