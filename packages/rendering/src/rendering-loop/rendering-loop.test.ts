import { describe, expect, test, vi } from 'vitest';

import { createRenderingLoop, type RenderingLoopOptions } from './rendering-loop';
import { RENDERING_LOOP_ERROR_CODES } from './rendering-loop-errors';

type AnimationCallback = Parameters<RenderingLoopOptions['renderer']['setAnimationLoop']>[0];

const TEST_MAX_DELTA_SECONDS = 0.05;

/** Replaces only Three.js callback registration; the real loop and clock remain under test. */
function createTestLoop() {
  let installedCallback: AnimationCallback = null;
  const setAnimationLoop = vi.fn<RenderingLoopOptions['renderer']['setAnimationLoop']>(
    (callback) => {
      installedCallback = callback;
      return Promise.resolve();
    }
  );
  const renderer = { setAnimationLoop, dispose: vi.fn() };
  const onFrame = vi.fn<RenderingLoopOptions['onFrame']>();
  const onError = vi.fn<RenderingLoopOptions['onError']>();
  const loop = createRenderingLoop({
    renderer,
    maxDeltaSeconds: TEST_MAX_DELTA_SECONDS,
    onFrame,
    onError,
  });

  function readInstalledCallback(): NonNullable<AnimationCallback> {
    if (installedCallback === null) {
      throw new Error('Expected an installed animation callback.');
    }
    return installedCallback;
  }

  return { loop, renderer, onFrame, onError, readInstalledCallback };
}

describe('scheduling and time', () => {
  test('creates a stopped loop and installs one callback for repeated starts', async () => {
    const { loop, renderer, onFrame, readInstalledCallback } = createTestLoop();
    expect(renderer.setAnimationLoop).not.toHaveBeenCalled();

    const start = loop.startRenderingFrames();
    expect(loop.startRenderingFrames()).toBe(start);
    await start;
    expect(renderer.setAnimationLoop).toHaveBeenCalledOnce();

    const renderFrame = readInstalledCallback();
    renderFrame(1000);
    renderFrame(1016);
    expect(onFrame.mock.calls).toEqual([
      [{ deltaSeconds: 0, elapsedSeconds: 0 }],
      [{ deltaSeconds: 0.016, elapsedSeconds: 0.016 }],
    ]);
    await loop.dispose();
  });

  test('blocks stale callbacks immediately and resumes without advancing paused time', async () => {
    const { loop, renderer, onFrame, readInstalledCallback } = createTestLoop();
    await loop.startRenderingFrames();
    const oldCallback = readInstalledCallback();
    oldCallback(1000);
    oldCallback(1016);

    const stop = loop.stopRenderingFrames();
    expect(loop.stopRenderingFrames()).toBe(stop);
    oldCallback(1032);
    expect(onFrame).toHaveBeenCalledTimes(2);
    await stop;
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);

    await loop.startRenderingFrames();
    readInstalledCallback()(61016);
    expect(onFrame).toHaveBeenLastCalledWith({ deltaSeconds: 0, elapsedSeconds: 0.016 });
    readInstalledCallback()(61032);
    expect(onFrame).toHaveBeenLastCalledWith({ deltaSeconds: 0.016, elapsedSeconds: 0.032 });
    await loop.dispose();
  });

  test('does not install a callback when stopping a newly created loop', async () => {
    const { loop, renderer } = createTestLoop();
    await loop.stopRenderingFrames();
    expect(renderer.setAnimationLoop).not.toHaveBeenCalled();
  });

  test('applies start, stop and restart immediately, before their promises are awaited', async () => {
    const { loop, renderer, onFrame, readInstalledCallback } = createTestLoop();
    const start = loop.startRenderingFrames();
    expect(renderer.setAnimationLoop).toHaveBeenCalledOnce();
    const stop = loop.stopRenderingFrames();
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    const restart = loop.startRenderingFrames();
    expect(renderer.setAnimationLoop.mock.calls).toEqual([
      [expect.any(Function)],
      [null],
      [expect.any(Function)],
    ]);
    readInstalledCallback()(1000);
    expect(onFrame).toHaveBeenCalledOnce();
    await Promise.all([start, stop, restart]);
    await loop.dispose();
  });
});

