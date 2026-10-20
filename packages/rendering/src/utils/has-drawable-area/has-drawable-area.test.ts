import { describe, expect, test } from 'vitest';

import { hasDrawableArea } from './has-drawable-area';

const VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 } as const;

describe('physical drawing area', () => {
  test('uses physical pixels rather than CSS size to decide whether drawing is possible', () => {
    expect(
      hasDrawableArea({ ...VIEWPORT, widthCssPx: 0.4, pixelRatio: 2 }, 'TEST_INVALID_MEASUREMENT')
    ).toBe(false);
    expect(
      hasDrawableArea({ ...VIEWPORT, widthCssPx: 0.5, pixelRatio: 2 }, 'TEST_INVALID_MEASUREMENT')
    ).toBe(true);
    expect(hasDrawableArea({ ...VIEWPORT, heightCssPx: 0 }, 'TEST_INVALID_MEASUREMENT')).toBe(
      false
    );
  });

  test('rejects measurements that overflow the drawing dimensions', () => {
    expect(() =>
      hasDrawableArea(
        { ...VIEWPORT, widthCssPx: Number.MAX_VALUE, pixelRatio: 2 },
        'TEST_INVALID_MEASUREMENT'
      )
    ).toThrow(expect.objectContaining({ code: 'TEST_INVALID_MEASUREMENT' }));
  });
});
