import type { WebGPURenderer } from 'three/webgpu';
import { beforeEach, expect, test, vi } from 'vitest';

import {
  createRenderingSession,
  type RenderingSessionOptions,
} from '@creation/rendering/rendering-session';

import { createStatusStore } from '../../stores/status-store/status-store';
import type {
  CreationExperience,
  CreationExperiencePreparationOptions,
  RenderingRuntimeStatus,
} from '../../types';
import { EXPERIENCE_COORDINATOR_ERROR_CODES } from '../experience-coordinator/experience-coordinator-errors';
import { createRenderingRuntime } from './rendering-runtime';
import { RENDERING_RUNTIME_ERROR_CODES } from './rendering-runtime-errors';

vi.mock('@creation/rendering/rendering-session', () => ({ createRenderingSession: vi.fn() }));

const clearRenderer = vi.fn();
const renderer = { clear: clearRenderer } as unknown as WebGPURenderer;
const viewport = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 };
const disposeSession = vi.fn<() => Promise<void>>();
let sessionOptions: RenderingSessionOptions;

function createExperience() {
  return {
    activate: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    suspend: vi.fn(),
    resume: vi.fn(),
    dispose: vi.fn(),
  } satisfies CreationExperience;
}

function createOptions(experience = createExperience()) {
  return {
    canvas: {} as HTMLCanvasElement,
    prepareInitialExperience: vi.fn(
      async (_options: CreationExperiencePreparationOptions) => experience
    ),
    readPixelRatio: () => 1.5,
    maxDeltaSeconds: 0.05,
    signal: new AbortController().signal,
    publishStatus: vi.fn(),
    onError: vi.fn(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  disposeSession.mockResolvedValue(undefined);
  vi.mocked(createRenderingSession).mockImplementation(async (options) => {
    sessionOptions = options;
    try {
      options.signal?.throwIfAborted();
      await options.prepareRendering?.({
        renderer,
        viewport,
        signal: options.signal ?? new AbortController().signal,
      });
      options.signal?.throwIfAborted();
      options.onViewportChange(viewport);
    } catch (cause) {
      // Model the session contract: failed startup releases its own resources before rejecting.
      await disposeSession();
      throw cause;
    }
    return { dispose: disposeSession, requestViewportMeasurement: vi.fn() };
  });
});

test('prepares and activates before forwarding update, render, resize and visibility', async () => {
  const experience = createExperience();
  const options = createOptions(experience);
  const runtime = await createRenderingRuntime(options);
  expect(options.prepareInitialExperience).toHaveBeenCalledOnce();
  const preparationOptions = options.prepareInitialExperience.mock.calls[0]?.[0];
  expect(preparationOptions?.renderer).toBe(renderer);
  expect(preparationOptions?.viewport).toEqual(viewport);
  expect(preparationOptions?.signal).toBeInstanceOf(AbortSignal);
  expect(sessionOptions.readPixelRatio()).toBe(1.5);
  expect(sessionOptions.maxDeltaSeconds).toBe(options.maxDeltaSeconds);
  expect(experience.activate).toHaveBeenCalledOnce();

  const frameTime = { deltaSeconds: 0.016, elapsedSeconds: 1 };
  sessionOptions.onFrame(renderer, frameTime);
  expect(experience.update).toHaveBeenCalledWith(frameTime);
  expect(experience.render).toHaveBeenCalledWith(renderer);
  expect(experience.update.mock.invocationCallOrder[0]).toBeLessThan(
    experience.render.mock.invocationCallOrder[0] ?? Infinity
  );

  const resizedViewport = { ...viewport, widthCssPx: 1000 };
  sessionOptions.onViewportChange(resizedViewport);
  expect(experience.resize).toHaveBeenLastCalledWith(resizedViewport);
  sessionOptions.onSuspend?.();
  experience.update.mockClear();
  experience.render.mockClear();
  sessionOptions.onFrame(renderer, frameTime);
  expect(experience.update).not.toHaveBeenCalled();
  expect(experience.render).not.toHaveBeenCalled();
  sessionOptions.onResume?.();
  sessionOptions.onFrame(renderer, frameTime);
  expect(experience.suspend).toHaveBeenCalledOnce();
  expect(experience.resume).toHaveBeenCalledOnce();
  expect(experience.render).toHaveBeenCalledOnce();
  await runtime.dispose();
});

test('forwards later session failures without replacing their original cause', async () => {
  const options = createOptions();
  const runtime = await createRenderingRuntime(options);
  const error = new Error('Rendering failed.');
  sessionOptions.onError(error);
  expect(options.onError).toHaveBeenCalledExactlyOnceWith(error);
  await runtime.dispose();
});

test('waits for session disposal before releasing the experience and shares one disposal promise', async () => {
  const experience = createExperience();
  const runtime = await createRenderingRuntime(createOptions(experience));
  const sessionDisposal = Promise.withResolvers<void>();
  disposeSession.mockReturnValue(sessionDisposal.promise);

  const disposal = runtime.dispose();
  expect(runtime.dispose()).toBe(disposal);
  expect(disposeSession).toHaveBeenCalledOnce();
  expect(experience.dispose).not.toHaveBeenCalled();
  sessionDisposal.resolve();
  await disposal;
  expect(experience.dispose).toHaveBeenCalledOnce();
  expect(runtime.dispose()).toBe(disposal);
});

test('still releases the experience when session disposal fails', async () => {
  const experience = createExperience();
  const runtime = await createRenderingRuntime(createOptions(experience));
  const error = new Error('Session cleanup failed.');
  disposeSession.mockRejectedValue(error);
  await expect(runtime.dispose()).rejects.toBe(error);
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('retains both session and experience disposal failures', async () => {
  const experience = createExperience();
  const runtime = await createRenderingRuntime(createOptions(experience));
  const sessionError = new Error('Session cleanup failed.');
  const experienceError = new Error('Experience cleanup failed.');
  disposeSession.mockRejectedValue(sessionError);
  experience.dispose.mockImplementation(() => {
    throw experienceError;
  });
  const disposal = runtime.dispose();
  const failure = await disposal.catch((error: unknown) => error);
  expect(failure).toMatchObject({ code: 'RENDERING_RUNTIME_DISPOSAL_FAILED' });
  expect((failure as Error).cause).toBeInstanceOf(AggregateError);
  const failures = ((failure as Error).cause as AggregateError).errors as unknown[];
  expect(failures).toHaveLength(2);
  expect(failures[0]).toBe(sessionError);
  expect(failures[1]).toMatchObject({ code: 'EXPERIENCE_COORDINATOR_DISPOSAL_FAILED' });
  expect(((failures[1] as Error).cause as AggregateError).errors).toEqual([experienceError]);
  expect(runtime.dispose()).toBe(disposal);
});

test('releases a prepared experience when later session setup fails', async () => {
  const experience = createExperience();
  const error = new Error('Viewport setup failed.');
  experience.resize
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw error;
    });
  await expect(createRenderingRuntime(createOptions(experience))).rejects.toBe(error);
  expect(disposeSession).toHaveBeenCalledOnce();
  expect(experience.dispose).toHaveBeenCalledOnce();
});

test('retains setup failure together with failed experience cleanup', async () => {
  const experience = createExperience();
  const setupError = new Error('Viewport setup failed.');
  const cleanupError = new Error('Experience cleanup failed.');
  experience.resize
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw setupError;
    });
  experience.dispose.mockImplementation(() => {
    throw cleanupError;
  });
  const failure = await createRenderingRuntime(createOptions(experience)).catch(
    (error: unknown) => error
  );
  expect(failure).toMatchObject({ code: 'RENDERING_RUNTIME_CREATION_AND_CLEANUP_FAILED' });
  expect((failure as Error).cause).toBeInstanceOf(AggregateError);
  const failures = ((failure as Error).cause as AggregateError).errors as unknown[];
  expect(failures).toHaveLength(2);
  expect(failures[0]).toBe(setupError);
  expect(failures[1]).toMatchObject({ code: 'EXPERIENCE_COORDINATOR_DISPOSAL_FAILED' });
  expect(((failures[1] as Error).cause as AggregateError).errors).toEqual([cleanupError]);
});

