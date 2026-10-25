import { expect, test } from 'vitest';

import {
  CELESTIAL_VEIL_GRAIN_COLUMNS,
  parseCelestialVeilData,
  type CelestialVeilData,
  type CelestialVeilGrainData,
} from './celestial-veil-data';

const GRAIN: CelestialVeilGrainData = [1.5, 2.5, 10, 2, 0.2, 0.3, 0.4, 0.5, 0.6];

function fixture(): CelestialVeilData {
  return {
    schemaVersion: 1,
    frame: { widthPx: 10, heightPx: 10 },
    depthSpanWorldUnits: 100,
    columns: CELESTIAL_VEIL_GRAIN_COLUMNS,
    grains: [GRAIN],
  };
}

test('accepts a frozen prepared asset without modifying its values or order', () => {
  const data = fixture();
  Object.freeze(data.grains);
  const before = structuredClone(data);
  expect(parseCelestialVeilData(data)).toEqual(data);
  expect(data).toEqual(before);
});

test.each([
  null,
  [],
  {},
  { schemaVersion: 2 },
  { ...fixture(), frame: { widthPx: 0, heightPx: 10 } },
])('rejects unsupported schema or frame: %j', (value) => {
  expect(() => parseCelestialVeilData(value)).toThrow(RangeError);
});

test('rejects reordered columns so a valid number cannot silently acquire a different meaning', () => {
  expect(() =>
    parseCelestialVeilData({ ...fixture(), columns: [...CELESTIAL_VEIL_GRAIN_COLUMNS].reverse() })
  ).toThrow(RangeError);
});

test('rejects a non-finite value in every field', () => {
  for (let index = 0; index < GRAIN.length; index += 1) {
    for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const row = [...GRAIN];
      row[index] = invalid;
      expect(() => parseCelestialVeilData({ ...fixture(), grains: [row] })).toThrow(RangeError);
    }
  }
});

test('rejects missing row entries and missing rows in sparse arrays', () => {
  const row: number[] = [];
  row.length = GRAIN.length;
  const rows: unknown[] = [];
  rows.length = 1;
  expect(() => parseCelestialVeilData({ ...fixture(), grains: [row] })).toThrow(RangeError);
  expect(() => parseCelestialVeilData({ ...fixture(), grains: rows })).toThrow(RangeError);
});

test('rejects invalid size, color, opacity, softness and position', () => {
  for (const [index, invalid] of [
    [0, -1],
    [1, 11],
    [2, 101],
    [3, 0],
    [4, 1.1],
    [7, -0.1],
    [8, 1.1],
  ] as const) {
    const row = [...GRAIN];
    row[index] = invalid;
    expect(() => parseCelestialVeilData({ ...fixture(), grains: [row] })).toThrow(RangeError);
  }
});

test('rejects near-to-far order and accepts equal-depth grains', () => {
  const near: CelestialVeilGrainData = [1.5, 2.5, 90, 2, 0.2, 0.3, 0.4, 0.5, 0.6];
  expect(() => parseCelestialVeilData({ ...fixture(), grains: [near, GRAIN] })).toThrow(RangeError);
  expect(() =>
    parseCelestialVeilData({ ...fixture(), grains: [GRAIN, GRAIN, near] })
  ).not.toThrow();
});
