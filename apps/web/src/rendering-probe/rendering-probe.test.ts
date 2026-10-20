import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  Vector3,
} from 'three/webgpu';
import { expect, test, vi } from 'vitest';

import { createRenderingProbe, type RenderingProbe } from './rendering-probe';

const INITIAL_ASPECT_RATIO = 1;

/** Narrows real scene objects without mocking Three.js resource or camera behavior. */
function readTriangleResources(probe: RenderingProbe) {
  const triangle = probe.scene.children[0];
  if (
    !(triangle instanceof Mesh) ||
    !(triangle.geometry instanceof BufferGeometry) ||
    !(triangle.material instanceof MeshBasicNodeMaterial)
  ) {
    throw new Error('Expected a triangle mesh with its geometry and node material.');
  }
  return { geometry: triangle.geometry, material: triangle.material };
}

test('creates one triangle with position and normal attributes and an orthographic camera', () => {
  const probe = createRenderingProbe(INITIAL_ASPECT_RATIO);
  const { geometry } = readTriangleResources(probe);
  const positions: unknown = geometry.getAttribute('position');
  const normals: unknown = geometry.getAttribute('normal');
  if (!(positions instanceof BufferAttribute) || !(normals instanceof BufferAttribute)) {
    throw new Error('Expected position and normal buffers.');
  }

  expect(probe.scene.children).toHaveLength(1);
  expect(positions.count).toBe(3);
  expect(normals.count).toBe(3);
  expect(probe.camera.isOrthographicCamera).toBe(true);
  probe.dispose();
});

test.each([
  { widthCssPx: 1200, heightCssPx: 600 },
  { widthCssPx: 600, heightCssPx: 1200 },
  { widthCssPx: 900, heightCssPx: 900 },
])('projects equal world distances into equal CSS distances after resize: %j', (viewport) => {
  const probe = createRenderingProbe(INITIAL_ASPECT_RATIO);
  const { geometry, material } = readTriangleResources(probe);
  probe.resize(viewport.widthCssPx / viewport.heightCssPx);
  probe.camera.updateMatrixWorld();

  const origin = new Vector3(0, 0, 0).project(probe.camera);
  const horizontalPoint = new Vector3(1, 0, 0).project(probe.camera);
  const verticalPoint = new Vector3(0, 1, 0).project(probe.camera);
  // Projection produces coordinates in [-1, 1]; convert distances using half the CSS span.
  const horizontalDistanceCssPx = ((horizontalPoint.x - origin.x) * viewport.widthCssPx) / 2;
  const verticalDistanceCssPx = ((verticalPoint.y - origin.y) * viewport.heightCssPx) / 2;

  expect(horizontalDistanceCssPx).toBeCloseTo(verticalDistanceCssPx);
  expect(verticalDistanceCssPx).toBeCloseTo(viewport.heightCssPx / 2);
  const resizedResources = readTriangleResources(probe);
  expect(resizedResources.geometry).toBe(geometry);
  expect(resizedResources.material).toBe(material);
  probe.dispose();
});

test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  'rejects an invalid initial aspect ratio: %s',
  (aspectRatio) => {
    expect(() => createRenderingProbe(aspectRatio)).toThrow(RangeError);
  }
);

test('rejects invalid resize before changing the current camera projection', () => {
  const probe = createRenderingProbe(INITIAL_ASPECT_RATIO);
  const projectionBeforeResize = probe.camera.projectionMatrix.clone();

  expect(() => probe.resize(0)).toThrow(RangeError);
  expect(probe.camera.projectionMatrix.equals(projectionBeforeResize)).toBe(true);
  probe.dispose();
});

test('disposes owned resources once, detaches scene objects and prevents later resize', () => {
  const probe = createRenderingProbe(INITIAL_ASPECT_RATIO);
  const { geometry, material } = readTriangleResources(probe);
  const disposeGeometry = vi.spyOn(geometry, 'dispose');
  const disposeMaterial = vi.spyOn(material, 'dispose');

  probe.dispose();
  probe.dispose();

  expect(disposeGeometry).toHaveBeenCalledOnce();
  expect(disposeMaterial).toHaveBeenCalledOnce();
  expect(probe.scene.children).toHaveLength(0);
  expect(() => probe.resize(INITIAL_ASPECT_RATIO)).toThrow(
    'Cannot resize a disposed rendering probe.'
  );
});
