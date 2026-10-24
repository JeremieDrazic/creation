import { beforeEach, expect, test, vi } from 'vitest';

import { CodedError } from '@creation/utils/errors/coded-errors';

import type { RenderingRuntime } from '../../types';
import { EXPERIENCE_COORDINATOR_ERROR_CODES } from '../experience-coordinator/experience-coordinator-errors';
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

test('forwards startup inputs and status until the attachment is disposed', () => {
  const options = createOptions();
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);
  const runtimeOptions = readRuntimeOptions();
  expect(runtimeOptions.canvas).toBe(options.canvas);
  expect(runtimeOptions.prepareInitialExperience).toBe(options.prepareInitialExperience);
  expect(runtimeOptions.signal.aborted).toBe(false);
  runtimeOptions.publishStatus({ status: 'preparing', progress: 0.4 });
  expect(options.publishStatus).toHaveBeenCalledExactlyOnceWith({
    status: 'preparing',
    progress: 0.4,
  });

  disposeAttachment();
  expect(runtimeOptions.signal.aborted).toBe(true);
  runtimeOptions.publishStatus({ status: 'ready' });
  expect(options.publishStatus).toHaveBeenCalledOnce();
});

test('disposes a ready runtime once on repeated attachment disposal', async () => {
  const options = createOptions();
  const dispose = vi.fn(async () => {});
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);
  startup.resolve({ dispose, selectExperience: vi.fn() });
  await Promise.resolve();
  expect(dispose).not.toHaveBeenCalled();
  disposeAttachment();
  disposeAttachment();
  expect(dispose).toHaveBeenCalledOnce();
});

test('disposes a runtime that finishes after attachment disposal', async () => {
  const options = createOptions();
  const dispose = vi.fn(async () => {});
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);
  disposeAttachment();
  startup.resolve({ dispose, selectExperience: vi.fn() });
  await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
  expect(options.onError).not.toHaveBeenCalled();
});

test('disposes a runtime when the attachment is disposed just before the startup continuation', async () => {
  const dispose = vi.fn(async () => {});
  const { dispose: disposeAttachment } = attachRenderingRuntime(createOptions());
  startup.resolve({ dispose, selectExperience: vi.fn() });
  disposeAttachment();
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
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);
  disposeAttachment();
  startup.reject(readRuntimeOptions().signal.reason);
  await Promise.resolve();
  expect(options.onError).not.toHaveBeenCalled();
});

test('reports a different failure even after cancellation', async () => {
  const options = createOptions();
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);
  disposeAttachment();
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
  const { dispose: disposeAttachment } = attachRenderingRuntime(options);

  if (timing === 'ready') {
    startup.resolve({ dispose, selectExperience: vi.fn() });
    await Promise.resolve();
    disposeAttachment();
  } else {
    disposeAttachment();
    startup.resolve({ dispose, selectExperience: vi.fn() });
  }

  await vi.waitFor(() => expect(options.onError).toHaveBeenCalledExactlyOnceWith(error));
  expect(dispose).toHaveBeenCalledOnce();
});

test('forwards selection to a ready runtime without starting it again', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockResolvedValue(undefined);
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();

  attachment.selectExperience(null);
  attachment.selectExperience(null);
  expect(selectExperience).toHaveBeenCalledExactlyOnceWith(null);
  expect(createRenderingRuntime).toHaveBeenCalledOnce();
  attachment.dispose();
});

test('keeps only the latest startup selection, including an empty route', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  const otherPreparation = createOptions().prepareInitialExperience;
  attachment.selectExperience(otherPreparation);
  attachment.selectExperience(null);
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockResolvedValue(undefined);
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();

  expect(selectExperience).toHaveBeenCalledExactlyOnceWith(null);
  expect(createRenderingRuntime).toHaveBeenCalledOnce();
  attachment.dispose();
});

test('does not repeat initial preparation when startup selection returns to its initial value', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  attachment.selectExperience(null);
  attachment.selectExperience(options.prepareInitialExperience);
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockResolvedValue(undefined);
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();
  expect(selectExperience).not.toHaveBeenCalled();
  attachment.dispose();
});

test('discards queued selection and ignores new requests after attachment disposal', async () => {
  const attachment = attachRenderingRuntime(createOptions());
  attachment.selectExperience(null);
  attachment.dispose();
  attachment.selectExperience(createOptions().prepareInitialExperience);
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockResolvedValue(undefined);
  const dispose = vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined);
  startup.resolve({ dispose, selectExperience });
  await vi.waitFor(() => expect(dispose).toHaveBeenCalledOnce());
  expect(selectExperience).not.toHaveBeenCalled();
});

test('keeps expected selection supersession silent', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockRejectedValue(new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED));
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();
  attachment.selectExperience(null);
  await Promise.resolve();
  expect(options.onError).not.toHaveBeenCalled();
  attachment.dispose();
});

test('keeps selection cancellation on attachment disposal silent', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  const selection = Promise.withResolvers<void>();
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockReturnValue(selection.promise);
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();
  attachment.selectExperience(null);
  attachment.dispose();
  selection.reject(new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED));
  await Promise.resolve();
  expect(options.onError).not.toHaveBeenCalled();
});

test('reports a selection failure even when it arrives after attachment disposal', async () => {
  const options = createOptions();
  const attachment = attachRenderingRuntime(options);
  const selection = Promise.withResolvers<void>();
  const selectExperience = vi
    .fn<RenderingRuntime['selectExperience']>()
    .mockReturnValue(selection.promise);
  startup.resolve({
    dispose: vi.fn<RenderingRuntime['dispose']>().mockResolvedValue(undefined),
    selectExperience,
  });
  await Promise.resolve();
  attachment.selectExperience(null);
  attachment.dispose();
  const failure = new Error('Late resource cleanup failed.');
  selection.reject(failure);
  await vi.waitFor(() => expect(options.onError).toHaveBeenCalledExactlyOnceWith(failure));
});
