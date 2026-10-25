import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { parseCelestialVeilData } from '../src/experiences/intro/celestial-veil/data/celestial-veil-data.ts';
import {
  prepareCelestialVeilData,
  type CelestialVeilReference,
} from '../src/experiences/intro/celestial-veil/preparation/prepare-celestial-veil-grain.ts';

const sourceUrl = new URL(
  '../../../moodboard/intro/07-celestial-veil-classified-points.json',
  import.meta.url
);
const directoryUrl = new URL('../src/experiences/intro/assets/celestial-veil/', import.meta.url);
const assetUrl = new URL('celestial-veil-data.json', directoryUrl);
const source = await readFile(sourceUrl);
// This is the checked-in research artifact; preparation validates its numeric point values.
const reference = JSON.parse(source.toString('utf8')) as CelestialVeilReference;
const data = prepareCelestialVeilData(reference);
parseCelestialVeilData(data);
const asset =
  JSON.stringify({ ...data, sourceSha256: createHash('sha256').update(source).digest('hex') }) +
  '\n';
await mkdir(directoryUrl, { recursive: true });
await writeFile(assetUrl, asset);
console.log(
  JSON.stringify(
    {
      asset: fileURLToPath(assetUrl),
      grains: data.grains.length,
      sourceBytes: source.length,
      assetBytes: Buffer.byteLength(asset),
      gzipBytes: gzipSync(asset).length,
    },
    null,
    2
  )
);
