import { describe, expect, it } from 'vitest';

import { clampUnit } from './clamp-unit';

describe('clampUnit', () => {
  it.each([
    { value: Number.NEGATIVE_INFINITY, expected: 0 },
    { value: -100, expected: 0 },
    { value: -0.001, expected: 0 },
    { value: 0, expected: 0 },
    { value: Number.EPSILON, expected: Number.EPSILON },
    { value: 0.25, expected: 0.25 },
    { value: 1 - Number.EPSILON, expected: 1 - Number.EPSILON },
    { value: 1, expected: 1 },
    { value: 1.001, expected: 1 },
    { value: 100, expected: 1 },
    { value: Number.POSITIVE_INFINITY, expected: 1 },
  ])('maps $value to $expected without rounding values inside [0, 1]', ({ value, expected }) => {
    expect(clampUnit(value)).toBe(expected);
  });

  it('preserves NaN rather than replacing an invalid calculation with a valid boundary', () => {
    expect(clampUnit(Number.NaN)).toBeNaN();
  });
});
