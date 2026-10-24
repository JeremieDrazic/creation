import { describe, expect, it } from 'vitest';

import { srgbChannelToLinear } from './srgb-channel-to-linear';

describe('srgbChannelToLinear', () => {
  it.each([
    { srgb: 0, linear: 0 },
    { srgb: 0.04045, linear: 0.0031308049535603713 },
    { srgb: 0.1, linear: 0.010022825574869039 },
    { srgb: 0.5, linear: 0.21404114048223255 },
    { srgb: 0.75, linear: 0.5225215539683921 },
    { srgb: 1, linear: 1 },
  ])('converts reference channel $srgb to $linear', ({ srgb, linear }) => {
    expect(srgbChannelToLinear(srgb)).toBeCloseTo(linear, 12);
  });

  it.each([-0.001, 1.001, 255, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY])(
    'rejects invalid or non-normalized input %s',
    (channel) => {
      expect(() => srgbChannelToLinear(channel)).toThrow(RangeError);
    }
  );

  it('preserves the increasing order and bounds of all 8-bit channel values', () => {
    let previous = srgbChannelToLinear(0);
    for (let channel = 1; channel <= 255; channel += 1) {
      const linear = srgbChannelToLinear(channel / 255);
      expect(linear).toBeGreaterThan(previous);
      expect(linear).toBeLessThanOrEqual(1);
      previous = linear;
    }
  });
});
