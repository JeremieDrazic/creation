import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicNodeMaterial,
  OrthographicCamera,
  Scene,
} from 'three/webgpu';

const CAMERA_HALF_HEIGHT_WORLD_UNITS = 1;
const CAMERA_DISTANCE_WORLD_UNITS = 1;
const CAMERA_NEAR_WORLD_UNITS = 0.1;
const CAMERA_FAR_WORLD_UNITS = 10;
const PROBE_COLOR_SRGB_HEX = 0xffffff;

// Three counterclockwise vertices in the XY plane, expressed in world units.
const TRIANGLE_POSITIONS = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0];

/** Temporary scene owned by the web app; borrows no renderer and registers no animation loop. */
export type RenderingProbe = Readonly<{
  scene: Scene;
  camera: OrthographicCamera;
  /** Receives canvas CSS width / CSS height, independently of drawing pixel ratio. */
  resize: (aspectRatio: number) => void;
  /** Detaches the triangle and releases its geometry/material. Safe to call repeatedly. */
  dispose: () => void;
}>;

/** Reject invalid layout measurements before constructing or changing camera projection. */
function assertAspectRatio(aspectRatio: number): void {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    throw new RangeError('Canvas aspect ratio must be finite and positive.');
  }
}

/**
 * Creates an unlit triangle for renderer integration, not final artwork. A fixed vertical camera
 * span and aspect-aware horizontal span preserve shape proportions. The caller owns
 * rendering/scheduling and must dispose this scene when it is no longer used.
 */
export function createRenderingProbe(aspectRatio: number): RenderingProbe {
  assertAspectRatio(aspectRatio);

  const scene = new Scene();
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(TRIANGLE_POSITIONS, 3));
  geometry.computeVertexNormals();
  const material = new MeshBasicNodeMaterial({ color: PROBE_COLOR_SRGB_HEX });
  scene.add(new Mesh(geometry, material));

  const halfWidthWorldUnits = CAMERA_HALF_HEIGHT_WORLD_UNITS * aspectRatio;
  const camera = new OrthographicCamera(
    -halfWidthWorldUnits,
    halfWidthWorldUnits,
    CAMERA_HALF_HEIGHT_WORLD_UNITS,
    -CAMERA_HALF_HEIGHT_WORLD_UNITS,
    CAMERA_NEAR_WORLD_UNITS,
    CAMERA_FAR_WORLD_UNITS
  );
  camera.position.z = CAMERA_DISTANCE_WORLD_UNITS;
  let isDisposed = false;

  /** Changes camera projection, without resizing the renderer or reallocating scene objects. */
  function resize(nextAspectRatio: number): void {
    if (isDisposed) {
      throw new Error('Cannot resize a disposed rendering probe.');
    }
    assertAspectRatio(nextAspectRatio);
    const nextHalfWidthWorldUnits = CAMERA_HALF_HEIGHT_WORLD_UNITS * nextAspectRatio;
    camera.left = -nextHalfWidthWorldUnits;
    camera.right = nextHalfWidthWorldUnits;
    camera.updateProjectionMatrix();
  }

  /** Releases only this scene's resources; the application's shared renderer remains untouched. */
  function dispose(): void {
    if (isDisposed) {
      return;
    }
    isDisposed = true;
    scene.clear();
    geometry.dispose();
    material.dispose();
  }

  return { scene, camera, resize, dispose };
}
