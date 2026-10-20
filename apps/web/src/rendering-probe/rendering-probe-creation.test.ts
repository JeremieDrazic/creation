import {
  BufferGeometry,
  Mesh,
  MeshBasicNodeMaterial,
  OrthographicCamera,
  Scene,
} from 'three/webgpu';
import type { WebGPURenderer } from 'three/webgpu';
import { expect, test, vi } from 'vitest';

import { RenderingProbeCreation } from './rendering-probe-creation';

const VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 2 } as const;

function createBorrowedRenderer() {
  const render = vi.fn<(scene: Scene, camera: OrthographicCamera) => void>();
  const dispose = vi.fn();
  const setAnimationLoop = vi.fn();
  return {
    renderer: { render, dispose, setAnimationLoop } as unknown as WebGPURenderer,
    render,
    dispose,
    setAnimationLoop,
  };
}

test('prepares and draws the static scene using a borrowed renderer without scheduling frames', async () => {
  const borrowed = createBorrowedRenderer();
  const creation = await RenderingProbeCreation.prepare({
    renderer: borrowed.renderer,
    viewport: VIEWPORT,
    signal: new AbortController().signal,
  });
  expect(borrowed.render).not.toHaveBeenCalled();

  creation.activate();
  creation.update({ deltaSeconds: 0.016, elapsedSeconds: 1 });
  creation.render(borrowed.renderer);
  expect(borrowed.render).toHaveBeenCalledExactlyOnceWith(
    expect.any(Scene),
    expect.any(OrthographicCamera)
  );

  const camera = borrowed.render.mock.calls[0]?.[1];
  expect(camera?.right).toBeCloseTo(VIEWPORT.widthCssPx / VIEWPORT.heightCssPx);
  creation.resize({ widthCssPx: 600, heightCssPx: 1200, pixelRatio: 1 });
  expect(camera?.right).toBeCloseTo(0.5);
  creation.dispose();
  expect(borrowed.dispose).not.toHaveBeenCalled();
  expect(borrowed.setAnimationLoop).not.toHaveBeenCalled();
});

test('releases scene resources once and prevents drawing after disposal', async () => {
  const borrowed = createBorrowedRenderer();
  const creation = await RenderingProbeCreation.prepare({
    renderer: borrowed.renderer,
    viewport: VIEWPORT,
    signal: new AbortController().signal,
  });
  creation.render(borrowed.renderer);
  const scene = borrowed.render.mock.calls[0]?.[0];
  const triangle = scene?.children[0];
  if (
    !(triangle instanceof Mesh) ||
    !(triangle.geometry instanceof BufferGeometry) ||
    !(triangle.material instanceof MeshBasicNodeMaterial)
  ) {
    throw new Error('Expected triangle resources.');
  }
  const disposeGeometry = vi.spyOn(triangle.geometry, 'dispose');
  const disposeMaterial = vi.spyOn(triangle.material, 'dispose');

  creation.dispose();
  creation.dispose();
  creation.render(borrowed.renderer);

  expect(disposeGeometry).toHaveBeenCalledOnce();
  expect(disposeMaterial).toHaveBeenCalledOnce();
  expect(scene?.children).toHaveLength(0);
  expect(borrowed.render).toHaveBeenCalledOnce();
  expect(borrowed.dispose).not.toHaveBeenCalled();
});

test('preserves the cancellation reason when preparation is already cancelled', async () => {
  const borrowed = createBorrowedRenderer();
  const controller = new AbortController();
  const reason = new Error('Preparation cancelled.');
  controller.abort(reason);

  await expect(
    RenderingProbeCreation.prepare({
      renderer: borrowed.renderer,
      viewport: VIEWPORT,
      signal: controller.signal,
    })
  ).rejects.toBe(reason);
  expect(borrowed.render).not.toHaveBeenCalled();
  expect(borrowed.dispose).not.toHaveBeenCalled();
});
