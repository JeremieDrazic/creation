/** Stable renderer codes; the UI owns their visitor-facing translations. */
export const RENDERING_HOST_ERROR_CODES = {
  INITIALIZATION_FAILED: 'RENDERER_INITIALIZATION_FAILED',
  DISPOSAL_FAILED: 'RENDERER_DISPOSAL_FAILED',
} as const;

/** Operational failures owned by the rendering host, separate from cancellation and misuse. */
export type RenderingHostErrorCode =
  (typeof RENDERING_HOST_ERROR_CODES)[keyof typeof RENDERING_HOST_ERROR_CODES];
