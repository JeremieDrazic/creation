const LINEAR_SEGMENT_LIMIT = 0.04045;
const LINEAR_SEGMENT_DIVISOR = 12.92;
const CURVE_OFFSET = 0.055;
const CURVE_SCALE = 1.055;
const CURVE_EXPONENT = 2.4;

/**
 * Converts a normalized sRGB channel in [0, 1] to linear-light sRGB, independently of a renderer.
 * Uses the transfer function in https://www.w3.org/TR/css-color-4/#color-conversion-code.
 *
 * @throws {RangeError} When the channel is non-finite or outside [0, 1].
 */
export function srgbChannelToLinear(channel: number): number {
  if (!Number.isFinite(channel) || channel < 0 || channel > 1) {
    throw new RangeError('An sRGB channel must be finite and normalized to [0, 1].');
  }

  if (channel <= LINEAR_SEGMENT_LIMIT) {
    return channel / LINEAR_SEGMENT_DIVISOR;
  }

  return ((channel + CURVE_OFFSET) / CURVE_SCALE) ** CURVE_EXPONENT;
}
