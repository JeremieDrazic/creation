import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CodedError } from '@creation/utils/errors/coded-errors';

import { createRenderingHost } from './rendering-host';
import { RENDERING_HOST_ERROR_CODES } from './rendering-host-errors';

const rendererMock = vi.hoisted(() => {
  const renderer = {
    init: vi.fn<() => Promise<void>>(),
    dispose: vi.fn<() => Promise<void>>(),
    setDrawingBufferSize: vi.fn<(width: number, height: number, pixelRatio: number) => void>(),
  };
  const construct = vi.fn(function MockRenderer() {
    return renderer;
  });
  return { renderer, construct };
});

// Only the external GPU boundary is replaced; the host's lifecycle and error logic run unchanged.
vi.mock('three/webgpu', () => ({ WebGPURenderer: rendererMock.construct }));

// Opaque identity token: the mocked renderer never accesses canvas DOM properties.
const canvas = {} as HTMLCanvasElement;
const VIEWPORT = { widthCssPx: 800, heightCssPx: 600, pixelRatio: 2 } as const;
const FOREIGN_ERROR_CODE = 'TEST_FOREIGN_FAILURE';

/** Retrieves a typed failure for cause-chain assertions; a successful operation fails the test. */
async function readHostFailure(operation: Promise<unknown>): Promise<CodedError> {
  const failure = await operation.catch((reason: unknown) => reason);
  if (!(failure instanceof CodedError)) {
    throw new Error('Expected a CodedError rejection.', { cause: failure });
  }
  return failure;
}

beforeEach(() => {
  vi.resetAllMocks();
  rendererMock.construct.mockImplementation(function MockRenderer() {
    return rendererMock.renderer;
  });
  rendererMock.renderer.init.mockResolvedValue(undefined);
  rendererMock.renderer.dispose.mockResolvedValue(undefined);
});

describe('creation and cancellation', () => {
  test('waits for initialization and supplies the requested canvas and drawing dimensions', async () => {
    const initialization = Promise.withResolvers<void>();
    rendererMock.renderer.init.mockReturnValueOnce(initialization.promise);
    const onReady = vi.fn();
    const creation = createRenderingHost({ canvas, viewport: VIEWPORT });
    const observation = creation.then(onReady);

    await Promise.resolve();
    expect(onReady).not.toHaveBeenCalled();
    expect(rendererMock.construct).toHaveBeenCalledWith({ canvas });
    expect(rendererMock.renderer.setDrawingBufferSize).toHaveBeenCalledWith(800, 600, 2);

    initialization.resolve();
    await observation;
    expect(onReady).toHaveBeenCalledOnce();
    expect((await creation).renderer).toBe(rendererMock.renderer);
    expect(rendererMock.renderer.dispose).not.toHaveBeenCalled();
  });

  test('does not allocate a renderer when creation was already cancelled', async () => {
    const controller = new AbortController();
    const reason = new Error('Navigation superseded.');
    controller.abort(reason);

    await expect(
      createRenderingHost({ canvas, viewport: VIEWPORT, signal: controller.signal })
    ).rejects.toBe(reason);
    expect(rendererMock.construct).not.toHaveBeenCalled();
  });

  test('releases an obsolete renderer only after initialization settles', async () => {
    const initialization = Promise.withResolvers<void>();
    rendererMock.renderer.init.mockReturnValueOnce(initialization.promise);
    const controller = new AbortController();
    const reason = new Error('Navigation superseded.');
    const creation = createRenderingHost({ canvas, viewport: VIEWPORT, signal: controller.signal });
    const rejection = expect(creation).rejects.toBe(reason);

    controller.abort(reason);
    expect(rendererMock.renderer.dispose).not.toHaveBeenCalled();
    initialization.resolve();

    await rejection;
    expect(rendererMock.renderer.dispose).toHaveBeenCalledOnce();
  });

  test('does not dispose a ready host when its creation signal is later cancelled', async () => {
    const controller = new AbortController();
    const host = await createRenderingHost({
      canvas,
      viewport: VIEWPORT,
      signal: controller.signal,
    });
    controller.abort();

    host.resize(VIEWPORT);
    expect(rendererMock.renderer.dispose).not.toHaveBeenCalled();
    await host.dispose();
  });

  test('codes a constructor failure without attempting cleanup on an absent renderer', async () => {
    const cause = new Error('Canvas unavailable.');
    rendererMock.construct.mockImplementationOnce(function FailingRenderer() {
      throw cause;
    });

    await expect(createRenderingHost({ canvas, viewport: VIEWPORT })).rejects.toMatchObject({
      code: RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED,
      cause,
    });
    expect(rendererMock.renderer.dispose).not.toHaveBeenCalled();
  });

  test('waits for cleanup before reporting an initialization failure with its original cause', async () => {
    const cause = new Error('Graphics device unavailable.');
    const cleanup = Promise.withResolvers<void>();
    rendererMock.renderer.init.mockRejectedValueOnce(cause);
    rendererMock.renderer.dispose.mockReturnValueOnce(cleanup.promise);
    const onFailure = vi.fn();
    const creation = createRenderingHost({ canvas, viewport: VIEWPORT });
    const observation = creation.catch(onFailure);
    const rejection = expect(creation).rejects.toMatchObject({
      code: RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED,
      cause,
    });

    await vi.waitFor(() => expect(rendererMock.renderer.dispose).toHaveBeenCalledOnce());
    expect(onFailure).not.toHaveBeenCalled();
    cleanup.resolve();
    await Promise.all([observation, rejection]);
    expect(onFailure).toHaveBeenCalledWith(expect.any(CodedError));
  });

  test('reports a real initialization failure even if navigation was cancelled concurrently', async () => {
    const initialization = Promise.withResolvers<void>();
    const cause = new Error('Graphics device unavailable.');
    rendererMock.renderer.init.mockReturnValueOnce(initialization.promise);
    const controller = new AbortController();
    const creation = createRenderingHost({ canvas, viewport: VIEWPORT, signal: controller.signal });
    const rejection = expect(creation).rejects.toMatchObject({
      code: RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED,
      cause,
    });

    controller.abort();
    initialization.reject(cause);
    await rejection;
  });
});

