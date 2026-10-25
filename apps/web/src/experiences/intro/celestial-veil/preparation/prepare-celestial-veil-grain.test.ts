import { readFileSync } from 'node:fs';

import { expect, test } from 'vitest';

import { parseCelestialVeilData } from '../data/celestial-veil-data';
import {
  prepareCelestialVeilData,
  type CelestialVeilReference,
} from './prepare-celestial-veil-grain';

test('the committed compact asset matches offline preparation of the complete research source', () => {
  const sourceUrl = new URL(
    '../../../../../../../moodboard/intro/07-celestial-veil-classified-points.json',
    import.meta.url
  );
  const assetUrl = new URL('../../assets/celestial-veil/celestial-veil-data.json', import.meta.url);
  const reference = JSON.parse(readFileSync(sourceUrl, 'utf8')) as CelestialVeilReference;
  const before = JSON.stringify(reference);
  const downloaded: unknown = JSON.parse(readFileSync(assetUrl, 'utf8'));
  const expected = prepareCelestialVeilData(reference);

  expect(expected.grains).toHaveLength(5674);
  expect(parseCelestialVeilData(downloaded)).toEqual(expected);
  expect(JSON.stringify(reference)).toBe(before);
});
