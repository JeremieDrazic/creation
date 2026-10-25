import { assertRgbChannels } from '@creation/utils/color/assert-rgb-channels';
import { srgbChannelToLinear } from '@creation/utils/color/srgb-channel-to-linear';
import { clampUnit } from '@creation/utils/math/clamp-unit';

import {
  CELESTIAL_VEIL_GRAIN_COLUMNS,
  type CelestialVeilData,
  type CelestialVeilGrainData,
} from '../data/celestial-veil-data.ts';

/** Only the fields needed from the offline annotation; the scene never imports the research JSON. */
export type CelestialVeilReferencePoint = Readonly<{
  x: number;
  y: number;
  representative: boolean;
  appearance: Readonly<{ type: string }>;
  measurements: Readonly<{
    peakMeanRgb: number;
    localBackgroundMeanRgb: number;
    centerSrgb: readonly number[];
    equivalentDiameter20Px: number | null;
    equivalentDiameter50Px: number | null;
    equivalentDiameter80Px: number | null;
  }>;
  color: Readonly<{ observedSrgb: readonly number[] | null }>;
  depth: Readonly<{ normalized: number }>;
}>;

export type CelestialVeilReference = Readonly<{
  frame: Readonly<{ widthPx: number; heightPx: number }>;
  points: readonly CelestialVeilReferencePoint[];
}>;

const MAX_SRGB_CHANNEL = 255;
const DEPTH_SPAN_WORLD_UNITS = 100;
const SOFTNESS_SPREAD_GAIN = 1.8;
const MIN_DIFFUSE_SOFTNESS = 0.8;
const UNDETERMINED_SOFTNESS = 0.5;
const FALLBACK_DIAMETER_PX = 1.5;
const MAX_UNDETERMINED_DIAMETER_PX = 2.5;

function assertReferencePoint(
  point: CelestialVeilReferencePoint,
  frame: CelestialVeilReference['frame']
): void {
  if (
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x >= frame.widthPx ||
    point.y < 0 ||
    point.y >= frame.heightPx ||
    !Number.isFinite(point.depth.normalized) ||
    point.depth.normalized < 0 ||
    point.depth.normalized > 1
  ) {
    throw new RangeError(
      'Grain coordinates must be inside the reference frame and depth in [0, 1].'
    );
  }

  const { measurements } = point;
  const signals = [measurements.peakMeanRgb, measurements.localBackgroundMeanRgb];
  if (signals.some((value) => !Number.isFinite(value) || value < 0 || value > MAX_SRGB_CHANNEL)) {
    throw new RangeError('Grain image signals must be finite values from 0 to 255.');
  }

  const diameters = [
    measurements.equivalentDiameter20Px,
    measurements.equivalentDiameter50Px,
    measurements.equivalentDiameter80Px,
  ];
  if (diameters.some((value) => value !== null && (!Number.isFinite(value) || value <= 0))) {
    throw new RangeError('Measured grain diameters must be finite positive values or null.');
  }

  assertRgbChannels(measurements.centerSrgb);
  if (point.color.observedSrgb !== null) {
    assertRgbChannels(point.color.observedSrgb);
  }
}

/** Candidate alpha from local excess light; this is not a recovered physical particle opacity. */
function getGrainOpacity(point: CelestialVeilReferencePoint): number {
  const peak = srgbChannelToLinear(point.measurements.peakMeanRgb / MAX_SRGB_CHANNEL);
  const background = srgbChannelToLinear(
    point.measurements.localBackgroundMeanRgb / MAX_SRGB_CHANNEL
  );
  if (background >= 1) {
    return 0;
  }

  return clampUnit((peak - background) / (1 - background));
}

/** Separates observed sRGB hue from the initial opacity estimate, without a Three.js dependency. */
function getGrainColor(point: CelestialVeilReferencePoint): readonly [number, number, number] {
  const channels = point.color.observedSrgb ?? point.measurements.centerSrgb;
  const red = channels[0] ?? 0;
  const green = channels[1] ?? 0;
  const blue = channels[2] ?? 0;
  const maximum = Math.max(1, red, green, blue);
  return [
    srgbChannelToLinear(red / maximum),
    srgbChannelToLinear(green / maximum),
    srgbChannelToLinear(blue / maximum),
  ];
}

function getGrainSoftness(point: CelestialVeilReferencePoint): number {
  if (point.appearance.type === 'undetermined') {
    return UNDETERMINED_SOFTNESS;
  }

  const measurements = point.measurements;
  const outerDiameter = measurements.equivalentDiameter20Px;
  const middleDiameter = measurements.equivalentDiameter50Px;
  const innerDiameter = measurements.equivalentDiameter80Px;
  let softness = 0;
  if (outerDiameter !== null && middleDiameter !== null && innerDiameter !== null) {
    softness = clampUnit(((outerDiameter - innerDiameter) / middleDiameter) * SOFTNESS_SPREAD_GAIN);
  }

  if (point.appearance.type === 'diffuse-dust') {
    return Math.max(MIN_DIFFUSE_SOFTNESS, softness);
  }

  return softness;
}

function getGrainDiameter(point: CelestialVeilReferencePoint, softness: number): number {
  let halfHeightDiameter = point.measurements.equivalentDiameter50Px ?? FALLBACK_DIAMETER_PX;
  if (point.appearance.type === 'undetermined') {
    // A shared cluster contour must not become one large disk for every detected maximum.
    halfHeightDiameter = Math.min(
      point.measurements.equivalentDiameter80Px ?? FALLBACK_DIAMETER_PX,
      MAX_UNDETERMINED_DIAMETER_PX
    );
  }

  // For the material's smoothstep profile, half coverage occurs at radius 1 - softness / 2.
  // Derivative smoothing can change this relation for grains smaller than a few screen pixels.
  return halfHeightDiameter / (1 - softness / 2);
}

/** Converts one measured point to a render-ready row. No GPU or browser work is performed. */
export function prepareCelestialVeilGrain(
  point: CelestialVeilReferencePoint,
  frame: CelestialVeilReference['frame']
): CelestialVeilGrainData {
  assertReferencePoint(point, frame);
  const softness = getGrainSoftness(point);
  const [red, green, blue] = getGrainColor(point);
  const values: CelestialVeilGrainData = [
    point.x + 0.5,
    frame.heightPx - point.y - 0.5,
    point.depth.normalized * DEPTH_SPAN_WORLD_UNITS,
    getGrainDiameter(point, softness),
    red,
    green,
    blue,
    getGrainOpacity(point),
    softness,
  ];
  // Match the Float32 precision used by the GPU buffers and instance matrices.
  return values.map(Math.fround) as unknown as CelestialVeilGrainData;
}

/** Validates, deduplicates and orders static source data once, offline. */
export function prepareCelestialVeilData(reference: CelestialVeilReference): CelestialVeilData {
  const { frame } = reference;
  if (
    !Number.isFinite(frame.widthPx) ||
    !Number.isFinite(frame.heightPx) ||
    frame.widthPx <= 0 ||
    frame.heightPx <= 0
  ) {
    throw new RangeError('The reference frame must have finite positive dimensions.');
  }
  const grains = reference.points
    .filter((point) => point.representative)
    .map((point) => prepareCelestialVeilGrain(point, frame))
    .sort((first, second) => first[2] - second[2]);
  return {
    schemaVersion: 1,
    frame: { widthPx: frame.widthPx, heightPx: frame.heightPx },
    depthSpanWorldUnits: DEPTH_SPAN_WORLD_UNITS,
    columns: CELESTIAL_VEIL_GRAIN_COLUMNS,
    grains,
  };
}