test('cancels pending preparation and releases its late result', async () => {
  const experience = createExperience();
  const preparation = Promise.withResolvers<CreationExperience>();
  const controller = new AbortController();
  const options = {
    ...createOptions(experience),
    signal: controller.signal,
    prepareInitialExperience: vi.fn(() => preparation.promise),
  };
  const creation = createRenderingRuntime(options);
  await vi.waitFor(() => expect(options.prepareInitialExperience).toHaveBeenCalledOnce());
  const reason = new Error('Canvas removed.');
  controller.abort(reason);
  const rejection = expect(creation).rejects.toBe(reason);
  preparation.resolve(experience);
  await rejection;
  expect(experience.activate).not.toHaveBeenCalled();
  expect(experience.dispose).toHaveBeenCalledOnce();
  expect(disposeSession).toHaveBeenCalledOnce();
  expect(options.publishStatus.mock.calls).toEqual([[{ status: 'preparing', progress: null }]]);
});

test('keeps the store preparing until async experience preparation completes', async () => {
  const { publishStatus, statusStore } = createStatusStore<RenderingRuntimeStatus>({
    status: 'preparing',
    progress: null,
  });
  const preparation = Promise.withResolvers<CreationExperience>();
  const creation = createRenderingRuntime({
    ...createOptions(),
    publishStatus,
    prepareInitialExperience: () => preparation.promise,
  });
  await Promise.resolve();
  expect(statusStore.getState()).toEqual({ status: 'preparing', progress: null });

  preparation.resolve(createExperience());
  const runtime = await creation;
  expect(statusStore.getState()).toEqual({ status: 'ready' });
  await runtime.dispose();
});

