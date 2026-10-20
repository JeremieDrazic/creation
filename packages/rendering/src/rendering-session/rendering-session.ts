import type { WebGPURenderer } from 'three/webgpu';

import { getElementWindow } from '@creation/utils/dom/get-element-window';
import {
  createPageVisibilityObserver,
  type PageVisibilityObserver,
} from '@creation/utils/dom/page-visibility';
import { CodedError } from '@creation/utils/errors/coded-errors';

import { createRenderingHost } from '../rendering-host/rendering-host';
import { createRenderingLoop } from '../rendering-loop/rendering-loop';
import { createRenderingViewport } from '../rendering-viewport/rendering-viewport';
import type {
  CanvasResizeObserver,
  FrameTime,
  RenderingLoop,
  RenderingSession,
  RenderingViewport,
  RenderingViewportController,
} from '../types';
import { disposeRenderingLoopAndHost } from '../utils/dispose-rendering-loop-and-host/dispose-rendering-loop-and-host';
import { measureCanvasViewport } from '../utils/measure-canvas-viewport/measure-canvas-viewport';
import { observeCanvasResize } from '../utils/observe-canvas-resize/observe-canvas-resize';
import { renderFrameWithViewport } from '../utils/render-frame-with-viewport/render-frame-with-viewport';
import {
  RENDERING_SESSION_ERROR_CODES,
  type RenderingSessionErrorCode,
} from './rendering-session-errors';

export type { RenderingSession } from '../types';

export type RenderingSessionOptions = Readonly<{
  /** The caller owns CSS layout and DOM removal; initial layout must be drawable. */
  canvas: HTMLCanvasElement;
  /** Reads the caller's selected resolution ratio; no quality cap is imposed by the session. */
  readPixelRatio: () => number;
  maxDeltaSeconds: number;
  /**
   * Optional async resource preparation after renderer initialization and before camera callbacks,
   * browser subscriptions or frame registration. The caller owns prepared scene resources and must
   * release them if preparation or later session creation fails. Cancellation is cooperative: the
   * session waits for this callback to settle before releasing the borrowed renderer.
   */
  prepareRendering?: (context: RenderingPreparationContext) => Promise<void>;
  /** Synchronously adjusts cameras/effects initially and before drawing after a size change. */
  onViewportChange: (viewport: RenderingViewport) => void;
  /** Synchronously updates and draws the current experience; the renderer is borrowed. */
  onFrame: (renderer: WebGPURenderer, frameTime: FrameTime) => void;
  /** Called synchronously after blocking hidden-page frames, including an initially hidden page. */
  onSuspend?: () => void;
  /**
   * Called synchronously before restarting frames after suspension, not on initial visible setup.
   * Pending dimensions are applied in the first resumed frame. These callbacks must not be async.
   */
  onResume?: () => void;
  /** Receives runtime failures with their original domain codes/causes; must not throw. */
  onError: (error: unknown) => void;
  /** Cancels creation only; after creation, release the session through dispose(). */
  signal?: AbortSignal;
}>;

/** Inputs available while the initialized renderer is not yet running application frames. */
export type RenderingPreparationContext = Readonly<{
  /** Borrowed for preparation only; do not dispose it or install an animation callback. */
  renderer: WebGPURenderer;
  /** Snapshot of drawable dimensions already applied to the renderer, before async preparation. */
  viewport: RenderingViewport;
  /** Creation signal; always provided, including when the caller does not supply one. */
  signal: AbortSignal;
}>;

/**
 * Assembles the host, loop and viewport on the canvas's own browser window. Resize notifications
 * only request measurement; buffer changes, camera adjustments and drawing share one callback.
 * Hidden pages stop the loop; return remeasures and resumes with zero delta. Empty layout skips
 * frames. Frame/visibility failures remain terminal until the application creates a new session.
 * Optional preparation finishes before subscriptions/frame registration. Creation failures release
 * session-owned resources and reject rather than call onError; prepared scene resources remain
 * caller-owned. Layout changes during preparation are applied before the first drawable frame.
 *
 * The application owns scenes, their preparation/disposal, navigation and audio suspension. Frame
 * callbacks must not dispose the borrowed renderer or replace its animation callback. Creating a
 * session requires exclusive use of its canvas until disposal settles.
 */
