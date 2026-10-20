import type { RenderingViewport } from '../../types';

/** Compares CSS dimensions and resolution; a pixel-ratio-only change also requires a resize. */
export function hasViewportChanged(
  viewport: RenderingViewport,
  previous: RenderingViewport
): boolean {
  return (
    viewport.widthCssPx !== previous.widthCssPx ||
    viewport.heightCssPx !== previous.heightCssPx ||
    viewport.pixelRatio !== previous.pixelRatio
  );
}
