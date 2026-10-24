import {
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicNodeMaterial,
  PlaneGeometry,
  Vector3,
} from 'three/webgpu';
import { expect, test, vi } from 'vitest';

import { createCelestialVeil, type CelestialVeil } from './celestial-veil';
import { CELESTIAL_VEIL_GRAIN_ATTRIBUTES } from './material/celestial-veil-material';
import {
  prepareCelestialVeilData,
  type CelestialVeilReferencePoint,
} from './preparation/prepare-celestial-veil-grain';

const FRAME = { widthPx: 1536, heightPx: 512 };

function referencePoint(x: number, y: number, depth: number): CelestialVeilReferencePoint {
  return {
    x,
    y,
    representative: true,
    appearance: { type: 'fine-grain' },
    measurements: {
      peakMeanRgb: 100,
      localBackgroundMeanRgb: 10,
      centerSrgb: [70, 100, 130],
      equivalentDiameter20Px: 3,
      equivalentDiameter50Px: 2,
      equivalentDiameter80Px: 1,
    },
    color: { observedSrgb: [40, 70, 100] },
    depth: { normalized: depth },
  };
}

function readResources(veil: CelestialVeil) {
  const mesh = veil.scene.children[0];
  if (!(mesh instanceof InstancedMesh) || !(mesh.material instanceof MeshBasicNodeMaterial)) {
    throw new Error('Expected one instanced grain mesh and its node material.');
  }
  const geometry: unknown = mesh.geometry;
  if (!(geometry instanceof PlaneGeometry)) {
    throw new Error('Expected shared square grain geometry.');
  }
  return { mesh, geometry, material: mesh.material };
}

test('projects source pixel centers exactly while ordering different depths far to near', () => {
  const points = Object.freeze([
    referencePoint(1535, 511, 1),
    referencePoint(0, 0, 0),
    referencePoint(341, 200, 0.5),
  ]);
  const before = structuredClone(points);
  const veil = createCelestialVeil(prepareCelestialVeilData({ frame: FRAME, points }));
  const { mesh } = readResources(veil);
  const expected = [points[1], points[2], points[0]];
  const matrix = new Matrix4();
  const position = new Vector3();
  let previousZ = Number.NEGATIVE_INFINITY;

  for (const [index, point] of expected.entries()) {
    if (point === undefined) {
      throw new Error('Expected a source point for every instance.');
    }
    mesh.getMatrixAt(index, matrix);
    position.setFromMatrixPosition(matrix);
    expect(position.z).toBeGreaterThan(previousZ);
    previousZ = position.z;
    position.project(veil.camera);
    expect(((position.x + 1) * FRAME.widthPx) / 2).toBeCloseTo(point.x + 0.5);
    expect(((1 - position.y) * FRAME.heightPx) / 2).toBeCloseTo(point.y + 0.5);
  }

  expect(points).toEqual(before);
  veil.dispose();
});

test('draws representatives only and keeps independent per-instance attributes aligned', () => {
  const first = referencePoint(100, 100, 0);
  const second = {
    ...referencePoint(200, 200, 1),
    color: { observedSrgb: [100, 50, 10] },
  };
  const duplicate = { ...first, x: 101, representative: false };
  const veil = createCelestialVeil(
    prepareCelestialVeilData({ frame: FRAME, points: [second, duplicate, first] })
  );
  const { mesh, geometry } = readResources(veil);
  const colors = geometry.getAttribute(CELESTIAL_VEIL_GRAIN_ATTRIBUTES.color);
  if (!(colors instanceof InstancedBufferAttribute)) {
    throw new Error('Expected per-instance color attributes.');
  }

  expect(veil.grainCount).toBe(2);
  expect(mesh.count).toBe(2);
  expect(colors.count).toBe(2);
  expect(colors.getZ(0)).toBeGreaterThan(colors.getX(0));
  expect(colors.getX(1)).toBeGreaterThan(colors.getZ(1));
  veil.dispose();
});

test('keeps unresolved null-size and no-contrast entries finite without inventing light', () => {
  const point = referencePoint(100, 100, 0.5);
  const unresolved = {
    ...point,
    appearance: { type: 'undetermined' },
    measurements: {
      ...point.measurements,
      peakMeanRgb: 10,
      localBackgroundMeanRgb: 10,
      centerSrgb: [0, 0, 0],
      equivalentDiameter20Px: null,
      equivalentDiameter50Px: null,
      equivalentDiameter80Px: null,
    },
    color: { observedSrgb: null },
  };
  const veil = createCelestialVeil(
    prepareCelestialVeilData({ frame: FRAME, points: [unresolved] })
  );
  const { mesh, geometry } = readResources(veil);
  const opacity = geometry.getAttribute(CELESTIAL_VEIL_GRAIN_ATTRIBUTES.opacity);
  const matrix = new Matrix4();
  mesh.getMatrixAt(0, matrix);

  expect(matrix.elements.every(Number.isFinite)).toBe(true);
  expect(opacity.getX(0)).toBe(0);
  veil.dispose();
});

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  'rejects invalid frame width %s',
  (widthPx) => {
    expect(() =>
      createCelestialVeil(prepareCelestialVeilData({ frame: { ...FRAME, widthPx }, points: [] }))
    ).toThrow(RangeError);
  }
);

test('rejects out-of-frame positions, invalid depth and invalid color before scene allocation', () => {
  const point = referencePoint(100, 100, 0.5);
  for (const invalid of [
    { ...point, x: FRAME.widthPx },
    { ...point, depth: { normalized: 2 } },
    { ...point, color: { observedSrgb: [255, Number.NaN, 0] } },
  ]) {
    expect(() =>
      createCelestialVeil(prepareCelestialVeilData({ frame: FRAME, points: [invalid] }))
    ).toThrow(RangeError);
  }
});

test('releases all owned resources once and detaches the grain mesh', () => {
  const veil = createCelestialVeil(
    prepareCelestialVeilData({ frame: FRAME, points: [referencePoint(100, 100, 0.5)] })
  );
  const { mesh, geometry, material } = readResources(veil);
  const disposeMesh = vi.spyOn(mesh, 'dispose');
  const disposeGeometry = vi.spyOn(geometry, 'dispose');
  const disposeMaterial = vi.spyOn(material, 'dispose');

  veil.dispose();
  veil.dispose();

  expect(disposeMesh).toHaveBeenCalledOnce();
  expect(disposeGeometry).toHaveBeenCalledOnce();
  expect(disposeMaterial).toHaveBeenCalledOnce();
  expect(veil.scene.children).toHaveLength(0);
});
