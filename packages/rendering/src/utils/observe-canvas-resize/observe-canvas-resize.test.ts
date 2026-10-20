import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { observeCanvasResize, type CanvasResizeObserverOptions } from './observe-canvas-resize';

describe('observeCanvasResize', () => {
  let notifyCanvasResize: () => void;
  let ownerWindow: EventTarget & { ResizeObserver: typeof ResizeObserver };
  let ownerDocument: EventTarget & { hidden: boolean };
  let canvas: HTMLCanvasElement;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const onResize = vi.fn();

  function options(): CanvasResizeObserverOptions {
    return {
      canvas,
      browserWindow: ownerWindow as unknown as Window & typeof globalThis,
      onResize,
    };
  }

  beforeEach(() => {
    vi.resetAllMocks();
    class FakeResizeObserver {
      constructor(notify: () => void) {
        notifyCanvasResize = notify;
      }
      observe = observe;
      disconnect = disconnect;
    }
    ownerWindow = Object.assign(new EventTarget(), {
      ResizeObserver: FakeResizeObserver as unknown as typeof ResizeObserver,
    });
    ownerDocument = Object.assign(new EventTarget(), { hidden: false });
    canvas = { ownerDocument } as unknown as HTMLCanvasElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards canvas/window notifications without measuring layout', () => {
    const readWidth = vi.fn();
    Object.defineProperty(canvas, 'clientWidth', { get: readWidth });
    const observer = observeCanvasResize(options());

    expect(observe).toHaveBeenCalledExactlyOnceWith(canvas);
    expect(onResize).not.toHaveBeenCalled();

    notifyCanvasResize();
    ownerWindow.dispatchEvent(new Event('resize'));
    expect(onResize).toHaveBeenCalledTimes(2);
    expect(readWidth).not.toHaveBeenCalled();

    observer.dispose();
  });

  it('releases each observation once and ignores late notifications', () => {
    const removeResizeListener = vi.spyOn(ownerWindow, 'removeEventListener');
    const observer = observeCanvasResize(options());

    observer.dispose();
    observer.dispose();
    notifyCanvasResize();
    ownerWindow.dispatchEvent(new Event('resize'));

    expect(disconnect).toHaveBeenCalledOnce();
    expect(removeResizeListener).toHaveBeenCalledExactlyOnceWith('resize', expect.any(Function));
    expect(onResize).not.toHaveBeenCalled();
  });

  it('disconnects the resize observer if subscribing to canvas layout fails', () => {
    const cause = new Error('Layout observation failed.');
    observe.mockImplementationOnce(() => {
      throw cause;
    });

    expect(() => observeCanvasResize(options())).toThrow(cause);
    expect(disconnect).toHaveBeenCalledOnce();
    notifyCanvasResize();
    expect(onResize).not.toHaveBeenCalled();
  });

  it('disconnects canvas observation if subscribing to window resize fails', () => {
    const cause = new Error('Window subscription failed.');
    vi.spyOn(ownerWindow, 'addEventListener').mockImplementationOnce(() => {
      throw cause;
    });

    expect(() => observeCanvasResize(options())).toThrow(cause);
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
