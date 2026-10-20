/** Stable rendering-loop codes; callers own recovery and user-facing wording. */
export const RENDERING_LOOP_ERROR_CODES = {
  DISPOSED: 'RENDERING_LOOP_DISPOSED',
  CALLBACK_CHANGE_FAILED: 'RENDERING_LOOP_CALLBACK_CHANGE_FAILED',
  FRAME_FAILED: 'RENDERING_LOOP_FRAME_FAILED',
} as const;

/** Scheduling and frame failures owned by the rendering-loop module. */
export type RenderingLoopErrorCode =
  (typeof RENDERING_LOOP_ERROR_CODES)[keyof typeof RENDERING_LOOP_ERROR_CODES];
