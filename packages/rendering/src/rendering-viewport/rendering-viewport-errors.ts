/** Stable viewport measurement code; callers own diagnostics and visitor-facing wording. */
export const RENDERING_VIEWPORT_ERROR_CODES = {
  INVALID_MEASUREMENT: 'RENDERING_VIEWPORT_INVALID_MEASUREMENT',
} as const;

export type RenderingViewportErrorCode =
  (typeof RENDERING_VIEWPORT_ERROR_CODES)[keyof typeof RENDERING_VIEWPORT_ERROR_CODES];
