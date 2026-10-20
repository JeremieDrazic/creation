import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createRenderingSession,
  type RenderingPreparationContext,
  type RenderingSessionOptions,
} from './rendering-session';

const mocks = vi.hoisted(() => ({
  createHost: vi.fn(),
  resizeHost: vi.fn(),
  disposeHost: vi.fn<() => Promise<void>>(),
  setAnimationLoop: vi.fn<(callback: FrameRequestCallback | null) => Promise<void>>(),
}));

vi.mock('../rendering-host/rendering-host', () => ({
  createRenderingHost: mocks.createHost,
}));

describe('rendering session assembly', () => {
  let callback: FrameRequestCallback | null;
  let timestampMs: number;
  let notifyResize: () => void;
  let ownerWindow: EventTarget & { ResizeObserver: typeof ResizeObserver };
  let ownerDocument: EventTarget & { hidden: boolean; defaultView: typeof ownerWindow | null };
  let canvas: { clientWidth: number; clientHeight: number; ownerDocument: typeof ownerDocument };
  let pixelRatio: number;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const onViewportChange = vi.fn();
  const onFrame = vi.fn();
  const onError = vi.fn();
  const host = {
    renderer: { setAnimationLoop: mocks.setAnimationLoop },
    resize: mocks.resizeHost,
    dispose: mocks.disposeHost,
  };

  function options(): RenderingSessionOptions {
    return {
      canvas: canvas as unknown as HTMLCanvasElement,
      readPixelRatio: () => pixelRatio,
      maxDeltaSeconds: 0.05,
      onViewportChange,
      onFrame,
      onError,
    };
  }

  function runFrame(): void {
    if (callback === null) {
      throw new Error('Expected a registered rendering callback.');
    }
    timestampMs += 16;
    callback(timestampMs);
  }

  function changePageVisibility(hidden: boolean): void {
    ownerDocument.hidden = hidden;
    ownerDocument.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.resetAllMocks();
    callback = null;
    timestampMs = 0;
    pixelRatio = 1;
    mocks.createHost.mockResolvedValue(host);
    mocks.disposeHost.mockResolvedValue(undefined);
    mocks.setAnimationLoop.mockImplementation((nextCallback) => {
      callback = nextCallback;
      return Promise.resolve();
    });
    class FakeResizeObserver {
      constructor(notify: () => void) {
        notifyResize = notify;
      }
      observe = observe;
      disconnect = disconnect;
    }
    ownerWindow = Object.assign(new EventTarget(), {
      ResizeObserver: FakeResizeObserver as unknown as typeof ResizeObserver,
    });
    ownerDocument = Object.assign(new EventTarget(), { hidden: false, defaultView: ownerWindow });
    canvas = { clientWidth: 800, clientHeight: 600, ownerDocument };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes cameras before frames and lends the same renderer with frame time', async () => {
    const session = await createRenderingSession(options());
    expect(mocks.createHost).toHaveBeenCalledWith({
      canvas,
      viewport: { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 },
      signal: undefined,
    });
    expect(observe).toHaveBeenCalledWith(canvas);
    expect(onViewportChange).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 800,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    expect(onFrame).not.toHaveBeenCalled();
    runFrame();
    expect(onFrame).toHaveBeenLastCalledWith(host.renderer, { deltaSeconds: 0, elapsedSeconds: 0 });
    runFrame();
    expect(onFrame).toHaveBeenLastCalledWith(host.renderer, {
      deltaSeconds: 0.016,
      elapsedSeconds: 0.016,
    });
    await session.dispose();
  });

  it('coalesces layout changes and applies buffer/camera changes before drawing', async () => {
    const session = await createRenderingSession(options());
    runFrame();
    const operations: string[] = [];
    mocks.resizeHost.mockImplementation(() => operations.push('buffer'));
    onViewportChange.mockImplementation(() => operations.push('camera'));
    onFrame.mockImplementation(() => operations.push('draw'));
    canvas.clientWidth = 900;
    notifyResize();
    canvas.clientWidth = 1000;
    ownerWindow.dispatchEvent(new Event('resize'));
    expect(operations).toEqual([]);
    runFrame();
    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(mocks.resizeHost).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 1000,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    notifyResize();
    runFrame();
    expect(mocks.resizeHost).toHaveBeenCalledTimes(1);
    await session.dispose();
  });

  it('applies a caller-selected resolution change after an explicit measurement request', async () => {
    const session = await createRenderingSession(options());
    runFrame();
    pixelRatio = 2;
    session.requestViewportMeasurement();
    runFrame();
    expect(mocks.resizeHost).toHaveBeenLastCalledWith({
      widthCssPx: 800,
      heightCssPx: 600,
      pixelRatio: 2,
    });
    await session.dispose();
  });

  it('skips empty layout and draws a same-size return without redundant resize', async () => {
    const session = await createRenderingSession(options());
    runFrame();
    onFrame.mockClear();
    canvas.clientWidth = 0;
    notifyResize();
    runFrame();
    expect(onFrame).not.toHaveBeenCalled();
    canvas.clientWidth = 800;
    notifyResize();
    runFrame();
    expect(onFrame).toHaveBeenCalledOnce();
    expect(mocks.resizeHost).not.toHaveBeenCalled();
    await session.dispose();
  });

  it('pauses while hidden and remeasures on return with zero delta', async () => {
    const session = await createRenderingSession(options());
    runFrame();
    runFrame();
    changePageVisibility(true);
    expect(callback).toBeNull();
    timestampMs += 60000;
    canvas.clientWidth = 1000;
    changePageVisibility(false);
    runFrame();
    expect(mocks.resizeHost).toHaveBeenCalledWith({
      widthCssPx: 1000,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    expect(onFrame).toHaveBeenLastCalledWith(host.renderer, {
      deltaSeconds: 0,
      elapsedSeconds: 0.016,
    });
    await session.dispose();
  });

  it('creates a hidden session without starting its loop', async () => {
    ownerDocument.hidden = true;
    const session = await createRenderingSession(options());
    expect(mocks.setAnimationLoop).not.toHaveBeenCalled();
    changePageVisibility(false);
    runFrame();
    expect(onFrame).toHaveBeenCalledOnce();
    await session.dispose();
  });

  it('notifies suspension after blocking frames and resumption before restarting, once per change', async () => {
    const onSuspend = vi.fn(() => {
      expect(callback).toBeNull();
    });
    const onResume = vi.fn(() => {
      expect(callback).toBeNull();
    });
    const session = await createRenderingSession({ ...options(), onSuspend, onResume });
    expect(onSuspend).not.toHaveBeenCalled();
    expect(onResume).not.toHaveBeenCalled();

    changePageVisibility(true);
    changePageVisibility(true);
    expect(onSuspend).toHaveBeenCalledOnce();
    changePageVisibility(false);
    changePageVisibility(false);
    expect(onResume).toHaveBeenCalledOnce();
    runFrame();
    expect(onFrame).toHaveBeenCalledOnce();
    await session.dispose();
    changePageVisibility(true);
    changePageVisibility(false);
    expect(onSuspend).toHaveBeenCalledOnce();
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('notifies an initially hidden page and resumes only when it becomes visible', async () => {
    ownerDocument.hidden = true;
    const onSuspend = vi.fn();
    const onResume = vi.fn();
    const session = await createRenderingSession({ ...options(), onSuspend, onResume });
    expect(onSuspend).toHaveBeenCalledOnce();
    expect(onResume).not.toHaveBeenCalled();
    expect(callback).toBeNull();
    changePageVisibility(false);
    expect(onResume).toHaveBeenCalledOnce();
    runFrame();
    await session.dispose();
  });

  it.each(['suspend', 'resume'] as const)(
    'stays stopped after a %s callback failure',
    async (operation) => {
      const cause = new Error('Experience visibility callback failed.');
      const onSuspend = vi.fn();
      const onResume = vi.fn();
      const session = await createRenderingSession({ ...options(), onSuspend, onResume });
      if (operation === 'suspend') {
        onSuspend.mockImplementationOnce(() => {
          throw cause;
        });
        changePageVisibility(true);
      } else {
        changePageVisibility(true);
        onResume.mockImplementationOnce(() => {
          throw cause;
        });
        changePageVisibility(false);
      }
      // Even a synchronous return to the page must not restart a failed session.
      changePageVisibility(false);
      expect(callback).toBeNull();
      await vi.waitFor(() => expect(onError).toHaveBeenCalledExactlyOnceWith(cause));
      expect(onFrame).not.toHaveBeenCalled();
      await session.dispose();
    }
  );

  it('rejects an initial suspension failure and cleans up without runtime notification', async () => {
    ownerDocument.hidden = true;
    const cause = new Error('Initial suspension failed.');
    await expect(
      createRenderingSession({
        ...options(),
        onSuspend: () => {
          throw cause;
        },
      })
    ).rejects.toBe(cause);
    expect(onError).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
  });

  it('retains callback and frame shutdown failures together', async () => {
    const callbackCause = new Error('Experience suspension failed.');
    const stopCause = new Error('Frame shutdown failed.');
    const session = await createRenderingSession({
      ...options(),
      onSuspend: () => {
        throw callbackCause;
      },
    });
    mocks.setAnimationLoop.mockRejectedValueOnce(stopCause);
    changePageVisibility(true);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: [
          callbackCause,
          expect.objectContaining({
            code: 'RENDERING_LOOP_CALLBACK_CHANGE_FAILED',
            cause: stopCause,
          }),
        ],
      })
    );
    await session.dispose();
  });

  it('blocks frames immediately and releases listeners/loop before the renderer once', async () => {
    const removeVisibility = vi.spyOn(ownerDocument, 'removeEventListener');
    const removeResize = vi.spyOn(ownerWindow, 'removeEventListener');
    const session = await createRenderingSession(options());
    const staleCallback = callback;
    const operations: string[] = [];
    mocks.setAnimationLoop.mockImplementation((nextCallback) => {
      callback = nextCallback;
      operations.push('loop');
      return Promise.resolve();
    });
    mocks.disposeHost.mockImplementation(async () => {
      operations.push('host');
    });
    const disposal = session.dispose();
    expect(session.dispose()).toBe(disposal);
    staleCallback?.(16);
    expect(onFrame).not.toHaveBeenCalled();
    await disposal;
    expect(operations).toEqual(['loop', 'host']);
    expect(removeVisibility).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeResize).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(disconnect).toHaveBeenCalledOnce();
    const callbackChanges = mocks.setAnimationLoop.mock.calls.length;
    changePageVisibility(true);
    changePageVisibility(false);
    notifyResize();
    session.requestViewportMeasurement();
    expect(mocks.setAnimationLoop).toHaveBeenCalledTimes(callbackChanges);
  });

  it('does not restart after a drawing failure, even before error reporting settles', async () => {
    const session = await createRenderingSession(options());
    const cause = new Error('Drawing failed.');
    onFrame.mockImplementationOnce(() => {
      throw cause;
    });
    runFrame();
    const callbackChanges = mocks.setAnimationLoop.mock.calls.length;
    changePageVisibility(true);
    changePageVisibility(false);
    expect(mocks.setAnimationLoop).toHaveBeenCalledTimes(callbackChanges);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RENDERING_LOOP_FRAME_FAILED', cause })
    );
    expect(callback).toBeNull();
    await session.dispose();
  });

  it('treats a failed visibility operation as terminal and reports its domain error', async () => {
    const session = await createRenderingSession(options());
    const cause = new Error('Callback removal failed.');
    mocks.setAnimationLoop.mockRejectedValueOnce(cause);
    changePageVisibility(true);
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'RENDERING_LOOP_CALLBACK_CHANGE_FAILED', cause })
    );
    const callbackChanges = mocks.setAnimationLoop.mock.calls.length;
    changePageVisibility(false);
    expect(mocks.setAnimationLoop).toHaveBeenCalledTimes(callbackChanges);
    await session.dispose();
  });

  it('rejects initial callback failure and cleans up without runtime error notification', async () => {
    const cause = new Error('Callback installation failed.');
    mocks.setAnimationLoop.mockRejectedValueOnce(cause);
    await expect(createRenderingSession(options())).rejects.toMatchObject({
      code: 'RENDERING_LOOP_CALLBACK_CHANGE_FAILED',
      cause,
    });
    expect(onError).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
  });

  it('releases the host when clock validation or initial camera setup fails', async () => {
    await expect(
      createRenderingSession({ ...options(), maxDeltaSeconds: 0 })
    ).rejects.toMatchObject({
      code: 'FRAME_CLOCK_INVALID_MAX_DELTA',
    });
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    mocks.disposeHost.mockClear();
    const cause = new Error('Camera setup failed.');
    onViewportChange.mockImplementationOnce(() => {
      throw cause;
    });
    await expect(createRenderingSession(options())).rejects.toBe(cause);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(observe).not.toHaveBeenCalled();
  });

  it('preserves cancellation after host acquisition and releases the acquired host', async () => {
    const controller = new AbortController();
    const cause = new Error('Mount superseded.');
    mocks.createHost.mockImplementation(async () => {
      controller.abort(cause);
      return host;
    });
    await expect(createRenderingSession({ ...options(), signal: controller.signal })).rejects.toBe(
      cause
    );
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(observe).not.toHaveBeenCalled();
  });

  it('rejects detached documents without acquiring a renderer', async () => {
    ownerDocument.defaultView = null;
    await expect(createRenderingSession(options())).rejects.toMatchObject({
      code: 'RENDERING_SESSION_UNAVAILABLE_WINDOW',
    });
    expect(mocks.createHost).not.toHaveBeenCalled();
  });

  it('releases acquired resources when subscribing to layout fails', async () => {
    const cause = new Error('Layout observation failed.');
    observe.mockImplementationOnce(() => {
      throw cause;
    });
    await expect(createRenderingSession(options())).rejects.toBe(cause);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('releases resize observation when subscribing to page visibility fails', async () => {
    const cause = new Error('Visibility subscription failed.');
    vi.spyOn(ownerDocument, 'addEventListener').mockImplementationOnce(() => {
      throw cause;
    });

    await expect(createRenderingSession(options())).rejects.toBe(cause);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancels while awaiting initial callback registration and removes acquired listeners', async () => {
    const controller = new AbortController();
    const cause = new Error('Mount superseded.');
    mocks.setAnimationLoop.mockImplementationOnce(async (nextCallback) => {
      callback = nextCallback;
      controller.abort(cause);
    });
    await expect(createRenderingSession({ ...options(), signal: controller.signal })).rejects.toBe(
      cause
    );
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
  });

  it('retains both shutdown failures and still attempts renderer disposal', async () => {
    const session = await createRenderingSession(options());
    const loopCause = new Error('Callback removal failed.');
    const hostCause = new Error('Renderer cleanup failed.');
    mocks.setAnimationLoop.mockRejectedValueOnce(loopCause);
    mocks.disposeHost.mockRejectedValueOnce(hostCause);
    const disposal = session.dispose();
    await expect(disposal).rejects.toMatchObject({
      code: 'RENDERING_SESSION_DISPOSAL_FAILED',
      cause: { errors: [expect.objectContaining({ cause: loopCause }), hostCause] },
    });
    expect(session.dispose()).toBe(disposal);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
  });

  it('preserves creation and cleanup failures under a session creation code', async () => {
    const creationCause = new Error('Camera setup failed.');
    const cleanupCause = new Error('Renderer cleanup failed.');
    onViewportChange.mockImplementationOnce(() => {
      throw creationCause;
    });
    mocks.disposeHost.mockRejectedValueOnce(cleanupCause);
    await expect(createRenderingSession(options())).rejects.toMatchObject({
      code: 'RENDERING_SESSION_CREATION_FAILED',
      cause: {
        errors: [
          creationCause,
          expect.objectContaining({ code: 'RENDERING_SESSION_DISPOSAL_FAILED' }),
        ],
      },
    });
    expect(onError).not.toHaveBeenCalled();
  });

  it('waits for preparation before camera callbacks, subscriptions and application frames', async () => {
    const preparation = Promise.withResolvers<void>();
    const prepareRendering = vi.fn(async () => {
      await preparation.promise;
    });
    const controller = new AbortController();
    const addVisibilityListener = vi.spyOn(ownerDocument, 'addEventListener');
    const addResizeListener = vi.spyOn(ownerWindow, 'addEventListener');

    const creation = createRenderingSession({
      ...options(),
      prepareRendering,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(prepareRendering).toHaveBeenCalledOnce());

    expect(prepareRendering).toHaveBeenCalledWith({
      renderer: host.renderer,
      viewport: { widthCssPx: 800, heightCssPx: 600, pixelRatio: 1 },
      signal: controller.signal,
    });
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(addVisibilityListener).not.toHaveBeenCalled();
    expect(addResizeListener).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
    expect(mocks.setAnimationLoop).not.toHaveBeenCalled();
    expect(onFrame).not.toHaveBeenCalled();

    preparation.resolve();
    const session = await creation;
    expect(onViewportChange).toHaveBeenCalledOnce();
    runFrame();
    expect(onFrame).toHaveBeenCalledOnce();
    await session.dispose();
  });

  it('observes current visibility after preparation and applies changed layout before drawing', async () => {
    const preparation = Promise.withResolvers<void>();
    const prepareRendering = vi.fn(async () => {
      await preparation.promise;
    });
    const creation = createRenderingSession({ ...options(), prepareRendering });
    await vi.waitFor(() => expect(prepareRendering).toHaveBeenCalledOnce());

    canvas.clientWidth = 1000;
    pixelRatio = 2;
    changePageVisibility(true);
    preparation.resolve();
    const session = await creation;
    expect(mocks.setAnimationLoop).not.toHaveBeenCalled();

    const operations: string[] = [];
    mocks.resizeHost.mockImplementation(() => operations.push('buffer'));
    onViewportChange.mockImplementation(() => operations.push('camera'));
    onFrame.mockImplementation(() => operations.push('draw'));
    changePageVisibility(false);
    runFrame();

    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(mocks.resizeHost).toHaveBeenCalledWith({
      widthCssPx: 1000,
      heightCssPx: 600,
      pixelRatio: 2,
    });
    expect(onFrame).toHaveBeenCalledWith(host.renderer, { deltaSeconds: 0, elapsedSeconds: 0 });
    await session.dispose();
  });

  it('preserves preparation failure and releases the renderer without runtime notification', async () => {
    const cause = new Error('Scene preparation failed.');
    const prepareRendering = vi.fn(async () => {
      throw cause;
    });

    await expect(createRenderingSession({ ...options(), prepareRendering })).rejects.toBe(cause);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenCalledExactlyOnceWith(null);
    expect(observe).not.toHaveBeenCalled();
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('waits for cooperative preparation before releasing the renderer after cancellation', async () => {
    const preparation = Promise.withResolvers<void>();
    const prepareRendering = vi.fn(async () => {
      await preparation.promise;
    });
    const controller = new AbortController();
    const cause = new Error('Preparation superseded.');
    const creation = createRenderingSession({
      ...options(),
      prepareRendering,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(prepareRendering).toHaveBeenCalledOnce());

    controller.abort(cause);
    expect(mocks.disposeHost).not.toHaveBeenCalled();
    preparation.resolve();

    await expect(creation).rejects.toBe(cause);
    expect(mocks.disposeHost).toHaveBeenCalledOnce();
    expect(onViewportChange).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('provides a preparation signal even without an external cancellation signal', async () => {
    const prepareRendering = vi.fn(async ({ signal }: RenderingPreparationContext) => {
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });
    const session = await createRenderingSession({ ...options(), prepareRendering });

    expect(prepareRendering).toHaveBeenCalledOnce();
    await session.dispose();
  });

  it('preserves preparation and renderer cleanup failures together', async () => {
    const preparationCause = new Error('Scene preparation failed.');
    const cleanupCause = new Error('Renderer cleanup failed.');
    mocks.disposeHost.mockRejectedValueOnce(cleanupCause);

    await expect(
      createRenderingSession({
        ...options(),
        prepareRendering: async () => {
          throw preparationCause;
        },
      })
    ).rejects.toMatchObject({
      code: 'RENDERING_SESSION_CREATION_FAILED',
      cause: {
        errors: [
          preparationCause,
          expect.objectContaining({ code: 'RENDERING_SESSION_DISPOSAL_FAILED' }),
        ],
      },
    });
    expect(onError).not.toHaveBeenCalled();
  });
});
