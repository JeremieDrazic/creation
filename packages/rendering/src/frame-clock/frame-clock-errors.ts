/** Stable frame-clock validation codes; callers own any user-facing wording. */
export const FRAME_CLOCK_ERROR_CODES = {
  INVALID_MAX_DELTA: 'FRAME_CLOCK_INVALID_MAX_DELTA',
  INVALID_TIMESTAMP: 'FRAME_CLOCK_INVALID_TIMESTAMP',
} as const;

/** Invalid clock configuration or timestamps, owned by the frame-clock module. */
export type FrameClockErrorCode =
  (typeof FRAME_CLOCK_ERROR_CODES)[keyof typeof FRAME_CLOCK_ERROR_CODES];