test('publishes failed with the startup rejection after releasing resources', async () => {
  const { publishStatus, statusStore } = createStatusStore<RenderingRuntimeStatus>({
    status: 'preparing',
    progress: null,
  });
  const error = new Error('Experience preparation failed.');
  const options = createOptions();
  options.prepareInitialExperience.mockRejectedValue(error);
  const creation = createRenderingRuntime({ ...options, publishStatus });

  await expect(creation).rejects.toBe(error);
  expect(disposeSession).toHaveBeenCalledOnce();
  expect(statusStore.getState()).toEqual({ status: 'failed', error });
  expect(options.onError).not.toHaveBeenCalled();
});

test('publishes later rendering failures before calling the diagnostic handler', async () => {
  const { publishStatus, statusStore } = createStatusStore<RenderingRuntimeStatus>({
    status: 'preparing',
    progress: null,
  });
  const error = new Error('Frame failed.');
  const onError = vi.fn(() => {
    expect(statusStore.getState()).toEqual({ status: 'failed', error });
  });
  const runtime = await createRenderingRuntime({ ...createOptions(), publishStatus, onError });

  sessionOptions.onError(error);
  expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  await runtime.dispose();
});

test('does not publish or start a session for an already cancelled request', async () => {
  const controller = new AbortController();
  const reason = new Error('Canvas removed.');
  controller.abort(reason);
  const options = { ...createOptions(), signal: controller.signal };
  await expect(createRenderingRuntime(options)).rejects.toBe(reason);
  expect(options.publishStatus).not.toHaveBeenCalled();
  expect(createRenderingSession).not.toHaveBeenCalled();
});

test('publishes failed when cancellation also encounters a cleanup failure', async () => {
  const experience = createExperience();
  const cleanupError = new Error('Cancelled experience cleanup failed.');
  experience.dispose.mockImplementation(() => {
    throw cleanupError;
  });
  const preparation = Promise.withResolvers<CreationExperience>();
  const controller = new AbortController();
  const { publishStatus, statusStore } = createStatusStore<RenderingRuntimeStatus>({
    status: 'preparing',
    progress: null,
  });
  const prepareInitialExperience = vi.fn(() => preparation.promise);
  const creation = createRenderingRuntime({
    ...createOptions(),
    signal: controller.signal,
    publishStatus,
    prepareInitialExperience,
  });
  await vi.waitFor(() => expect(prepareInitialExperience).toHaveBeenCalledOnce());
  controller.abort(new Error('Canvas removed.'));
  const failure = creation.catch((error: unknown) => error);
  preparation.resolve(experience);

  const error = await failure;
  expect(error).toMatchObject({ code: 'EXPERIENCE_COORDINATOR_PREPARATION_AND_CLEANUP_FAILED' });
  expect(statusStore.getState()).toEqual({ status: 'failed', error });
});