describe('disposal', () => {
  test('is permanent and repeatable, blocks pending frames and never disposes the renderer', async () => {
    const { loop, renderer, onFrame, readInstalledCallback } = createTestLoop();
    await loop.startRenderingFrames();
    const oldCallback = readInstalledCallback();

    const disposal = loop.dispose();
    expect(loop.dispose()).toBe(disposal);
    expect(loop.stopRenderingFrames()).toBe(disposal);
    oldCallback(1000);
    expect(onFrame).not.toHaveBeenCalled();
    await disposal;

    await expect(loop.startRenderingFrames()).rejects.toMatchObject({
      code: RENDERING_LOOP_ERROR_CODES.DISPOSED,
    });
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(renderer.dispose).not.toHaveBeenCalled();
  });

  test('removes the callback immediately when disposed before the start promise is awaited', async () => {
    const { loop, renderer } = createTestLoop();
    const start = loop.startRenderingFrames();
    const disposal = loop.dispose();
    expect(renderer.setAnimationLoop.mock.calls).toEqual([[expect.any(Function)], [null]]);
    await Promise.all([start, disposal]);
  });

  test('preserves a disposal failure and shares its rejection without retrying', async () => {
    const { loop, renderer } = createTestLoop();
    const cause = new Error('Callback removal unavailable.');
    renderer.setAnimationLoop.mockRejectedValueOnce(cause);
    const disposal = loop.dispose();

    await expect(disposal).rejects.toMatchObject({
      code: RENDERING_LOOP_ERROR_CODES.CALLBACK_CHANGE_FAILED,
      cause,
    });
    expect(loop.dispose()).toBe(disposal);
    expect(renderer.setAnimationLoop).toHaveBeenCalledOnce();
  });
});

describe('failures', () => {
  test('reports registration failure to the caller and still permits later cleanup', async () => {
    const { loop, renderer, onError } = createTestLoop();
    const cause = new Error('Registration unavailable.');
    renderer.setAnimationLoop.mockRejectedValueOnce(cause);

    await expect(loop.startRenderingFrames()).rejects.toMatchObject({
      code: RENDERING_LOOP_ERROR_CODES.CALLBACK_CHANGE_FAILED,
      cause,
    });
    expect(onError).not.toHaveBeenCalled();
    await loop.dispose();
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
  });

  test('does not let an earlier rejection stop a newer immediately installed callback', async () => {
    const { loop, renderer, onFrame, readInstalledCallback } = createTestLoop();
    renderer.setAnimationLoop.mockRejectedValueOnce(new Error('Registration failed.'));
    const start = loop.startRenderingFrames();
    const rejection = expect(start).rejects.toMatchObject({
      code: RENDERING_LOOP_ERROR_CODES.CALLBACK_CHANGE_FAILED,
    });
    const stop = loop.stopRenderingFrames();
    const restart = loop.startRenderingFrames();

    await Promise.all([rejection, stop, restart]);
    readInstalledCallback()(1000);
    expect(onFrame).toHaveBeenCalledOnce();
    await loop.dispose();
  });

  test('stops after a frame failure and reports its original cause once', async () => {
    const { loop, renderer, onFrame, onError, readInstalledCallback } = createTestLoop();
    const cause = new Error('Scene update failed.');
    onFrame.mockImplementationOnce(() => {
      throw cause;
    });
    await loop.startRenderingFrames();
    const renderFrame = readInstalledCallback();

    renderFrame(1000);
    renderFrame(1016);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onFrame).toHaveBeenCalledOnce();
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: RENDERING_LOOP_ERROR_CODES.FRAME_FAILED, cause })
    );
    await loop.dispose();
  });

  test('retains frame and callback-removal failures together', async () => {
    const { loop, renderer, onFrame, onError, readInstalledCallback } = createTestLoop();
    const frameCause = new Error('Drawing failed.');
    const removalCause = new Error('Callback removal failed.');
    await loop.startRenderingFrames();
    onFrame.mockImplementationOnce(() => {
      throw frameCause;
    });
    renderer.setAnimationLoop.mockRejectedValueOnce(removalCause);

    readInstalledCallback()(1000);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    const failure = onError.mock.calls[0]?.[0];
    expect(failure?.code).toBe(RENDERING_LOOP_ERROR_CODES.FRAME_FAILED);
    expect(failure?.cause).toBeInstanceOf(AggregateError);
    if (!(failure?.cause instanceof AggregateError)) {
      throw new Error('Expected both failures to be preserved.');
    }
    expect(failure.cause.errors).toEqual([
      frameCause,
      expect.objectContaining({
        code: RENDERING_LOOP_ERROR_CODES.CALLBACK_CHANGE_FAILED,
        cause: removalCause,
      }),
    ]);
    await loop.dispose();
  });
});
