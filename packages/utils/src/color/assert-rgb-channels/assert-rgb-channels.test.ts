import { describe, expect, it } from 'vitest';

import { assertRgbChannels } from './assert-rgb-channels';

describe('assertRgbChannels', () => {
  it.each([
    { channels: [0, 0, 0] },
    { channels: [255, 255, 255] },
    { channels: [0, 127.5, 255] },
    { channels: [255, 0, 128] },
    { channels: [0.001, 254.999, 100] },
  ])('accepts $channels without converting, rounding or mutating them', ({ channels }) => {
    const before = [...channels];
    Object.freeze(channels);

    expect(assertRgbChannels(channels)).toBeUndefined();
    expect(channels).toEqual(before);
  });

  it.each([
    { channels: [] },
    { channels: [0] },
    { channels: [0, 255] },
    { channels: [0, 1, 2, 3] },
  ])('rejects a channel count other than three: $channels', ({ channels }) => {
    expect(() => assertRgbChannels(channels)).toThrow(RangeError);
  });

  it.each([-0.001, 255.001, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY])(
    'rejects invalid value %s in any of the three channels',
    (invalid) => {
      for (let index = 0; index < 3; index += 1) {
        const channels = [10, 20, 30];
        channels[index] = invalid;

        expect(() => assertRgbChannels(channels)).toThrow(RangeError);
      }
    }
  );

  it('rejects missing entries in sparse arrays even when their length is three', () => {
    const emptyChannels: number[] = [];
    emptyChannels.length = 3;
    const missingGreen: number[] = [];
    missingGreen[0] = 100;
    missingGreen[2] = 200;

    expect(() => assertRgbChannels(emptyChannels)).toThrow(RangeError);
    expect(() => assertRgbChannels(missingGreen)).toThrow(RangeError);
  });
});
