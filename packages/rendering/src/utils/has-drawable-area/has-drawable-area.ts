import { CodedError } from '@creation/utils/errors/coded-errors';

import type { RenderingViewport } from '../../types';

/**
 * Validates a measurement and checks that both physical buffer dimensions contain at least a pixel.
 * Zero CSS dimensions are valid measurements with no drawable area. No renderer is accessed.
 *
 * @throws {CodedError} With the caller-supplied code for invalid dimensions or pixel ratio.
 */
export function hasDrawableArea<Code extends string>(
  { widthCssPx, heightCssPx, pixelRatio }: RenderingViewport,
  invalidMeasurementErrorCode: Code
): boolean {
  // CSS size multiplied by pixel ratio gives physical pixels: 800 CSS px at ratio 2 gives 1600 px.
  // Three.js rounds down to whole pixels: 0.4 CSS px at ratio 2 gives 0.8 px, rounded down to 0.
  const bufferWidthPx = Math.floor(widthCssPx * pixelRatio);
  const bufferHeightPx = Math.floor(heightCssPx * pixelRatio);

  if (
    !Number.isFinite(widthCssPx) ||
    !Number.isFinite(heightCssPx) ||
    !Number.isFinite(pixelRatio) ||
    widthCssPx < 0 ||
    heightCssPx < 0 ||
    pixelRatio <= 0 ||
    !Number.isFinite(bufferWidthPx) ||
    !Number.isFinite(bufferHeightPx)
  ) {
    throw new CodedError<Code>(invalidMeasurementErrorCode);
  }

  return bufferWidthPx >= 1 && bufferHeightPx >= 1;
}
