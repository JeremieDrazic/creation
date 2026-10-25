import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
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
import {
  createCelestialVeilComposition,
  type CelestialVeilComposition,
} from './celestial-veil-composition';
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
  /** Copies and applies settings without rebuilding instance data. Ignored after disposal. */
  setComposition: (composition: Readonly<CelestialVeilComposition>) => void;
  /** Releases the mesh, geometry and material once. Does not dispose the borrowed renderer. */
  dispose: () => void;
}>;

const BACKGROUND_COLOR_SRGB_HEX = 0x03090e;

function assertComposition(composition: Readonly<CelestialVeilComposition>): void {
  const { rotationDegrees, scale, offsetXViewportRatio, offsetYViewportRatio, grainScale } =
    composition;
  if (
    ![rotationDegrees, scale, offsetXViewportRatio, offsetYViewportRatio, grainScale].every(
      Number.isFinite
    ) ||
    scale <= 0 ||
    grainScale <= 0
  ) {
    throw new RangeError('Veil composition requires finite settings and positive scales.');
  }
}

/** Applies a center-based planar transform; depth and transparent ordering remain unchanged. */
function applyCompositionTransform(
  mesh: InstancedMesh,
  camera: OrthographicCamera,
  frame: CelestialVeilData['frame'],
  composition: Readonly<CelestialVeilComposition>
): void {
  const centerX = frame.widthPx / 2;
  const centerY = frame.heightPx / 2;
  mesh.rotation.set(0, 0, MathUtils.degToRad(composition.rotationDegrees));
  mesh.scale.set(composition.scale, composition.scale, 1);

  // Translate to the reference center, rotate/scale, then restore the center and add placement.
  mesh.position
    .set(-centerX, -centerY, 0)
    .applyEuler(mesh.rotation)
    .multiplyScalar(composition.scale);
  mesh.position.x += centerX + composition.offsetXViewportRatio * (camera.right - camera.left);
  mesh.position.y += centerY + composition.offsetYViewportRatio * (camera.top - camera.bottom);
  mesh.updateMatrixWorld(true);
}

/** Changes only the shared quad's four vertices; authored instance diameters stay untouched. */
function applyGrainScale(mesh: InstancedMesh, geometry: PlaneGeometry, grainScale: number): void {
  const positions = geometry.getAttribute('position');
  const coordinates = geometry.getAttribute('uv');
  for (let index = 0; index < positions.count; index += 1) {
    positions.setXY(
      index,
      (coordinates.getX(index) - 0.5) * grainScale,
      (coordinates.getY(index) - 0.5) * grainScale
    );
  }
  positions.needsUpdate = true;
  geometry.computeBoundingSphere();
  mesh.computeBoundingSphere();
}

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
 * movement requires revisiting instance ordering/facing. Composition can be adjusted in the image
 * plane without changing source data. Bloom, scheduling and renderer ownership remain external. The
 * caller must dispose the returned scene resources.
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
  let composition = createCelestialVeilComposition();
  let isDisposed = false;

  return {
    scene,
    camera,
    grainCount: grains.length,
    resize(viewport) {
      if (!isDisposed) {
        resizeCelestialVeilCamera(camera, frame, viewport);
        applyCompositionTransform(mesh, camera, frame, composition);
      }
    },
    setComposition(nextComposition) {
      if (isDisposed) {
        return;
      }
      assertComposition(nextComposition);
      if (nextComposition.grainScale !== composition.grainScale) {
        applyGrainScale(mesh, geometry, nextComposition.grainScale);
      }
      composition = { ...nextComposition };
      applyCompositionTransform(mesh, camera, frame, composition);
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
