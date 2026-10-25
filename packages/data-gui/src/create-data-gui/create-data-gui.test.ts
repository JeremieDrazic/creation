import { beforeEach, expect, test, vi } from 'vitest';

import { createDataGui, DATA_GUI_ERROR_CODES } from './create-data-gui';

const backend = vi.hoisted(() => ({
  create: vi.fn(),
  add: vi.fn(),
  destroy: vi.fn(),
  controllers: vi.fn<() => { updateDisplay: () => void }[]>(() => []),
}));

vi.mock('lil-gui', () => ({
  default: class {
    constructor(options: unknown) {
      backend.create(options);
    }
    add(...args: unknown[]): unknown {
      return backend.add(...args);
    }
    destroy() {
      backend.destroy();
    }
    controllersRecursive() {
      return backend.controllers();
    }
  },
}));

function fixture() {
  const control = {
    name: vi.fn<(label: string) => void>().mockReturnThis(),
    onChange: vi.fn<(callback: () => void) => void>().mockReturnThis(),
    onFinishChange: vi.fn<(callback: () => void) => void>().mockReturnThis(),
  };
  backend.add.mockReturnValue(control);
  const container = {} as HTMLElement;
  const gui = createDataGui({ title: 'Veil framing', container });
  return { gui, container, control };
}

beforeEach(() => vi.clearAllMocks());

test('binds a numeric setting without taking ownership of its object or layout', () => {
  const { gui, container } = fixture();
  const settings = { angle: 30, name: 'veil' };
  const before = { ...settings };
  gui.addNumber(settings, 'angle', { label: 'Angle', min: -90, max: 90, step: 1 });
  expect(backend.create).toHaveBeenCalledExactlyOnceWith({
    title: 'Veil framing',
    container,
    autoPlace: false,
  });
  expect(backend.add).toHaveBeenCalledExactlyOnceWith(settings, 'angle', -90, 90, 1);
  expect(settings).toEqual(before);
  gui.dispose();
  expect(settings).toEqual(before);
});

test('keeps live and committed change notifications separate', () => {
  const { gui, control } = fixture();
  const onChange = vi.fn();
  const onFinishChange = vi.fn();
  gui.addNumber({ scale: 1 }, 'scale', {
    label: 'Scale',
    min: 0.5,
    max: 2,
    step: 0.05,
    onChange,
    onFinishChange,
  });
  control.onChange.mock.calls[0]?.[0]();
  expect(onChange).toHaveBeenCalledOnce();
  expect(onFinishChange).not.toHaveBeenCalled();
  control.onFinishChange.mock.calls[0]?.[0]();
  expect(onFinishChange).toHaveBeenCalledOnce();
  gui.dispose();
});

test.each([
  { value: Number.NaN, min: 0, max: 1, step: 0.1 },
  { value: 2, min: 0, max: 1, step: 0.1 },
  { value: 0, min: 1, max: -1, step: 0.1 },
  { value: 0, min: 0, max: 1, step: 0 },
  { value: 0, min: 0, max: Number.POSITIVE_INFINITY, step: 0.1 },
])('rejects invalid numeric control configuration before adding controls: %j', (input) => {
  const { gui } = fixture();
  const settings = { scale: input.value };
  expect(() => gui.addNumber(settings, 'scale', { label: 'Scale', ...input })).toThrow(RangeError);
  expect(backend.add).not.toHaveBeenCalled();
  expect(settings.scale).toBe(input.value);
  gui.dispose();
});

test('disposes the panel once and rejects controls added after disposal', () => {
  const { gui } = fixture();
  gui.dispose();
  gui.dispose();
  expect(backend.destroy).toHaveBeenCalledOnce();
  expect(() =>
    gui.addNumber({ angle: 0 }, 'angle', {
      label: 'Angle',
      min: -90,
      max: 90,
      step: 1,
    })
  ).toThrow(DATA_GUI_ERROR_CODES.DISPOSED);
  expect(backend.add).not.toHaveBeenCalled();
  expect(() => gui.refreshValues()).toThrow(DATA_GUI_ERROR_CODES.DISPOSED);
});

test('refreshes displayed values after an external reset without changing settings', () => {
  const { gui, control } = fixture();
  const updateDisplay = vi.fn();
  backend.controllers.mockReturnValueOnce([{ updateDisplay }]);
  gui.refreshValues();
  expect(updateDisplay).toHaveBeenCalledOnce();
  expect(control.onChange).not.toHaveBeenCalled();
  gui.dispose();
});
