import type { WebGPURenderer } from 'three/webgpu';

import type {
  FrameTime,
  RenderingHost,
  RenderingViewport,
  RenderingViewportController,
} from '../../types';

/**
 * Applies pending viewport changes and draws within the same synchronous frame callback. Empty
 * drawing areas skip camera/buffer changes and drawing. Unchanged dimensions only require drawing.
 * The caller owns scheduling and failure handling; this function stores no state or subscriptions.
 *
 * @throws Propagates measurement, resize and drawing failures without invoking later frame steps.
 */
export function renderFrameWithViewport(
  frameTime: FrameTime,
  host: RenderingHost,
  viewportController: RenderingViewportController,
  onViewportChange: (viewport: RenderingViewport) => void,
  onFrame: (renderer: WebGPURenderer, frameTime: FrameTime) => void
): void {
  const frameViewport = viewportController.readViewportForFrame();

  if (!frameViewport.hasDrawableArea) {
    return;
  }

  if (frameViewport.hasChanged) {
    host.resize(frameViewport.viewport);
    onViewportChange(frameViewport.viewport);
  }

  onFrame(host.renderer, frameTime);
}
