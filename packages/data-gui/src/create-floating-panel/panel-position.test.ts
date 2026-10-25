import { expect, test } from 'vitest';

import { clampPanelPosition } from './panel-position';

test.each([
  { position: { x: 60, y: 80 }, expected: { x: 60, y: 80 } },
  { position: { x: -40, y: -20 }, expected: { x: 12, y: 12 } },
  { position: { x: 2000, y: 2000 }, expected: { x: 708, y: 336 } },
])('keeps the full panel reachable for $position', ({ position, expected }) => {
  expect(
    clampPanelPosition(position, { width: 304, height: 420 }, { width: 1024, height: 768 })
  ).toEqual(expected);
});

test('preserves access to the handle even if the panel is larger than the viewport', () => {
  expect(
    clampPanelPosition({ x: 600, y: 500 }, { width: 304, height: 420 }, { width: 280, height: 300 })
  ).toEqual({ x: 12, y: 12 });
});
