import { Vector3 } from 'three/webgpu';
import { expect, test } from 'vitest';

import {
  createCelestialVeilCamera,
  getCelestialVeilCameraBounds,
  resizeCelestialVeilCamera,
} from './celestial-veil-camera';

const FRAME = { widthPx: 1536, heightPx: 512 };

test('preserves the original projection at the reference aspect ratio', () => {
  expect(getCelestialVeilCameraBounds(FRAME, { widthCssPx: 1536, heightCssPx: 512 })).toEqual({
    left: 0,
    right: 1536,
    top: 512,
    bottom: 0,
  });
});

test.each([
  { widthCssPx: 640, heightCssPx: 480 },
  { widthCssPx: 1280, heightCssPx: 720 },
  { widthCssPx: 1920, heightCssPx: 1080 },
  { widthCssPx: 3440, heightCssPx: 1440 },
  { widthCssPx: 2400, heightCssPx: 600 },
  { widthCssPx: 720, heightCssPx: 1280 },
])(
  'keeps circular grains round and the reference in view at $widthCssPx × $heightCssPx',
  (viewport) => {
    const camera = createCelestialVeilCamera(FRAME, 100);
    resizeCelestialVeilCamera(camera, FRAME, viewport);

    const center = new Vector3(768, 256, 50).project(camera);
    const horizontal = new Vector3(778, 256, 50).project(camera);
    const vertical = new Vector3(768, 266, 50).project(camera);
    const horizontalSizePx = ((horizontal.x - center.x) * viewport.widthCssPx) / 2;
    const verticalSizePx = ((vertical.y - center.y) * viewport.heightCssPx) / 2;
    expect(horizontalSizePx).toBeGreaterThan(0);
    expect(horizontalSizePx).toBeCloseTo(verticalSizePx, 10);

    for (const depth of [0, 100]) {
      for (const [x, y] of [
        [0, 0],
        [1536, 512],
      ]) {
        const corner = new Vector3(x, y, depth).project(camera);
        expect(Math.abs(corner.x)).toBeLessThanOrEqual(1 + Number.EPSILON);
        expect(Math.abs(corner.y)).toBeLessThanOrEqual(1 + Number.EPSILON);
        expect(Math.abs(corner.z)).toBeLessThanOrEqual(1);
      }
    }
  }
);

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  'rejects invalid dimensions %s before changing an existing camera',
  (invalid) => {
    const camera = createCelestialVeilCamera(FRAME, 100);
    const before = camera.projectionMatrix.clone();
    expect(() =>
      resizeCelestialVeilCamera(camera, FRAME, {
        widthCssPx: invalid,
        heightCssPx: 720,
      })
    ).toThrow(RangeError);
    expect(() =>
      getCelestialVeilCameraBounds(
        { ...FRAME, heightPx: invalid },
        {
          widthCssPx: 1280,
          heightCssPx: 720,
        }
      )
    ).toThrow(RangeError);
    expect(camera.projectionMatrix.equals(before)).toBe(true);
  }
);
