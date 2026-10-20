import { CodedError } from '@creation/utils/errors/coded-errors';

import type { FrameViewport, RenderingViewport, RenderingViewportController } from '../types';
import { hasDrawableArea } from '../utils/has-drawable-area/has-drawable-area';
import { hasViewportChanged } from '../utils/has-viewport-changed/has-viewport-changed';
import {
  RENDERING_VIEWPORT_ERROR_CODES,
  type RenderingViewportErrorCode,
} from './rendering-viewport-errors';

export type { FrameViewport, RenderingViewportController } from '../types';

export type RenderingViewportOptions = Readonly<{
  /** Valid drawable dimensions already applied to the renderer and scene cameras. */
  initialViewport: RenderingViewport;
  /** Reads current CSS dimensions and caller-selected pixel ratio synchronously, when requested. */
  measureViewport: () => RenderingViewport;
}>;

/**
 * Creates a viewport controller with an already-applied baseline. The first frame remeasures
 * because layout may have changed during renderer initialization. Empty measurements preserve the
 * last drawable dimensions, avoiding a redundant resize when the same visible size returns. The
 * caller applies every reported drawable change immediately; this module does not apply it. If
 * application fails, recreate the controller from known applied dimensions before resuming.
 * Pixel-ratio selection remains caller-owned. No subscriptions or disposable resources are
 * created.
 *
 * @throws {CodedError} With INVALID_MEASUREMENT if the initial viewport is invalid or empty.
 */
export function createRenderingViewport({
  initialViewport,
  measureViewport,
}: RenderingViewportOptions): RenderingViewportController {
  if (!hasDrawableArea(initialViewport, RENDERING_VIEWPORT_ERROR_CODES.INVALID_MEASUREMENT)) {
    throw new CodedError<RenderingViewportErrorCode>(
      RENDERING_VIEWPORT_ERROR_CODES.INVALID_MEASUREMENT
    );
  }

  let lastDrawableViewport = { ...initialViewport };
  let frameViewport: FrameViewport = {
    viewport: lastDrawableViewport,
    hasChanged: false,
    hasDrawableArea: true,
  };
  let needsMeasurement = true;

  function requestViewportMeasurement(): void {
    needsMeasurement = true;
  }

  function readViewportForFrame(): FrameViewport {
    if (!needsMeasurement) {
      return frameViewport;
    }

    // Copy the measurement so later changes to the caller's object cannot alter this snapshot.
    const viewport = { ...measureViewport() };
    const drawableArea = hasDrawableArea(
      viewport,
      RENDERING_VIEWPORT_ERROR_CODES.INVALID_MEASUREMENT
    );
    const hasChanged = drawableArea && hasViewportChanged(viewport, lastDrawableViewport);
    const measuredFrame: FrameViewport = { viewport, hasChanged, hasDrawableArea: drawableArea };

    if (drawableArea) {
      lastDrawableViewport = viewport;
    }

    needsMeasurement = false;
    // Report a change once. Following frames reuse these dimensions without repeating the resize.
    frameViewport = { ...measuredFrame, hasChanged: false };
    return measuredFrame;
  }

  return { requestViewportMeasurement, readViewportForFrame };
}
