import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Scene,
} from 'three/webgpu';
import type { OrthographicCamera } from 'three/webgpu';

import type { RenderingViewport } from '@creation/rendering/types';

import {
  createCelestialVeilCamera,
  resizeCelestialVeilCamera,
} from './camera/celestial-veil-camera';
import type { CelestialVeilData, CelestialVeilGrainData } from './data/celestial-veil-data';
import {
  CELESTIAL_VEIL_GRAIN_ATTRIBUTES,
  createCelestialVeilMaterial,
} from './material/celestial-veil-material';

/** Scene-owned resources at the reference framing; the caller owns rendering and frame scheduling. */
export type CelestialVeil = Readonly<{
  scene: Scene;
  camera: OrthographicCamera;
  grainCount: number;
  /** Adapts camera framing without stretching or changing grain buffers. */
  resize: (viewport: RenderingViewport) => void;
  /** Releases the mesh, geometry and material once. Does not dispose the borrowed renderer. */
  dispose: () => void;
}>;

const BACKGROUND_COLOR_SRGB_HEX = 0x03090e;

function createGrainGeometry(grains: readonly CelestialVeilGrainData[]): PlaneGeometry {
  const colors = new Float32Array(grains.length * 3);
  const opacities = new Float32Array(grains.length);
  const softness = new Float32Array(grains.length);
  for (const [index, grain] of grains.entries()) {
    const [, , , , red, green, blue, opacity, edgeSoftness] = grain;
    colors[index * 3] = red;
    colors[index * 3 + 1] = green;
    colors[index * 3 + 2] = blue;
    opacities[index] = opacity;
    softness[index] = edgeSoftness;
  }
  const geometry = new PlaneGeometry(1, 1);
  geometry.setAttribute(
    CELESTIAL_VEIL_GRAIN_ATTRIBUTES.color,
    new InstancedBufferAttribute(colors, 3)
  );
  geometry.setAttribute(
    CELESTIAL_VEIL_GRAIN_ATTRIBUTES.opacity,
    new InstancedBufferAttribute(opacities, 1)
  );
  geometry.setAttribute(
    CELESTIAL_VEIL_GRAIN_ATTRIBUTES.softness,
    new InstancedBufferAttribute(softness, 1)
  );
  return geometry;
}

/**
 * Constructs GPU resources from validated, precomputed data. The offline tool already converts
 * image units, selects representative grains, estimates appearance and sorts far to near. The
 * caller loads/parses the asset before calling this function; no source-image interpretation or
 * color conversion occurs here. The data is not retained after constructing the buffers.
 *
 * Uses an orthographic camera with aspect-preserving reference containment on resize. Camera
 * movement requires revisiting instance ordering/facing. Artistic composition, bloom, scheduling
 * and renderer ownership remain external. The caller must dispose the returned scene resources.
 */
export function createCelestialVeil(data: CelestialVeilData): CelestialVeil {
  const { frame, grains } = data;
  const scene = new Scene();
  scene.background = new Color(BACKGROUND_COLOR_SRGB_HEX);
  const camera = createCelestialVeilCamera(frame, data.depthSpanWorldUnits);

  const geometry = createGrainGeometry(grains);
  const material = createCelestialVeilMaterial();
  const mesh = new InstancedMesh(geometry, material, grains.length);
  mesh.name = 'celestial-veil-grains';
  const matrix = new Matrix4();

  for (const [index, grain] of grains.entries()) {
    const [x, y, z, diameter] = grain;
    matrix.makeScale(diameter, diameter, 1);
    matrix.setPosition(x, y, z);
    mesh.setMatrixAt(index, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  let isDisposed = false;

  return {
    scene,
    camera,
    grainCount: grains.length,
    resize(viewport) {
      if (!isDisposed) {
        resizeCelestialVeilCamera(camera, frame, viewport);
      }
    },
    dispose() {
      if (isDisposed) {
        return;
      }

      isDisposed = true;
      scene.clear();
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
