import { beforeEach, expect, test, vi } from 'vitest';

import type { RenderingRuntime } from '../../types';
import { createRenderingRuntime } from '../rendering-runtime/rendering-runtime';
import { attachRenderingRuntime } from './attach-rendering-runtime';

vi.mock('../rendering-runtime/rendering-runtime', () => ({ createRenderingRuntime: vi.fn() }));

let startup = Promise.withResolvers<RenderingRuntime>();

function createOptions() {
  return {
    canvas: {} as HTMLCanvasElement,
    prepareInitialExperience: async () => {
      throw new Error('The mocked runtime must not prepare an experience.');
    },
    readPixelRatio: () => 1,
    maxDeltaSeconds: 0.05,
    publishStatus: vi.fn(),
    onError: vi.fn(),
  };
}

function readRuntimeOptions() {
  const options = vi.mocked(createRenderingRuntime).mock.calls[0]?.[0];
  if (options === undefined) {
    throw new Error('Expected runtime startup.');
  }
  return options;
}

beforeEach(() => {
  vi.resetAllMocks();
  startup = Promise.withResolvers<RenderingRuntime>();
  vi.mocked(createRenderingRuntime).mockReturnValue(startup.promise);
});

test('forwards startup inputs and status until detached', () => {
  const options = createOptions();
  const detach = attachRenderingRuntime(options);
  const runtimeOptions = readRuntimeOptions();
  expect(runtimeOptions.canvas).toBe(options.canvas);
  expect(runtimeOptions.prepareInitialExperience).toBe(options.prepareInitialExperience);
  expect(runtimeOptions.signal.aborted).toBe(false);
  runtimeOptions.publishStatus({ status: 'preparing', progress: 0.4 });
  expect(options.publishStatus).toHaveBeenCalledExactlyOnceWith({
    status: 'preparing',
    progress: 0.4,
  });

  detach();
  expect(runtimeOptions.signal.aborted).toBe(true);
  runtimeOptions.publishStatus({ status: 'ready' });
  expect(options.publishStatus).toHaveBeenCalledOnce();
});

test('disposes a ready runtime once on repeated detach', async () => {
  const options = createOptions();
  const dispose = vi.fn(async () => {});
  const detach = attachRenderingRuntime(options);
  startup.resolve({ dispose });
  await Promise.resolve();
  expect(dispose).not.toHaveBeenCalled();
  detach();
  detach();
  expect(dispose).toHaveBeenCalledOnce();
});

test('disposes a runtime that finishes after detach', async () => {
  const options = createOptions();
  const dispose = vi.fn(async () => {});
  const detach = attachRenderingRuntime(options);
  detach();
  startup.resolve({ dispose });
  await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
  expect(options.onError).not.toHaveBeenCalled();
});

test('disposes a runtime when detached just before the startup continuation', async () => {
  const dispose = vi.fn(async () => {});
  const detach = attachRenderingRuntime(createOptions());
  startup.resolve({ dispose });
  detach();
  await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
});

test('reports startup failures', async () => {
  const options = createOptions();
  attachRenderingRuntime(options);
  const error = new Error('Startup failed.');
  startup.reject(error);
  await vi.waitFor(() => expect(options.onError).toHaveBeenCalledExactlyOnceWith(error));
});

test('does not report the startup cancellation reason as an error', async () => {
  const options = createOptions();
  const detach = attachRenderingRuntime(options);
  detach();
  startup.reject(readRuntimeOptions().signal.reason);
  await Promise.resolve();
  expect(options.onError).not.toHaveBeenCalled();
});

test('reports a different failure even after cancellation', async () => {
  const options = createOptions();
  const detach = attachRenderingRuntime(options);
  detach();
  const error = new Error('Cancelled startup cleanup failed.');
  startup.reject(error);
  await vi.waitFor(() => expect(options.onError).toHaveBeenCalledExactlyOnceWith(error));
});

test.each(['ready', 'late'] as const)('reports failed cleanup of a %s runtime', async (timing) => {
  const options = createOptions();
  const error = new Error('Runtime cleanup failed.');
  const dispose = vi.fn(async () => {
    throw error;
  });
  const detach = attachRenderingRuntime(options);

  if (timing === 'ready') {
    startup.resolve({ dispose });
    await Promise.resolve();
    detach();
  } else {
    detach();
    startup.resolve({ dispose });
  }

  await vi.waitFor(() => expect(options.onError).toHaveBeenCalledExactlyOnceWith(error));
  expect(dispose).toHaveBeenCalledOnce();
});
