import type { CanvasResizeObserver } from '../../types';

export type { CanvasResizeObserver } from '../../types';

export type CanvasResizeObserverOptions = Readonly<{
  canvas: HTMLCanvasElement;
  /** The canvas's own window supplies ResizeObserver and window resize events. */
  browserWindow: Window & typeof globalThis;
  /** Requests measurement only; never change drawing dimensions in this notification. */
  onResize: () => void;
}>;

/**
 * Observes canvas layout and window resize. A window resize also lets the caller request a
 * pixel-ratio recheck. Notifications do not measure layout or touch the renderer. The caller
 * handles asynchronous work started by its callbacks. Setup failure removes acquired observations
 * and rethrows the cause.
 */
export function observeCanvasResize({
  canvas,
  browserWindow,
  onResize,
}: CanvasResizeObserverOptions): CanvasResizeObserver {
  let isDisposed = false;

  function reportResize(): void {
    if (!isDisposed) {
      onResize();
    }
  }

  const resizeObserver = new browserWindow.ResizeObserver(reportResize);

  function dispose(): void {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    resizeObserver.disconnect();
    browserWindow.removeEventListener('resize', reportResize);
  }

  try {
    resizeObserver.observe(canvas);
    browserWindow.addEventListener('resize', reportResize);
  } catch (cause) {
    dispose();
    throw cause;
  }

  return { dispose };
}
