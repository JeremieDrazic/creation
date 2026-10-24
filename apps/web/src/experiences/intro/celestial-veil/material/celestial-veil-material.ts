import { attribute, float, fwidth, smoothstep, uv } from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';

/** Attribute names shared with the grain geometry. Values may vary per grain instance. */
export const CELESTIAL_VEIL_GRAIN_ATTRIBUTES = {
  color: 'grainColorLinear',
  opacity: 'grainOpacity',
  softness: 'grainEdgeSoftness',
} as const;

const MIN_EDGE_WIDTH = 0.001;

/**
 * Creates an unlit circular grain on a camera-facing square with UV coordinates from 0 to 1.
 * Geometry controls the apparent diameter and placement; this material only controls appearance.
 *
 * Required geometry attributes:
 *
 * - GrainColorLinear: vec3 RGB in Three.js's linear working color space, not source-image sRGB.
 * - GrainOpacity: float from 0 to 1, an authored opacity rather than measured image brightness.
 * - GrainEdgeSoftness: float from 0 to 1; 0 keeps a compact disk, 1 fades across its whole radius.
 *
 * Uses ordinary alpha blending. The scene must order transparent grains appropriately. Transparent
 * fragments do not write depth, so square geometry cannot hide grains behind it. No bloom,
 * lighting, animation, camera or frame scheduling is owned here.
 *
 * The caller owns this material and must dispose it when releasing the scene. Create once during
 * preparation and share across grains; no material or GPU state is created at module import.
 */
export function createCelestialVeilMaterial(): MeshBasicNodeMaterial {
  const radialDistance = uv().sub(0.5).mul(2).length();
  const softness = attribute(CELESTIAL_VEIL_GRAIN_ATTRIBUTES.softness, 'float').clamp(0, 1);

  // fwidth estimates how much this distance changes across a screen pixel, keeping hard edges
  // from becoming a binary cutoff. It does not recover subpixel detail from the source image.
  const pixelWidth = fwidth(radialDistance).max(MIN_EDGE_WIDTH);
  const edgeWidth = softness.max(pixelWidth).min(1);
  const edgeStart = float(1).sub(edgeWidth);
  const coverage = smoothstep(edgeStart, 1, radialDistance).oneMinus();
  const opacity = attribute(CELESTIAL_VEIL_GRAIN_ATTRIBUTES.opacity, 'float').clamp(0, 1);

  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  material.name = 'celestial-veil-grain';
  material.colorNode = attribute(CELESTIAL_VEIL_GRAIN_ATTRIBUTES.color, 'vec3');
  material.opacityNode = coverage.mul(opacity);

  return material;
}
