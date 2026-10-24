/** Fixed columns keep the generated JSON compact while documenting every value's meaning. */
export const CELESTIAL_VEIL_GRAIN_COLUMNS = [
  'x',
  'y',
  'z',
  'diameter',
  'redLinear',
  'greenLinear',
  'blueLinear',
  'opacity',
  'softness',
] as const;

/** XY/diameter use reference-pixel world units; RGB is linear sRGB; opacity/softness use [0, 1]. */
export type CelestialVeilGrainData = readonly [
  x: number,
  y: number,
  z: number,
  diameter: number,
  redLinear: number,
  greenLinear: number,
  blueLinear: number,
  opacity: number,
  softness: number,
];

/** Prepared offline, with representative grains already ordered far to near. */
export type CelestialVeilData = Readonly<{
  schemaVersion: 1;
  frame: Readonly<{ widthPx: number; heightPx: number }>;
  depthSpanWorldUnits: number;
  columns: typeof CELESTIAL_VEIL_GRAIN_COLUMNS;
  grains: readonly CelestialVeilGrainData[];
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isGrainData(
  value: unknown,
  width: number,
  height: number,
  depthSpan: number
): value is CelestialVeilGrainData {
  if (!Array.isArray(value) || value.length !== CELESTIAL_VEIL_GRAIN_COLUMNS.length) {
    return false;
  }
  const values: readonly unknown[] = value;
  for (const channel of values) {
    if (typeof channel !== 'number' || !Number.isFinite(channel)) {
      return false;
    }
  }
  const [x, y, z, diameter, ...channels] = values as CelestialVeilGrainData;
  return (
    x >= 0 &&
    x <= width &&
    y >= 0 &&
    y <= height &&
    z >= 0 &&
    z <= depthSpan &&
    diameter > 0 &&
    channels.every((channel) => channel >= 0 && channel <= 1)
  );
}

/** Validates downloaded JSON once before constructing GPU resources; never converts its values. */
export function parseCelestialVeilData(value: unknown): CelestialVeilData {
  if (!isRecord(value) || value['schemaVersion'] !== 1 || !isRecord(value['frame'])) {
    throw new RangeError('Unsupported celestial veil asset schema.');
  }
  const widthPx = value['frame']['widthPx'];
  const heightPx = value['frame']['heightPx'];
  const depthSpan = value['depthSpanWorldUnits'];
  if (!isPositiveNumber(widthPx) || !isPositiveNumber(heightPx) || !isPositiveNumber(depthSpan)) {
    throw new RangeError('Veil frame and depth span must be finite positive dimensions.');
  }
  const columns: unknown = value['columns'];
  if (
    !Array.isArray(columns) ||
    columns.length !== CELESTIAL_VEIL_GRAIN_COLUMNS.length ||
    CELESTIAL_VEIL_GRAIN_COLUMNS.some((name, index) => columns[index] !== name)
  ) {
    throw new RangeError('Unexpected celestial veil asset columns.');
  }
  const input: unknown = value['grains'];
  if (!Array.isArray(input)) {
    throw new RangeError('Veil grains must be an array.');
  }
  const rows: readonly unknown[] = input;
  let previousDepth = Number.NEGATIVE_INFINITY;
  for (const row of rows) {
    if (!isGrainData(row, widthPx, heightPx, depthSpan) || row[2] < previousDepth) {
      throw new RangeError('Veil grains must contain valid finite values ordered far to near.');
    }
    previousDepth = row[2];
  }
  return {
    schemaVersion: 1,
    frame: { widthPx, heightPx },
    depthSpanWorldUnits: depthSpan,
    columns: CELESTIAL_VEIL_GRAIN_COLUMNS,
    grains: rows as readonly CelestialVeilGrainData[],
  };
}
