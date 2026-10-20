import { WebGPURenderer } from 'three/webgpu';

import { CodedError } from '@creation/utils/errors/coded-errors';

import type { RenderingHost, RenderingViewport } from '../types';
import { RENDERING_HOST_ERROR_CODES, type RenderingHostErrorCode } from './rendering-host-errors';

export type { RenderingHost } from '../types';

export type { RenderingViewport };

/** The caller owns canvas layout and chooses resolution; cancellation concerns creation only. */
export type RenderingHostOptions = Readonly<{
  canvas: HTMLCanvasElement;
  viewport: RenderingViewport;
  signal?: AbortSignal;
}>;

/**
 * Validates the host's viewport contract without mutating the supplied values. CSS dimensions and
 * pixel ratio must be finite and positive; each physical buffer dimension, rounded down by
 * Three.js, must contain at least one pixel. Skip resize while the canvas is hidden or has no
 * measurable area. Kept private until another module needs this same contract.
 *
 * @throws {RangeError} When dimensions or pixel ratio cannot produce a valid drawing buffer.
 */
function assertViewport(viewport: RenderingViewport): void {
  const { widthCssPx, heightCssPx, pixelRatio } = viewport;
  const bufferWidthPx = Math.floor(widthCssPx * pixelRatio);
  const bufferHeightPx = Math.floor(heightCssPx * pixelRatio);
  if (
    !Number.isFinite(widthCssPx) ||
    !Number.isFinite(heightCssPx) ||
    !Number.isFinite(pixelRatio) ||
    widthCssPx <= 0 ||
    heightCssPx <= 0 ||
    pixelRatio <= 0 ||
    !Number.isFinite(bufferWidthPx) ||
    !Number.isFinite(bufferHeightPx) ||
    bufferWidthPx < 1 ||
    bufferHeightPx < 1
  ) {
    throw new RangeError('Viewport must have finite positive dimensions and a non-empty buffer.');
  }
}

/**
 * Initializes Three.js before handing its renderer to the application. An abort during
 * initialization releases the renderer after init settles; it cannot interrupt Three.js device
 * acquisition. No scene, input listeners or animation callback is registered here.
 */
export async function createRenderingHost({
  canvas,
  viewport,
  signal,
}: RenderingHostOptions): Promise<RenderingHost> {
  signal?.throwIfAborted();
  assertViewport(viewport);

  let renderer: WebGPURenderer;
  try {
    renderer = new WebGPURenderer({ canvas });
  } catch (cause) {
    throw new CodedError<RenderingHostErrorCode>(RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED, {
      cause,
    });
  }
  let disposalPromise: Promise<void> | undefined;

  /**
   * Starts renderer cleanup once and returns the same promise on subsequent calls, including after
   * failure. This stateful operation releases host-owned resources, not scene objects or the DOM
   * canvas. Starting cleanup permanently prevents further resize calls.
   */
  function dispose(): Promise<void> {
    if (disposalPromise === undefined) {
      disposalPromise = renderer.dispose().catch((cause: unknown) => {
        throw new CodedError<RenderingHostErrorCode>(RENDERING_HOST_ERROR_CODES.DISPOSAL_FAILED, {
          cause,
        });
      });
    }
    return disposalPromise;
  }

  /**
   * Mutates the owned renderer's drawing buffer using CSS dimensions and the chosen pixel ratio.
   * The caller remains responsible for canvas layout and camera projection.
   *
   * @throws {Error} If renderer cleanup has already started.
   * @throws {RangeError} If the requested viewport is invalid.
   */
  function resize(nextViewport: RenderingViewport): void {
    if (disposalPromise !== undefined) {
      throw new Error('Cannot resize a disposed rendering host.');
    }
    assertViewport(nextViewport);
    renderer.setDrawingBufferSize(
      nextViewport.widthCssPx,
      nextViewport.heightCssPx,
      nextViewport.pixelRatio
    );
  }

  /**
   * Preserves the primary failure; a cleanup failure retains both causes under the caller's code.
   * The caller supplies that code because cancellation may carry a CodedError from another domain.
   */
  async function rejectAfterCleanup(
    failure: unknown,
    cleanupFailureCode: RenderingHostErrorCode
  ): Promise<never> {
    try {
      await dispose();
    } catch (cleanupError) {
      const combinedCause = new AggregateError(
        [failure, cleanupError],
        'Renderer creation and cleanup both failed.'
      );
      throw new CodedError<RenderingHostErrorCode>(cleanupFailureCode, { cause: combinedCause });
    }
    // AbortSignal can carry any reason; preserve it exactly rather than turn cancellation into an operational error.
    throw failure;
  }

  try {
    resize(viewport);
    await renderer.init();
  } catch (cause) {
    return rejectAfterCleanup(
      new CodedError<RenderingHostErrorCode>(RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED, {
        cause,
      }),
      RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED
    );
  }

  // Cancellation is checked separately so a real initialization failure is never mislabeled.
  try {
    signal?.throwIfAborted();
  } catch (reason) {
    return rejectAfterCleanup(reason, RENDERING_HOST_ERROR_CODES.DISPOSAL_FAILED);
  }
  return { renderer, resize, dispose };
}
