import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mountRenderingProbe } from './mount-rendering-probe';
import { RenderingProbeCreation } from './rendering-probe-creation';

const mocks = vi.hoisted(() => ({
  initializeHost: vi.fn<() => Promise<void>>(),
  createProbe: vi.fn<(aspectRatio: number) => void>(),
  hostResize: vi.fn(),
  probeResize: vi.fn(),
  render: vi.fn(),
  hostDispose: vi.fn(async () => {}),
  probeDispose: vi.fn(),
  setAnimationLoop: vi.fn<(callback: FrameRequestCallback | null) => Promise<void>>(),
}));

vi.mock('@creation/rendering/rendering-host', () => ({
  createRenderingHost: async () => {
    await mocks.initializeHost();
    return {
      resize: mocks.hostResize,
      dispose: mocks.hostDispose,
      renderer: { render: mocks.render, setAnimationLoop: mocks.setAnimationLoop },
    };
  },
}));

vi.mock('./rendering-probe', () => ({
  createRenderingProbe: (aspectRatio: number) => {
    mocks.createProbe(aspectRatio);
    return {
      scene: {},
      camera: {},
      resize: mocks.probeResize,
      dispose: mocks.probeDispose,
    };
  },
}));

describe('temporary probe resize scheduling', () => {
  let installedCallback: FrameRequestCallback | null;
  let timestampMs = 0;
  let notifyResize: () => void;
  let pageDocument: EventTarget & { hidden: boolean; defaultView: typeof window };
  const disconnect = vi.fn();

  function runFrame(): void {
    if (installedCallback === null) {
      throw new Error('Expected an installed Three.js animation callback.');
    }
    timestampMs += 16;
    installedCallback(timestampMs);
  }

  beforeEach(() => {
    vi.resetAllMocks();
    installedCallback = null;
    timestampMs = 0;
    mocks.initializeHost.mockResolvedValue(undefined);
    mocks.hostDispose.mockResolvedValue(undefined);
    mocks.setAnimationLoop.mockImplementation((callback) => {
      installedCallback = callback;
      return Promise.resolve();
    });
    class FakeResizeObserver {
      constructor(callback: () => void) {
        notifyResize = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
    const ownerWindow = Object.assign(new EventTarget(), {
      devicePixelRatio: 1,
      requestAnimationFrame: vi.fn(),
      cancelAnimationFrame: vi.fn(),
      ResizeObserver: FakeResizeObserver,
    });
    pageDocument = Object.assign(new EventTarget(), {
      hidden: false,
      defaultView: ownerWindow as unknown as typeof window,
    });
    vi.stubGlobal('document', pageDocument);
    vi.stubGlobal('window', ownerWindow);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('prepares the scene after host readiness using the applied viewport, before starting frames', async () => {
    const initialization = Promise.withResolvers<void>();
    mocks.initializeHost.mockReturnValueOnce(initialization.promise);
    const dimensions = { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument };
    const mounting = mountRenderingProbe(
      dimensions as HTMLCanvasElement,
      new AbortController().signal
    );
    expect(mocks.createProbe).not.toHaveBeenCalled();
    expect(mocks.setAnimationLoop).not.toHaveBeenCalled();

    dimensions.clientWidth = 1200;
    initialization.resolve();
    const mounted = await mounting;
    expect(mocks.createProbe).toHaveBeenCalledExactlyOnceWith(800 / 600);
    expect(mocks.createProbe.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.setAnimationLoop.mock.invocationCallOrder[0] ?? 0
    );
    runFrame();
    expect(mocks.probeResize).toHaveBeenLastCalledWith(1200 / 600);
    await mounted.dispose();
  });

  it('activates before starting frames and updates before drawing with the session clock', async () => {
    const activate = vi.spyOn(RenderingProbeCreation.prototype, 'activate');
    const update = vi.spyOn(RenderingProbeCreation.prototype, 'update');
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    expect(activate).toHaveBeenCalledOnce();
    expect(activate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.setAnimationLoop.mock.invocationCallOrder[0] ?? 0
    );
    expect(update).not.toHaveBeenCalled();
    const operations: string[] = [];
    update.mockImplementation(() => {
      operations.push('update');
    });
    mocks.render.mockImplementation(() => {
      operations.push('draw');
    });

    runFrame();
    expect(operations).toEqual(['update', 'draw']);
    expect(update).toHaveBeenLastCalledWith({ deltaSeconds: 0, elapsedSeconds: 0 });
    runFrame();
    expect(update).toHaveBeenLastCalledWith({ deltaSeconds: 0.016, elapsedSeconds: 0.016 });
    await mounted.dispose();
  });

  it('releases the prepared scene and session when activation fails', async () => {
    const cause = new Error('Activation failed.');
    vi.spyOn(RenderingProbeCreation.prototype, 'activate').mockImplementationOnce(() => {
      throw cause;
    });
    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      )
    ).rejects.toBe(cause);
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
    expect(mocks.probeDispose).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenCalledExactlyOnceWith(null);
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it('does not create scene resources when renderer initialization fails', async () => {
    const cause = new Error('Renderer initialization failed.');
    mocks.initializeHost.mockRejectedValueOnce(cause);
    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      )
    ).rejects.toBe(cause);
    expect(mocks.createProbe).not.toHaveBeenCalled();
    expect(mocks.probeDispose).not.toHaveBeenCalled();
  });

  it('releases the host when scene preparation fails without starting frames', async () => {
    const cause = new Error('Scene preparation failed.');
    mocks.createProbe.mockImplementationOnce(() => {
      throw cause;
    });
    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      )
    ).rejects.toBe(cause);
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
    expect(mocks.probeDispose).not.toHaveBeenCalled();
    expect(mocks.setAnimationLoop).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('releases the prepared scene and host when cancelled before frame registration', async () => {
    const controller = new AbortController();
    const reason = new Error('Mount cancelled.');
    const activate = vi.spyOn(RenderingProbeCreation.prototype, 'activate');
    mocks.createProbe.mockImplementationOnce(() => controller.abort(reason));
    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        controller.signal
      )
    ).rejects.toBe(reason);
    expect(activate).not.toHaveBeenCalled();
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
    expect(mocks.probeDispose).toHaveBeenCalledOnce();
    expect(mocks.setAnimationLoop).toHaveBeenCalledExactlyOnceWith(null);
    expect(mocks.render).not.toHaveBeenCalled();
  });

  it('coalesces resize notifications and redraws immediately after changing the buffer', async () => {
    const dimensions = { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument };
    const mounted = await mountRenderingProbe(
      dimensions as HTMLCanvasElement,
      new AbortController().signal
    );
    runFrame();
    const operations: string[] = [];
    mocks.hostResize.mockImplementation(() => operations.push('buffer'));
    mocks.probeResize.mockImplementation(() => operations.push('camera'));
    mocks.render.mockImplementation(() => operations.push('draw'));

    dimensions.clientWidth = 900;
    notifyResize();
    dimensions.clientWidth = 1000;
    notifyResize();
    expect(operations).toEqual([]);

    runFrame();
    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(mocks.hostResize).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 1000,
      heightCssPx: 600,
      pixelRatio: 1,
    });

    notifyResize();
    runFrame();
    expect(mocks.hostResize).toHaveBeenCalledTimes(1);
    await mounted.dispose();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('skips zero-sized layout and releases the session before the scene', async () => {
    const dimensions = { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument };
    const mounted = await mountRenderingProbe(
      dimensions as HTMLCanvasElement,
      new AbortController().signal
    );
    runFrame();
    mocks.render.mockClear();
    dimensions.clientWidth = 0;
    notifyResize();
    runFrame();
    expect(mocks.hostResize).not.toHaveBeenCalled();
    expect(mocks.render).not.toHaveBeenCalled();
    const cleanupOrder: string[] = [];
    mocks.setAnimationLoop.mockImplementation((callback) => {
      installedCallback = callback;
      cleanupOrder.push('loop');
      return Promise.resolve();
    });
    mocks.probeDispose.mockImplementation(() => cleanupOrder.push('scene'));
    mocks.hostDispose.mockImplementation(async () => {
      cleanupOrder.push('host');
    });
    const disposal = mounted.dispose();
    expect(mounted.dispose()).toBe(disposal);
    await disposal;
    expect(installedCallback).toBeNull();
    expect(cleanupOrder).toEqual(['loop', 'host', 'scene']);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
  });

  it('stops and logs a coded frame failure without scheduling another application loop', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('Drawing failed.');
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    mocks.render.mockImplementationOnce(() => {
      throw cause;
    });

    runFrame();
    await vi.waitFor(() => expect(errorLog).toHaveBeenCalledOnce());
    expect(installedCallback).toBeNull();
    expect(errorLog).toHaveBeenCalledWith(
      'Rendering POC rendering failed',
      expect.objectContaining({ code: 'RENDERING_LOOP_FRAME_FAILED', cause })
    );
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    await mounted.dispose();
  });

  it('releases observers, scene and host when callback installation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('Callback installation failed.');
    mocks.setAnimationLoop.mockRejectedValueOnce(cause);

    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: 'RENDERING_LOOP_CALLBACK_CHANGE_FAILED', cause });
    expect(mocks.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(mocks.probeDispose).toHaveBeenCalledOnce();
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
  });

  it('pauses when hidden and remeasures layout on return even without a resize notification', async () => {
    const suspend = vi.spyOn(RenderingProbeCreation.prototype, 'suspend');
    const resume = vi.spyOn(RenderingProbeCreation.prototype, 'resume');
    const dimensions = { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument };
    const mounted = await mountRenderingProbe(
      dimensions as HTMLCanvasElement,
      new AbortController().signal
    );
    expect(suspend).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
    runFrame();
    pageDocument.hidden = true;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    expect(installedCallback).toBeNull();
    expect(suspend).toHaveBeenCalledOnce();
    dimensions.clientWidth = 1000;
    timestampMs += 60000;

    pageDocument.hidden = false;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    expect(resume).toHaveBeenCalledOnce();
    expect(resume.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.setAnimationLoop.mock.invocationCallOrder.at(-1) ?? 0
    );
    const operations: string[] = [];
    mocks.hostResize.mockImplementation(() => operations.push('buffer'));
    mocks.probeResize.mockImplementation(() => operations.push('camera'));
    mocks.render.mockImplementation(() => operations.push('draw'));
    runFrame();
    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(mocks.hostResize).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 1000,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    await mounted.dispose();
  });

  it('mounts hidden without starting and ignores visibility changes after disposal', async () => {
    const activate = vi.spyOn(RenderingProbeCreation.prototype, 'activate');
    const suspend = vi.spyOn(RenderingProbeCreation.prototype, 'suspend');
    const resume = vi.spyOn(RenderingProbeCreation.prototype, 'resume');
    pageDocument.hidden = true;
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    expect(mocks.setAnimationLoop).not.toHaveBeenCalled();
    expect(suspend).toHaveBeenCalledOnce();
    expect(activate.mock.invocationCallOrder[0]).toBeLessThan(
      suspend.mock.invocationCallOrder[0] ?? 0
    );
    expect(resume).not.toHaveBeenCalled();

    pageDocument.hidden = false;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    expect(installedCallback).toBeTypeOf('function');
    runFrame();
    await mounted.dispose();
    const registrationCount = mocks.setAnimationLoop.mock.calls.length;
    pageDocument.hidden = true;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    pageDocument.hidden = false;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    expect(mocks.setAnimationLoop).toHaveBeenCalledTimes(registrationCount);
    expect(suspend).toHaveBeenCalledOnce();
    expect(resume).toHaveBeenCalledOnce();
  });

  it.each(['suspend', 'resume'] as const)(
    'logs a failed experience %s and leaves frames stopped',
    async (method) => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cause = new Error('Experience visibility failed.');
      const mounted = await mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      );
      vi.spyOn(RenderingProbeCreation.prototype, method).mockImplementationOnce(() => {
        throw cause;
      });
      pageDocument.hidden = true;
      pageDocument.dispatchEvent(new Event('visibilitychange'));
      if (method === 'resume') {
        pageDocument.hidden = false;
        pageDocument.dispatchEvent(new Event('visibilitychange'));
      }
      await vi.waitFor(() =>
        expect(errorLog).toHaveBeenCalledExactlyOnceWith('Rendering POC rendering failed', cause)
      );
      expect(installedCallback).toBeNull();
      expect(mocks.render).not.toHaveBeenCalled();
      await mounted.dispose();
      expect(mocks.probeDispose).toHaveBeenCalledOnce();
    }
  );

  it('releases the prepared experience when initial hidden-page suspension fails', async () => {
    pageDocument.hidden = true;
    const cause = new Error('Initial experience suspension failed.');
    vi.spyOn(RenderingProbeCreation.prototype, 'suspend').mockImplementationOnce(() => {
      throw cause;
    });
    await expect(
      mountRenderingProbe(
        { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
        new AbortController().signal
      )
    ).rejects.toBe(cause);
    expect(mocks.hostDispose).toHaveBeenCalledOnce();
    expect(mocks.probeDispose).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(installedCallback).toBeNull();
  });

  it('does not restart after a frame failure when the page becomes visible again', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    mocks.render.mockImplementationOnce(() => {
      throw new Error('Drawing failed.');
    });
    runFrame();
    await vi.waitFor(() => expect(errorLog).toHaveBeenCalledOnce());
    const registrationCount = mocks.setAnimationLoop.mock.calls.length;

    pageDocument.hidden = true;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    pageDocument.hidden = false;
    pageDocument.dispatchEvent(new Event('visibilitychange'));
    expect(installedCallback).toBeNull();
    expect(mocks.setAnimationLoop).toHaveBeenCalledTimes(registrationCount);
    await mounted.dispose();
  });

  it('redraws a same-size return from empty layout without clearing the buffer again', async () => {
    const dimensions = { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument };
    const mounted = await mountRenderingProbe(
      dimensions as HTMLCanvasElement,
      new AbortController().signal
    );
    runFrame();
    mocks.render.mockClear();
    mocks.probeResize.mockClear();

    dimensions.clientWidth = 0;
    notifyResize();
    runFrame();
    expect(mocks.render).not.toHaveBeenCalled();

    dimensions.clientWidth = 800;
    notifyResize();
    runFrame();
    expect(mocks.render).toHaveBeenCalledOnce();
    expect(mocks.hostResize).not.toHaveBeenCalled();
    expect(mocks.probeResize).not.toHaveBeenCalled();
    await mounted.dispose();
  });

  it('applies a pixel-ratio change before drawing without a CSS-size change', async () => {
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    runFrame();
    const operations: string[] = [];
    mocks.hostResize.mockImplementation(() => operations.push('buffer'));
    mocks.probeResize.mockImplementation(() => operations.push('camera'));
    mocks.render.mockImplementation(() => operations.push('draw'));
    Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
    notifyResize();
    expect(operations).toEqual([]);

    runFrame();
    expect(operations).toEqual(['buffer', 'camera', 'draw']);
    expect(mocks.hostResize).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 800,
      heightCssPx: 600,
      pixelRatio: 2,
    });
    await mounted.dispose();
  });

  it('keeps the POC resolution cap in the adapter rather than the session', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true });
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    runFrame();

    Object.defineProperty(window, 'devicePixelRatio', { value: 4 });
    notifyResize();
    runFrame();
    expect(mocks.hostResize).not.toHaveBeenCalled();

    Object.defineProperty(window, 'devicePixelRatio', { value: 1 });
    notifyResize();
    runFrame();
    expect(mocks.hostResize).toHaveBeenCalledExactlyOnceWith({
      widthCssPx: 800,
      heightCssPx: 600,
      pixelRatio: 1,
    });
    await mounted.dispose();
  });

  it('releases the scene even if session disposal fails and retains the coded failure', async () => {
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    const cause = new Error('Renderer cleanup failed.');
    mocks.hostDispose.mockRejectedValueOnce(cause);

    const disposal = mounted.dispose();
    await expect(disposal).rejects.toMatchObject({
      code: 'RENDERING_SESSION_DISPOSAL_FAILED',
      cause: { errors: [cause] },
    });
    expect(mocks.probeDispose).toHaveBeenCalledOnce();
    expect(mounted.dispose()).toBe(disposal);
  });

  it('retains both session and scene disposal failures', async () => {
    const mounted = await mountRenderingProbe(
      { clientWidth: 800, clientHeight: 600, ownerDocument: pageDocument } as HTMLCanvasElement,
      new AbortController().signal
    );
    const hostCause = new Error('Renderer cleanup failed.');
    const sceneCause = new Error('Scene cleanup failed.');
    mocks.hostDispose.mockRejectedValueOnce(hostCause);
    mocks.probeDispose.mockImplementationOnce(() => {
      throw sceneCause;
    });

    await expect(mounted.dispose()).rejects.toMatchObject({
      errors: [
        expect.objectContaining({ code: 'RENDERING_SESSION_DISPOSAL_FAILED' }),
        {
          code: 'EXPERIENCE_COORDINATOR_DISPOSAL_FAILED',
          cause: { errors: [sceneCause] },
        },
      ],
    });
  });
});
