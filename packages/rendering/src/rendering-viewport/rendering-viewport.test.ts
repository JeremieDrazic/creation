import { describe, expect, test, vi } from 'vitest';

import type { RenderingViewport } from '../types';
import { createRenderingViewport } from './rendering-viewport';
import { RENDERING_VIEWPORT_ERROR_CODES } from './rendering-viewport-errors';

const INITIAL_VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 } as const;

describe('frame measurements', () => {
  test('remeasures on the first frame, coalesces notifications and reports a change once', () => {
    let currentViewport: RenderingViewport = INITIAL_VIEWPORT;
    const measureViewport = vi.fn(() => currentViewport);
    const controller = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport,
    });
    expect(measureViewport).not.toHaveBeenCalled();
    expect(controller.readViewportForFrame().hasChanged).toBe(false);

    currentViewport = { ...INITIAL_VIEWPORT, widthCssPx: 900 };
    controller.requestViewportMeasurement();
    currentViewport = { ...INITIAL_VIEWPORT, widthCssPx: 1000 };
    controller.requestViewportMeasurement();
    expect(measureViewport).toHaveBeenCalledOnce();

    const changedFrame = controller.readViewportForFrame();
    expect(changedFrame).toEqual({
      viewport: currentViewport,
      hasChanged: true,
      hasDrawableArea: true,
    });
    expect(measureViewport).toHaveBeenCalledTimes(2);
    const followingFrame = controller.readViewportForFrame();
    expect(followingFrame.hasChanged).toBe(false);
    expect(controller.readViewportForFrame()).toBe(followingFrame);
    expect(measureViewport).toHaveBeenCalledTimes(2);
    expect(changedFrame.hasChanged).toBe(true);
  });

  test('detects layout changes during initialization and pixel-ratio changes with identical CSS size', () => {
    let currentViewport: RenderingViewport = { ...INITIAL_VIEWPORT, heightCssPx: 700 };
    const controller = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => currentViewport,
    });
    expect(controller.readViewportForFrame().hasChanged).toBe(true);

    currentViewport = { ...currentViewport, pixelRatio: 2 };
    controller.requestViewportMeasurement();
    expect(controller.readViewportForFrame()).toEqual({
      viewport: currentViewport,
      hasChanged: true,
      hasDrawableArea: true,
    });
  });

  test('preserves the last drawable dimensions across empty layout and avoids resizing on same-size return', () => {
    let currentViewport: RenderingViewport = { ...INITIAL_VIEWPORT, widthCssPx: 0 };
    const controller = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => currentViewport,
    });
    expect(controller.readViewportForFrame()).toEqual({
      viewport: currentViewport,
      hasChanged: false,
      hasDrawableArea: false,
    });

    currentViewport = INITIAL_VIEWPORT;
    controller.requestViewportMeasurement();
    expect(controller.readViewportForFrame()).toEqual({
      viewport: INITIAL_VIEWPORT,
      hasChanged: false,
      hasDrawableArea: true,
    });
  });

  test('skips a positive CSS size that rounds down to an empty buffer and detects a different-size return', () => {
    let currentViewport: RenderingViewport = {
      ...INITIAL_VIEWPORT,
      widthCssPx: 0.4,
      pixelRatio: 2,
    };
    const controller = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport: () => currentViewport,
    });
    expect(controller.readViewportForFrame().hasDrawableArea).toBe(false);

    currentViewport = { ...INITIAL_VIEWPORT, widthCssPx: 1000 };
    controller.requestViewportMeasurement();
    expect(controller.readViewportForFrame().hasChanged).toBe(true);
  });

  test('copies caller-owned objects so later mutation cannot corrupt cached comparisons', () => {
    const initialViewport = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 };
    const measuredViewport = { ...initialViewport };
    const controller = createRenderingViewport({
      initialViewport,
      measureViewport: () => measuredViewport,
    });
    initialViewport.widthCssPx = 900;
    const firstFrame = controller.readViewportForFrame();
    expect(firstFrame.hasChanged).toBe(false);
    measuredViewport.widthCssPx = 1000;
    expect(firstFrame.viewport.widthCssPx).toBe(800);
    controller.requestViewportMeasurement();
    expect(controller.readViewportForFrame().hasChanged).toBe(true);
  });
});

describe('measurement failures', () => {
  test.each([
    { ...INITIAL_VIEWPORT, widthCssPx: -1 },
    { ...INITIAL_VIEWPORT, heightCssPx: Number.NaN },
    { ...INITIAL_VIEWPORT, pixelRatio: 0 },
    { ...INITIAL_VIEWPORT, pixelRatio: Number.POSITIVE_INFINITY },
    { ...INITIAL_VIEWPORT, widthCssPx: Number.MAX_VALUE, pixelRatio: 2 },
  ])(
    'rejects an invalid measurement without accepting it as the drawable baseline: %j',
    (invalid) => {
      const measureViewport = vi.fn(() => invalid);
      const controller = createRenderingViewport({
        initialViewport: INITIAL_VIEWPORT,
        measureViewport,
      });

      expect(() => controller.readViewportForFrame()).toThrow(
        expect.objectContaining({ code: RENDERING_VIEWPORT_ERROR_CODES.INVALID_MEASUREMENT })
      );
      measureViewport.mockReturnValueOnce(INITIAL_VIEWPORT);
      expect(controller.readViewportForFrame().hasChanged).toBe(false);
    }
  );

  test('preserves a measurement callback failure and retries without another notification', () => {
    const cause = new Error('Layout measurement unavailable.');
    const measureViewport = vi.fn(() => INITIAL_VIEWPORT);
    measureViewport.mockImplementationOnce(() => {
      throw cause;
    });
    const controller = createRenderingViewport({
      initialViewport: INITIAL_VIEWPORT,
      measureViewport,
    });

    expect(() => controller.readViewportForFrame()).toThrow(cause);
    expect(controller.readViewportForFrame().hasChanged).toBe(false);
    expect(measureViewport).toHaveBeenCalledTimes(2);
  });

  test.each([
    { ...INITIAL_VIEWPORT, widthCssPx: 0 },
    { ...INITIAL_VIEWPORT, heightCssPx: -1 },
    { ...INITIAL_VIEWPORT, pixelRatio: Number.NaN },
  ])('requires a valid drawable baseline before any measurement: %j', (initialViewport) => {
    const measureViewport = vi.fn(() => INITIAL_VIEWPORT);

    expect(() => createRenderingViewport({ initialViewport, measureViewport })).toThrow(
      expect.objectContaining({ code: RENDERING_VIEWPORT_ERROR_CODES.INVALID_MEASUREMENT })
    );
    expect(measureViewport).not.toHaveBeenCalled();
  });
});
