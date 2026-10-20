import type { WebGPURenderer } from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';

import type { RenderingHost } from '../../rendering-host/rendering-host';
import { createRenderingViewport } from '../../rendering-viewport/rendering-viewport';
import type { FrameTime } from '../../types';
import { renderFrameWithViewport } from './render-frame-with-viewport';

const INITIAL_VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 };
const FRAME_TIME: FrameTime = { deltaSeconds: 0.016, elapsedSeconds: 1 };

function createTestHost(): RenderingHost {
  return {
    renderer: {} as WebGPURenderer,
    resize: vi.fn(),
    dispose: vi.fn(async () => {}),
  };
}

describe('renderFrameWithViewport', () => {
  it('updates buffer and camera before drawing with the supplied renderer and time', () => {
    const operations: string[] = [];
    const host = createTestHost();
    const nextViewport = { ...INITIAL_VIEWPORT, widthCssPx: 1000 };
    const viewportController = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => nextViewport,
    });
    vi.spyOn(host, 'resize').mockImplementation(() => operations.push('buffer'));
    const onViewportChange = vi.fn(() => operations.push('camera'));
    const onFrame = vi.fn(() => operations.push('draw'));

    renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame);

    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(host.resize).toHaveBeenCalledExactlyOnceWith(nextViewport);
    expect(onViewportChange).toHaveBeenCalledExactlyOnceWith(nextViewport);
    expect(onFrame).toHaveBeenCalledExactlyOnceWith(host.renderer, FRAME_TIME);
  });

  it('draws unchanged frames without clearing the buffer or adjusting the camera', () => {
    const host = createTestHost();
    const measureViewport = vi.fn(() => INITIAL_VIEWPORT);
    const viewportController = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport,
    });
    const onViewportChange = vi.fn();
    const onFrame = vi.fn();

    renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame);
    renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame);

    expect(measureViewport).toHaveBeenCalledOnce();
    expect(host.resize).not.toHaveBeenCalled();
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it('skips empty layout and draws a same-size return without resizing', () => {
    const host = createTestHost();
    let viewport = { ...INITIAL_VIEWPORT, widthCssPx: 0 };
    const viewportController = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => viewport,
    });
    const onViewportChange = vi.fn();
    const onFrame = vi.fn();

    renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame);
    expect(onFrame).not.toHaveBeenCalled();
    viewport = INITIAL_VIEWPORT;
    viewportController.requestViewportMeasurement();
    renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame);

    expect(host.resize).not.toHaveBeenCalled();
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(onFrame).toHaveBeenCalledOnce();
  });

  it.each(['buffer', 'camera'] as const)('does not draw after a %s resize failure', (step) => {
    const host = createTestHost();
    const viewportController = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => ({ ...INITIAL_VIEWPORT, widthCssPx: 1000 }),
    });
    const cause = new Error('Resize failed.');
    const onViewportChange = vi.fn();
    const onFrame = vi.fn();

    if (step === 'buffer') {
      vi.spyOn(host, 'resize').mockImplementation(() => {
        throw cause;
      });
    } else {
      onViewportChange.mockImplementation(() => {
        throw cause;
      });
    }

    expect(() =>
      renderFrameWithViewport(FRAME_TIME, host, viewportController, onViewportChange, onFrame)
    ).toThrow(cause);
    expect(onFrame).not.toHaveBeenCalled();
    if (step === 'buffer') {
      expect(onViewportChange).not.toHaveBeenCalled();
    }
  });
});
