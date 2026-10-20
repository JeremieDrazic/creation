import { describe, expect, it, vi } from 'vitest';

import { measureCanvasViewport } from './measure-canvas-viewport';

describe('measureCanvasViewport', () => {
  it('uses layout dimensions rather than transformed bounds and keeps caller-selected resolution', () => {
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      // A CSS scale changes displayed bounds, not the layout dimensions used for drawing.
      getBoundingClientRect: vi.fn(() => ({ width: 400, height: 300 })),
    };
    let selectedPixelRatio = 3;
    const readPixelRatio = () => selectedPixelRatio;

    const firstMeasurement = measureCanvasViewport(
      canvas as unknown as HTMLCanvasElement,
      readPixelRatio
    );
    expect(firstMeasurement).toEqual({ widthCssPx: 800, heightCssPx: 600, pixelRatio: 3 });

    canvas.clientWidth = 0;
    selectedPixelRatio = 1;
    expect(measureCanvasViewport(canvas as unknown as HTMLCanvasElement, readPixelRatio)).toEqual({
      widthCssPx: 0,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    expect(firstMeasurement.widthCssPx).toBe(800);
    expect(canvas.getBoundingClientRect).not.toHaveBeenCalled();
  });
});
