import { describe, expect, test } from 'vitest';

import { hasViewportChanged } from './has-viewport-changed';

const VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 } as const;

describe('viewport comparisons', () => {
  test('compares values rather than object identity', () => {
    expect(hasViewportChanged({ ...VIEWPORT }, VIEWPORT)).toBe(false);
  });

  test.each([
    { ...VIEWPORT, widthCssPx: 900 },
    { ...VIEWPORT, heightCssPx: 700 },
    { ...VIEWPORT, pixelRatio: 2 },
  ])('detects a dimension or resolution change: %j', (nextViewport) => {
    expect(hasViewportChanged(nextViewport, VIEWPORT)).toBe(true);
  });
});
