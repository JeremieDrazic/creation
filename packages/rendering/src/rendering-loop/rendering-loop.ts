import type { WebGPURenderer } from 'three/webgpu';

import { CodedError } from '@creation/utils/errors/coded-errors';

import { createFrameClock } from '../frame-clock/frame-clock';
import type { FrameTime, RenderingLoop } from '../types';
import { reportRenderingFrameFailure } from '../utils/report-rendering-frame-failure/report-rendering-frame-failure';
import { RENDERING_LOOP_ERROR_CODES, type RenderingLoopErrorCode } from './rendering-loop-errors';

export type { RenderingLoop } from '../types';

/** The caller supplies an initialized renderer and exclusively lends its animation callback slot. */
export type RenderingLoopOptions = Readonly<{
  renderer: Pick<WebGPURenderer, 'setAnimationLoop'>;
  maxDeltaSeconds: number;
  /** Synchronous scene update and drawing work. Async preparation must happen outside this call. */
  onFrame: (frameTime: FrameTime) => void;
  /**
   * Receives a frame failure after callback removal settles; must return synchronously, without
   * throwing.
   */
  onError: (error: CodedError<RenderingLoopErrorCode>) => void;
}>;

/**
 * Creates a stopped loop without installing listeners or scheduling frames. Start/stop operations
 * reject with CALLBACK_CHANGE_FAILED when Three.js cannot change the callback. Starting after
 * disposal rejects with DISPOSED. Frame failures stop the loop and reach onError with FRAME_FAILED,
 * preserving the original cause and any callback-removal failure. The caller owns recovery. Only
 * this module may call setAnimationLoop on the borrowed renderer until disposal settles. The
 * initialized Three.js renderer applies callback changes immediately; no task queue is needed.
 */
export function createRenderingLoop({
  renderer,
  maxDeltaSeconds,
  onFrame,
  onError,
}: RenderingLoopOptions): RenderingLoop {
  const clock = createFrameClock({ maxDeltaSeconds });
  let isRunning = false;
  let isDisposed = false;
  let callbackChangePromise = Promise.resolve();
  let disposalPromise: Promise<void> | undefined;

  /**
   * Changes the initialized renderer's callback immediately and exposes Three.js failures as domain
   * errors. Promise settlement reports the result; it does not delay callback installation.
   */
  function setRendererCallback(
    callback: Parameters<WebGPURenderer['setAnimationLoop']>[0]
  ): Promise<void> {
    const changePromise = renderer.setAnimationLoop(callback).catch((cause: unknown) => {
      // An earlier rejection may be observed after a newer direct change has already succeeded.
      if (callbackChangePromise === changePromise) {
        isRunning = false;
        clock.resetPreviousFrameTimestamp();
      }
      throw new CodedError<RenderingLoopErrorCode>(
        RENDERING_LOOP_ERROR_CODES.CALLBACK_CHANGE_FAILED,
        { cause }
      );
    });

    callbackChangePromise = changePromise;
    return callbackChangePromise;
  }

  function stopRenderingFrames(): Promise<void> {
    if (disposalPromise !== undefined) {
      return disposalPromise;
    }

    if (!isRunning) {
      return callbackChangePromise;
    }

    isRunning = false;
    clock.resetPreviousFrameTimestamp();
    return setRendererCallback(null);
  }

  function renderFrame(timestampMs: number): void {
    if (!isRunning || isDisposed) {
      return;
    }
    try {
      const frameTime = clock.calculateFrameTime(timestampMs);
      onFrame(frameTime);
    } catch (cause) {
      // The reporter handles stop failures; onError follows the non-throwing contract above.
      void reportRenderingFrameFailure(
        cause,
        stopRenderingFrames,
        onError,
        RENDERING_LOOP_ERROR_CODES.FRAME_FAILED
      );
    }
  }

  function startRenderingFrames(): Promise<void> {
    if (isDisposed) {
      return Promise.reject(
        new CodedError<RenderingLoopErrorCode>(RENDERING_LOOP_ERROR_CODES.DISPOSED)
      );
    }

    if (isRunning) {
      return callbackChangePromise;
    }

    isRunning = true;
    return setRendererCallback(renderFrame);
  }

  function dispose(): Promise<void> {
    if (disposalPromise === undefined) {
      isDisposed = true;
      isRunning = false;
      clock.resetPreviousFrameTimestamp();
      disposalPromise = setRendererCallback(null);
    }

    return disposalPromise;
  }

  return { startRenderingFrames, stopRenderingFrames, dispose };
}
