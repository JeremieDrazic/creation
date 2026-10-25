import { OrthographicCamera, Scene, Vector3 } from 'three/webgpu';
import type { WebGPURenderer } from 'three/webgpu';
import { afterEach, expect, test, vi } from 'vitest';

import { CELESTIAL_VEIL_GRAIN_COLUMNS } from './celestial-veil/data/celestial-veil-data';
import { IntroCreation } from './intro-creation';

const VIEWPORT = { widthCssPx: 1536, heightCssPx: 512, pixelRatio: 1 } as const;
const ASSET = {
  schemaVersion: 1,
  frame: { widthPx: 1536, heightPx: 512 },
  depthSpanWorldUnits: 100,
  columns: CELESTIAL_VEIL_GRAIN_COLUMNS,
  grains: [[1.5, 2.5, 10, 2, 0.2, 0.3, 0.4, 0.5, 0.6]],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function fixture() {
  const fetchAsset = vi.fn<typeof fetch>().mockResolvedValue(Response.json(ASSET));
  vi.stubGlobal('fetch', fetchAsset);
  const compile = vi.fn<WebGPURenderer['compileAsync']>().mockResolvedValue(undefined);
  const render = vi.fn<(scene: Scene, camera: OrthographicCamera) => void>();
  const dispose = vi.fn();
  const setAnimationLoop = vi.fn();
  return {
    renderer: {
      compileAsync: compile,
      render,
      dispose,
      setAnimationLoop,
    } as unknown as WebGPURenderer,
    compile,
    render,
    dispose,
    setAnimationLoop,
    fetchAsset,
  };
}

test('loads and compiles the scene before returning a renderable experience', async () => {
  const borrowed = fixture();
  const creation = await IntroCreation.prepare({
    renderer: borrowed.renderer,
    viewport: VIEWPORT,
    signal: new AbortController().signal,
  });
  expect(borrowed.compile).toHaveBeenCalledOnce();
  expect(borrowed.render).not.toHaveBeenCalled();
  creation.activate();
  creation.update({ deltaSeconds: 0.016, elapsedSeconds: 1 });
  creation.suspend();
  creation.resume();
  creation.resize(VIEWPORT);
  creation.render(borrowed.renderer);
  expect(borrowed.render).toHaveBeenCalledExactlyOnceWith(
    expect.any(Scene),
    expect.any(OrthographicCamera)
  );
  const scene = borrowed.render.mock.calls[0]?.[0];
  creation.dispose();
  creation.dispose();
  creation.render(borrowed.renderer);
  expect(scene?.children).toHaveLength(0);
  expect(borrowed.render).toHaveBeenCalledOnce();
  expect(borrowed.dispose).not.toHaveBeenCalled();
  expect(borrowed.setAnimationLoop).not.toHaveBeenCalled();
});

test('does not fetch or compile when preparation was already cancelled', async () => {
  const borrowed = fixture();
  const reason = new Error('Obsolete intro');
  await expect(
    IntroCreation.prepare({
      renderer: borrowed.renderer,
      viewport: VIEWPORT,
      signal: AbortSignal.abort(reason),
    })
  ).rejects.toBe(reason);
  expect(borrowed.fetchAsset).not.toHaveBeenCalled();
  expect(borrowed.compile).not.toHaveBeenCalled();
});

test('fits the initial viewport before compilation and updates the same camera on resize', async () => {
  const borrowed = fixture();
  const creation = await IntroCreation.prepare({
    renderer: borrowed.renderer,
    viewport: { widthCssPx: 1280, heightCssPx: 720, pixelRatio: 2 },
    signal: new AbortController().signal,
  });
  const camera = borrowed.compile.mock.calls[0]?.[1];
  if (!(camera instanceof OrthographicCamera)) {
    throw new Error('Expected the orthographic veil camera.');
  }
  expect((camera.right - camera.left) / (camera.top - camera.bottom)).toBeCloseTo(1280 / 720);
  const before = camera.projectionMatrix.clone();
  creation.resize({ widthCssPx: 800, heightCssPx: 1200, pixelRatio: 1 });
  expect(camera.projectionMatrix.equals(before)).toBe(false);
  const center = new Vector3(768, 256, 50).project(camera);
  const horizontal = new Vector3(778, 256, 50).project(camera);
  const vertical = new Vector3(768, 266, 50).project(camera);
  expect((horizontal.x - center.x) * 800).toBeCloseTo((vertical.y - center.y) * 1200);
  creation.render(borrowed.renderer);
  expect(borrowed.render.mock.calls[0]?.[1]).toBe(camera);
  creation.dispose();
});

test('cleans the new scene and preserves shader compilation failure', async () => {
  const borrowed = fixture();
  const reason = new Error('Shader compilation failed');
  borrowed.compile.mockRejectedValue(reason);
  await expect(
    IntroCreation.prepare({
      renderer: borrowed.renderer,
      viewport: VIEWPORT,
      signal: new AbortController().signal,
    })
  ).rejects.toBe(reason);
  const scene = borrowed.compile.mock.calls[0]?.[0];
  expect(scene?.children).toHaveLength(0);
  expect(borrowed.dispose).not.toHaveBeenCalled();
});

test('cleans a late compilation result cancelled during preparation', async () => {
  const borrowed = fixture();
  const pending = Promise.withResolvers<void>();
  borrowed.compile.mockReturnValue(pending.promise);
  const controller = new AbortController();
  const preparation = IntroCreation.prepare({
    renderer: borrowed.renderer,
    viewport: VIEWPORT,
    signal: controller.signal,
  });
  const reason = new Error('Intro replaced during compile');
  const rejected = expect(preparation).rejects.toBe(reason);
  await vi.waitFor(() => expect(borrowed.compile).toHaveBeenCalledOnce());
  controller.abort(reason);
  pending.resolve();
  await rejected;
  const scene = borrowed.compile.mock.calls[0]?.[0];
  expect(scene?.children).toHaveLength(0);
});
