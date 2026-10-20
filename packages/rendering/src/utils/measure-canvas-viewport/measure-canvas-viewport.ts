import type { RenderingViewport } from '../../types';

/**
 * Reads integer CSS layout dimensions before transforms; the caller selects drawing resolution.
 * clientWidth/clientHeight include padding, so keep the canvas unpadded and place decoration on its
 * container. Bounding rectangles include borders/transforms and are not used for this measurement.
 * Validation and empty-area handling belong to the viewport controller.
 */
export function measureCanvasViewport(
  canvas: HTMLCanvasElement,
  readPixelRatio: () => number
): RenderingViewport {
  return {
    widthCssPx: canvas.clientWidth,
    heightCssPx: canvas.clientHeight,
    pixelRatio: readPixelRatio(),
  };
}
