import type { WebGPURenderer } from 'three/webgpu';

/** Canvas dimensions in CSS pixels; pixelRatio controls physical drawing resolution. */
export type RenderingViewport = Readonly<{
  widthCssPx: number;
  heightCssPx: number;
  pixelRatio: number;
}>;

/** Passage time in seconds, excluding pauses and time discarded by the delta limit. */
export type FrameTime = Readonly<{
  deltaSeconds: number;
  elapsedSeconds: number;
}>;

/** Owns the renderer, while scenes, cameras and the DOM canvas remain caller-owned. */
export type RenderingHost = Readonly<{
  /** Borrow for rendering and effects; release it through host.dispose() only. */
  renderer: WebGPURenderer;
  /** Updates drawing resolution without changing CSS layout or any camera projection. */
  resize: (viewport: RenderingViewport) => void;
  /** Repeated calls share the same cleanup promise. Does not remove the DOM canvas. */
  dispose: () => Promise<void>;
}>;

/** Owns one callback and its clock, never the borrowed renderer's lifetime. */
export type RenderingLoop = Readonly<{
  /** Attaches the callback. Repeated starts share the current promise until stopped. */
  startRenderingFrames: () => Promise<void>;
  /** Immediately blocks frame work, preserves elapsed time and awaits callback removal. */
  stopRenderingFrames: () => Promise<void>;
  /** Permanently blocks starts and removes the callback; repeated calls share one promise. */
  dispose: () => Promise<void>;
}>;

/** A frame's measured dimensions and whether the caller needs to apply them before drawing. */
export type FrameViewport = Readonly<{
  viewport: RenderingViewport;
  /** Compares with the last drawable viewport; false when no drawable area exists. */
  hasChanged: boolean;
  /** Both drawing-buffer dimensions must contain at least one physical pixel. */
  hasDrawableArea: boolean;
}>;

/** Owns pending measurement state, not DOM listeners, renderer resize or camera changes. */
export type RenderingViewportController = Readonly<{
  /** Marks the next frame for measurement. Multiple notifications result in one measurement. */
  requestViewportMeasurement: () => void;
  /**
   * Remeasures only when requested, including the first call. If hasChanged is true, apply the
   * dimensions to the renderer/cameras and draw in this same frame. Skip drawing without drawable
   * area. Unchanged frames reuse a snapshot. A failed measurement remains pending for retry.
   *
   * @throws {CodedError} With INVALID_MEASUREMENT for invalid dimensions or pixel ratio.
   * @throws Rethrows a failure from the caller's measurement function without altering state.
   */
  readViewportForFrame: () => FrameViewport;
}>;

/** One canvas's renderer, graphics loop and browser subscriptions; scenes remain caller-owned. */
export type RenderingSession = Readonly<{
  /**
   * Rechecks dimensions/resolution before the next drawable frame, for example after quality
   * changes.
   */
  requestViewportMeasurement: () => void;
  /** Stops frames and releases subscriptions/renderer once; await before releasing scene resources. */
  dispose: () => Promise<void>;
}>;

/** Owns resize subscriptions; the caller decides when and how to measure or resize. */
export type CanvasResizeObserver = Readonly<{
  /** Removes all observations once and prevents later notifications. */
  dispose: () => void;
}>;
