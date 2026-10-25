import { OrthographicCamera } from 'three/webgpu';

import type { RenderingViewport } from '@creation/rendering/types';

import type { CelestialVeilData } from '../data/celestial-veil-data';

type ReferenceFrame = CelestialVeilData['frame'];
type ViewportSize = Pick<RenderingViewport, 'widthCssPx' | 'heightCssPx'>;

const CAMERA_FRONT_CLEARANCE_WORLD_UNITS = 100;
const CAMERA_NEAR_WORLD_UNITS = 0.1;
const CAMERA_FAR_MARGIN_WORLD_UNITS = 1;

/**
 * Contains the complete reference frame without stretching. One world unit retains the same screen
 * size along both axes. Additional space is centered around the reference frame; this is a working
 * framing policy, before artistic orientation/placement and perspective are authored.
 */
export function getCelestialVeilCameraBounds(frame: ReferenceFrame, viewport: ViewportSize) {
  const dimensions = [frame.widthPx, frame.heightPx, viewport.widthCssPx, viewport.heightCssPx];
  if (dimensions.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError('Celestial veil framing requires positive finite dimensions.');
  }

  const worldUnitsPerCssPixel = Math.max(
    frame.widthPx / viewport.widthCssPx,
    frame.heightPx / viewport.heightCssPx
  );
  const visibleWidth = viewport.widthCssPx * worldUnitsPerCssPixel;
  const visibleHeight = viewport.heightCssPx * worldUnitsPerCssPixel;
  if (!Number.isFinite(visibleWidth) || !Number.isFinite(visibleHeight)) {
    throw new RangeError('Celestial veil framing exceeds finite camera bounds.');
  }

  const centerX = frame.widthPx / 2;
  const centerY = frame.heightPx / 2;
  return {
    left: centerX - visibleWidth / 2,
    right: centerX + visibleWidth / 2,
    top: centerY + visibleHeight / 2,
    bottom: centerY - visibleHeight / 2,
  };
}

/** Applies the pure framing result to an existing camera; does not resize the shared canvas. */
export function resizeCelestialVeilCamera(
  camera: OrthographicCamera,
  frame: ReferenceFrame,
  viewport: ViewportSize
): void {
  Object.assign(camera, getCelestialVeilCameraBounds(frame, viewport));
  camera.updateProjectionMatrix();
}

/** Creates the initial reference camera; live viewport dimensions are applied before drawing. */
export function createCelestialVeilCamera(
  frame: ReferenceFrame,
  depthSpanWorldUnits: number
): OrthographicCamera {
  const bounds = getCelestialVeilCameraBounds(frame, {
    widthCssPx: frame.widthPx,
    heightCssPx: frame.heightPx,
  });
  const cameraDistance = depthSpanWorldUnits + CAMERA_FRONT_CLEARANCE_WORLD_UNITS;
  const camera = new OrthographicCamera(
    bounds.left,
    bounds.right,
    bounds.top,
    bounds.bottom,
    CAMERA_NEAR_WORLD_UNITS,
    cameraDistance + CAMERA_FAR_MARGIN_WORLD_UNITS
  );
  camera.position.z = cameraDistance;
  camera.updateMatrixWorld();
  return camera;
}