export async function createRenderingSession({
  canvas,
  readPixelRatio,
  maxDeltaSeconds,
  prepareRendering,
  onViewportChange,
  onFrame,
  onSuspend,
  onResume,
  onError,
  signal,
}: RenderingSessionOptions): Promise<RenderingSession> {
  signal?.throwIfAborted();

  const browserWindow = getElementWindow(canvas, RENDERING_SESSION_ERROR_CODES.UNAVAILABLE_WINDOW);

  const initialViewport = measureCanvasViewport(canvas, readPixelRatio);
  const host = await createRenderingHost({ canvas, viewport: initialViewport, signal });

  let loop: RenderingLoop | undefined;
  let canvasResizeObserver: CanvasResizeObserver | undefined;
  let pageVisibilityObserver: PageVisibilityObserver | undefined;
  let visibilityChangePromise = Promise.resolve();
  let disposalPromise: Promise<void> | undefined;
  let isDisposed = false;
  let isReady = false;
  let hasFailed = false;
  let isSuspended = false;

  // Assigned during setup, before any observer or frame callback can use it.
  let viewportController: RenderingViewportController;

  function requestViewportMeasurement(): void {
    if (!isDisposed && !hasFailed) {
      viewportController.requestViewportMeasurement();
    }
  }

  function dispose(): Promise<void> {
    if (disposalPromise === undefined) {
      isDisposed = true;
      disposalPromise = Promise.resolve().then(async () => {
        pageVisibilityObserver?.dispose();
        canvasResizeObserver?.dispose();

        await disposeRenderingLoopAndHost(
          loop,
          host,
          RENDERING_SESSION_ERROR_CODES.DISPOSAL_FAILED
        );
      });
    }

    return disposalPromise;
  }

  function renderFrame(frameTime: FrameTime): void {
    if (isDisposed || hasFailed) {
      return;
    }

    try {
      renderFrameWithViewport(frameTime, host, viewportController, onViewportChange, onFrame);
    } catch (cause) {
      // Block visibility-driven restarts immediately, before the loop's async error reporting.
      hasFailed = true;
      throw cause;
    }
  }

  function reportRuntimeFailure(error: unknown): void {
    hasFailed = true;

    if (!isDisposed && isReady) {
      onError(error);
    }
  }

  function handlePageVisibility(isPageVisible: boolean): void {
    if (isDisposed || hasFailed || loop === undefined) {
      return;
    }

    try {
      if (isPageVisible) {
        requestViewportMeasurement();

        if (isSuspended) {
          onResume?.();
          isSuspended = false;
        }

        visibilityChangePromise = loop.startRenderingFrames();
      } else {
        visibilityChangePromise = loop.stopRenderingFrames();

        if (!isSuspended) {
          isSuspended = true;
          onSuspend?.();
        }
      }
    } catch (cause) {
      // A lifecycle callback failure blocks restarts immediately, even before reporting settles.
      hasFailed = true;
      visibilityChangePromise = loop.stopRenderingFrames().then(
        () => {
          throw cause;
        },
        (stopCause: unknown) => {
          throw new AggregateError(
            [cause, stopCause],
            'Visibility callback and frame shutdown failed.'
          );
        }
      );
    }

    // Initial failure rejects creation below; later DOM events report through onError.
    void visibilityChangePromise.catch(reportRuntimeFailure);
  }

  try {
    signal?.throwIfAborted();

    viewportController = createRenderingViewport({
      initialViewport,
      measureViewport: () => measureCanvasViewport(canvas, readPixelRatio),
    });

    loop = createRenderingLoop({
      renderer: host.renderer,
      maxDeltaSeconds,
      onFrame: renderFrame,
      onError: reportRuntimeFailure,
    });

    if (prepareRendering !== undefined) {
      const preparationSignal = signal ?? new AbortController().signal;

      await prepareRendering({
        renderer: host.renderer,
        viewport: { ...initialViewport },
        signal: preparationSignal,
      });
      preparationSignal.throwIfAborted();
    }

    onViewportChange(initialViewport);

    canvasResizeObserver = observeCanvasResize({
      canvas,
      browserWindow,
      onResize: requestViewportMeasurement,
    });

    pageVisibilityObserver = createPageVisibilityObserver({
      document: canvas.ownerDocument,
      onVisibilityChange: handlePageVisibility,
    });

    await visibilityChangePromise;
    signal?.throwIfAborted();
    isReady = true;
  } catch (cause) {
    try {
      await dispose();
    } catch (cleanupCause) {
      throw new CodedError<RenderingSessionErrorCode>(
        RENDERING_SESSION_ERROR_CODES.CREATION_FAILED,
        {
          cause: new AggregateError([cause, cleanupCause], 'Session creation and cleanup failed.'),
        }
      );
    }
    throw cause;
  }

  return { requestViewportMeasurement, dispose };
}