test('selects another experience without recreating the renderer or rendering session', async () => {
  const previous = createExperience();
  const options = createOptions(previous);
  const runtime = await createRenderingRuntime(options);
  const next = createExperience();
  const prepareNext = vi.fn(async (_options: CreationExperiencePreparationOptions) => next);
  await runtime.selectExperience(prepareNext);

  expect(createRenderingSession).toHaveBeenCalledOnce();
  expect(prepareNext.mock.calls[0]?.[0].renderer).toBe(renderer);
  expect(disposeSession).not.toHaveBeenCalled();
  expect(previous.dispose).toHaveBeenCalledOnce();
  sessionOptions.onFrame(renderer, { deltaSeconds: 0.016, elapsedSeconds: 1 });
  expect(next.render).toHaveBeenCalledExactlyOnceWith(renderer);
  expect(options.publishStatus).toHaveBeenCalledTimes(2);
  await runtime.dispose();
});

test('can start empty, then select and clear an experience without releasing the renderer', async () => {
  const runtime = await createRenderingRuntime({
    ...createOptions(),
    prepareInitialExperience: null,
  });
  expect(clearRenderer).toHaveBeenCalledOnce();
  const experience = createExperience();
  await runtime.selectExperience(async () => experience);
  await runtime.selectExperience(null);
  expect(clearRenderer).toHaveBeenCalledTimes(2);
  expect(experience.dispose).toHaveBeenCalledOnce();
  expect(disposeSession).not.toHaveBeenCalled();
  sessionOptions.onFrame(renderer, { deltaSeconds: 0.016, elapsedSeconds: 1 });
  expect(experience.render).not.toHaveBeenCalled();
  await runtime.dispose();
});

test('a failed replacement leaves the current experience usable', async () => {
  const current = createExperience();
  const runtime = await createRenderingRuntime(createOptions(current));
  const failure = new Error('Replacement failed.');
  await expect(
    runtime.selectExperience(async () => {
      throw failure;
    })
  ).rejects.toBe(failure);
  sessionOptions.onFrame(renderer, { deltaSeconds: 0.016, elapsedSeconds: 1 });
  expect(current.render).toHaveBeenCalledOnce();
  expect(current.dispose).not.toHaveBeenCalled();
  await runtime.dispose();
});

test('clearing cancels pending selection and releases its late result', async () => {
  const runtime = await createRenderingRuntime(createOptions());
  const pending = Promise.withResolvers<CreationExperience>();
  const selection = runtime.selectExperience(async () => pending.promise);
  const rejection = expect(selection).rejects.toMatchObject({
    code: EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED,
  });
  await Promise.resolve();
  await runtime.selectExperience(null);
  const late = createExperience();
  pending.resolve(late);
  await rejection;
  expect(late.activate).not.toHaveBeenCalled();
  expect(late.dispose).toHaveBeenCalledOnce();
  await runtime.dispose();
});

test.each(['disposed', 'failed'] as const)(
  'rejects selection when rendering is %s',
  async (state) => {
    const options = createOptions();
    const runtime = await createRenderingRuntime(options);
    if (state === 'disposed') {
      await runtime.dispose();
    } else {
      sessionOptions.onError(new Error('Graphics device failed.'));
    }
    const prepare = vi.fn(async () => createExperience());
    await expect(runtime.selectExperience(prepare)).rejects.toMatchObject({
      code: RENDERING_RUNTIME_ERROR_CODES.UNAVAILABLE,
    });
    expect(prepare).not.toHaveBeenCalled();
    await runtime.dispose();
  }
);
