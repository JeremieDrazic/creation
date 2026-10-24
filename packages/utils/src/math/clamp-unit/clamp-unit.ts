/** Clamps a number to [0, 1]. Infinity clamps to a boundary; NaN remains NaN. */
export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
