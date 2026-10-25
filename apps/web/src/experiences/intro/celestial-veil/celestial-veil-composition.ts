/** Mutable artistic settings owned by one veil instance; independent of source grain data. */
export type CelestialVeilComposition = {
  /** Additional rotation around the reference frame's center; positive is counterclockwise. */
  rotationDegrees: number;
  /** Uniform scale around the reference frame's center; 1 retains the current framing. */
  scale: number;
  /** Horizontal displacement as a fraction of viewport width; positive moves right. */
  offsetXViewportRatio: number;
  /** Vertical displacement as a fraction of viewport height; positive moves up. */
  offsetYViewportRatio: number;
  /** Additional grain diameter multiplier, without changing grain positions; 1 retains size. */
  grainScale: number;
};

/** Creates fresh settings for each owner. Neutral values preserve the existing composition. */
export function createCelestialVeilComposition(): CelestialVeilComposition {
  return {
    rotationDegrees: 0,
    scale: 1,
    offsetXViewportRatio: 0,
    offsetYViewportRatio: 0,
    grainScale: 1,
  };
}
