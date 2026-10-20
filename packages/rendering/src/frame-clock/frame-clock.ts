import { CodedError } from '@creation/utils/errors/coded-errors';

import type { FrameTime } from '../types';
import { FRAME_CLOCK_ERROR_CODES, type FrameClockErrorCode } from './frame-clock-errors';

export type { FrameTime };

const MILLISECONDS_PER_SECOND = 1000;

/** The caller chooses the maximum progression allowed in a single frame. */
export type FrameClockOptions = Readonly<{
  maxDeltaSeconds: number;
}>;

/** Owns passage time only; scheduling, visibility and audio remain caller-owned. */
export type FrameClock = Readonly<{
  /**
   * Accepts finite, non-negative timestamps in milliseconds from one monotonic time source. The
   * first call after creation or reset returns a zero delta. Later calls accumulate the capped
   * delta; discarded time is never caught up. Returns an independent time snapshot.
   *
   * @throws {CodedError} With INVALID_TIMESTAMP if the timestamp is invalid or goes backwards.
   */
  calculateFrameTime: (timestampMs: number) => FrameTime;
  /**
   * Forgets the previous timestamp while preserving elapsed time. Call when suspending the passage
   * so the next calculation ignores the pause. Does not stop scheduling itself.
   */
  resetPreviousFrameTimestamp: () => void;
}>;

/** Converts the interval to seconds and caps it; an absent previous timestamp starts a frame. */
function calculateDeltaSeconds(
  timestampMs: number,
  previousFrameTimestampMs: number | undefined,
  maxDeltaSeconds: number
): number {
  if (previousFrameTimestampMs === undefined) {
    return 0;
  }
  // Subtract the previous timestamp to obtain the duration between the two frames.
  const frameIntervalMs = timestampMs - previousFrameTimestampMs;
  // There are 1000 milliseconds in one second: 16 ms / 1000 = 0.016 seconds.
  const frameIntervalSeconds = frameIntervalMs / MILLISECONDS_PER_SECOND;
  // Keep the smaller value: a normal interval passes through; a long interval is capped.
  return Math.min(frameIntervalSeconds, maxDeltaSeconds);
}

/**
 * Creates an independent clock without reading browser time or starting a rendering loop. The
 * caller supplies each frame timestamp and resets the timestamp at suspension boundaries. No
 * default delta limit is imposed before movement stability has been evaluated.
 *
 * @throws {CodedError} With INVALID_MAX_DELTA if the limit is not finite and strictly positive.
 */
export function createFrameClock({ maxDeltaSeconds }: FrameClockOptions): FrameClock {
  if (!Number.isFinite(maxDeltaSeconds) || maxDeltaSeconds <= 0) {
    throw new CodedError<FrameClockErrorCode>(FRAME_CLOCK_ERROR_CODES.INVALID_MAX_DELTA);
  }

  let previousFrameTimestampMs: number | undefined;
  let elapsedSeconds = 0;

  function calculateFrameTime(timestampMs: number): FrameTime {
    if (
      !Number.isFinite(timestampMs) ||
      timestampMs < 0 ||
      (previousFrameTimestampMs !== undefined && timestampMs < previousFrameTimestampMs)
    ) {
      throw new CodedError<FrameClockErrorCode>(FRAME_CLOCK_ERROR_CODES.INVALID_TIMESTAMP);
    }

    const deltaSeconds = calculateDeltaSeconds(
      timestampMs,
      previousFrameTimestampMs,
      maxDeltaSeconds
    );
    previousFrameTimestampMs = timestampMs;
    elapsedSeconds += deltaSeconds;

    return { deltaSeconds, elapsedSeconds };
  }

  function resetPreviousFrameTimestamp(): void {
    previousFrameTimestampMs = undefined;
  }

  return { calculateFrameTime, resetPreviousFrameTimestamp };
}
