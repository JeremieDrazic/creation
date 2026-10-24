const RGB_CHANNEL_COUNT = 3;
const MAX_RGB_CHANNEL_VALUE = 255;

/**
 * Validates three RGB channels on the [0, 255] scale, allowing fractional values. Does not convert
 * color spaces or change the input. This checks numeric values, not the shape of arbitrary JSON.
 *
 * @throws {RangeError} When the channel count differs from three or a channel is non-finite or
 *   outside [0, 255].
 */
export function assertRgbChannels(channels: readonly number[]): void {
  if (channels.length !== RGB_CHANNEL_COUNT) {
    throw new RangeError('RGB must contain three finite channels from 0 to 255.');
  }

  // Array iteration visits sparse entries as undefined; Array.some would skip them.
  for (const value of channels) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_RGB_CHANNEL_VALUE) {
      throw new RangeError('RGB must contain three finite channels from 0 to 255.');
    }
  }
}