describe('viewport validation', () => {
  test.each([
    { ...VIEWPORT, widthCssPx: 0 },
    { ...VIEWPORT, heightCssPx: -1 },
    { ...VIEWPORT, widthCssPx: Number.NaN },
    { ...VIEWPORT, heightCssPx: Number.POSITIVE_INFINITY },
    { ...VIEWPORT, widthCssPx: Number.MAX_VALUE },
    { ...VIEWPORT, heightCssPx: Number.MAX_VALUE },
    { ...VIEWPORT, pixelRatio: 0 },
    { ...VIEWPORT, pixelRatio: Number.NaN },
    { ...VIEWPORT, widthCssPx: 0.1, pixelRatio: 1 },
    { ...VIEWPORT, heightCssPx: 0.1, pixelRatio: 1 },
  ])('rejects invalid dimensions before allocating: %j', async (viewport) => {
    await expect(createRenderingHost({ canvas, viewport })).rejects.toBeInstanceOf(RangeError);
    expect(rendererMock.construct).not.toHaveBeenCalled();
  });

  test('rejects an invalid resize without changing the current drawing buffer', async () => {
    const host = await createRenderingHost({ canvas, viewport: VIEWPORT });

    expect(() => host.resize({ ...VIEWPORT, pixelRatio: 0 })).toThrow(RangeError);
    expect(rendererMock.renderer.setDrawingBufferSize).toHaveBeenCalledOnce();
    await host.dispose();
  });
});

describe('disposal', () => {
  test('shares one cleanup promise and rejects resize as soon as cleanup starts', async () => {
    const cleanup = Promise.withResolvers<void>();
    rendererMock.renderer.dispose.mockReturnValueOnce(cleanup.promise);
    const host = await createRenderingHost({ canvas, viewport: VIEWPORT });

    const firstDisposal = host.dispose();
    expect(host.dispose()).toBe(firstDisposal);
    expect(rendererMock.renderer.dispose).toHaveBeenCalledOnce();
    expect(() => host.resize(VIEWPORT)).toThrow('Cannot resize a disposed rendering host.');

    cleanup.resolve();
    await firstDisposal;
    expect(host.dispose()).toBe(firstDisposal);
  });

  test('preserves cleanup failure and reuses its rejection without retrying disposal', async () => {
    const cause = new Error('Device cleanup failed.');
    rendererMock.renderer.dispose.mockRejectedValueOnce(cause);
    const host = await createRenderingHost({ canvas, viewport: VIEWPORT });
    const disposal = host.dispose();

    await expect(disposal).rejects.toMatchObject({
      code: RENDERING_HOST_ERROR_CODES.DISPOSAL_FAILED,
      cause,
    });
    expect(host.dispose()).toBe(disposal);
    expect(rendererMock.renderer.dispose).toHaveBeenCalledOnce();
  });

  test('preserves both failures under the initialization code when cleanup also fails', async () => {
    const initializationCause = new Error('Graphics device unavailable.');
    const cleanupCause = new Error('Device cleanup failed.');
    rendererMock.renderer.init.mockRejectedValueOnce(initializationCause);
    rendererMock.renderer.dispose.mockRejectedValueOnce(cleanupCause);

    const failure = await readHostFailure(createRenderingHost({ canvas, viewport: VIEWPORT }));
    expect(failure.code).toBe(RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED);
    if (!(failure.cause instanceof AggregateError)) {
      throw new Error('Expected both diagnostic failures to be retained.');
    }
    expect(failure.cause.errors).toEqual([
      expect.objectContaining({
        code: RENDERING_HOST_ERROR_CODES.INITIALIZATION_FAILED,
        cause: initializationCause,
      }),
      expect.objectContaining({
        code: RENDERING_HOST_ERROR_CODES.DISPOSAL_FAILED,
        cause: cleanupCause,
      }),
    ]);
  });

  test.each([new Error('Navigation superseded.'), new CodedError(FOREIGN_ERROR_CODE)])(
    'reports cleanup failure without adopting the cancellation reason code: %s',
    async (reason) => {
      const initialization = Promise.withResolvers<void>();
      const controller = new AbortController();
      const cleanupCause = new Error('Device cleanup failed.');
      rendererMock.renderer.init.mockReturnValueOnce(initialization.promise);
      rendererMock.renderer.dispose.mockRejectedValueOnce(cleanupCause);
      const creation = createRenderingHost({
        canvas,
        viewport: VIEWPORT,
        signal: controller.signal,
      });
      const failureResult = readHostFailure(creation);

      controller.abort(reason);
      initialization.resolve();
      const failure = await failureResult;
      expect(failure.code).toBe(RENDERING_HOST_ERROR_CODES.DISPOSAL_FAILED);
      if (!(failure.cause instanceof AggregateError)) {
        throw new Error('Expected cancellation and cleanup diagnostics to be retained.');
      }
      expect(failure.cause.errors).toEqual([
        reason,
        expect.objectContaining({ cause: cleanupCause }),
      ]);
    }
  );
});
