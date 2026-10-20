import { describe, expect, test } from 'vitest';

import { CodedError } from '@creation/utils/errors/coded-errors';

import { createFrameClock } from './frame-clock';
import { FRAME_CLOCK_ERROR_CODES } from './frame-clock-errors';

// Test configuration only; this is not a production movement threshold.
const TEST_MAX_DELTA_SECONDS = 0.05;

describe('frame time', () => {
  test('starts at zero regardless of the initial timestamp and converts intervals to seconds', () => {
    const clock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });

    const firstFrame = clock.calculateFrameTime(1000);
    expect(firstFrame).toEqual({ deltaSeconds: 0, elapsedSeconds: 0 });
    expect(clock.calculateFrameTime(1016)).toEqual({ deltaSeconds: 0.016, elapsedSeconds: 0.016 });
    expect(clock.calculateFrameTime(1032)).toEqual({ deltaSeconds: 0.016, elapsedSeconds: 0.032 });
    expect(firstFrame).toEqual({ deltaSeconds: 0, elapsedSeconds: 0 });
  });

  test('caps a delayed frame and never catches up discarded time on later frames', () => {
    const clock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
    clock.calculateFrameTime(1000);

    expect(clock.calculateFrameTime(2000)).toEqual({ deltaSeconds: 0.05, elapsedSeconds: 0.05 });
    const nextFrame = clock.calculateFrameTime(2016);
    expect(nextFrame.deltaSeconds).toBe(0.016);
    expect(nextFrame.elapsedSeconds).toBeCloseTo(0.066);
  });

  test('ignores a pause while preserving elapsed time and tolerates repeated resets', () => {
    const clock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
    clock.calculateFrameTime(1000);
    clock.calculateFrameTime(1016);

    clock.resetPreviousFrameTimestamp();
    clock.resetPreviousFrameTimestamp();
    expect(clock.calculateFrameTime(61016)).toEqual({ deltaSeconds: 0, elapsedSeconds: 0.016 });
    expect(clock.calculateFrameTime(61032)).toEqual({ deltaSeconds: 0.016, elapsedSeconds: 0.032 });
  });

  test('allows repeated timestamps without advancing passage time', () => {
    const clock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
    clock.calculateFrameTime(1000);
    clock.calculateFrameTime(1016);

    expect(clock.calculateFrameTime(1016)).toEqual({ deltaSeconds: 0, elapsedSeconds: 0.016 });
  });

  test('keeps time independent between clocks', () => {
    const firstClock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
    const secondClock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
    firstClock.calculateFrameTime(1000);
    firstClock.calculateFrameTime(1016);

    expect(secondClock.calculateFrameTime(5000)).toEqual({ deltaSeconds: 0, elapsedSeconds: 0 });
  });
});

describe('invalid inputs', () => {
  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an invalid maximum delta: %s',
    (maxDeltaSeconds) => {
      expect(() => createFrameClock({ maxDeltaSeconds })).toThrow(
        expect.objectContaining({
          name: 'CodedError',
          code: FRAME_CLOCK_ERROR_CODES.INVALID_MAX_DELTA,
        })
      );
    }
  );

  test.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 999])(
    'rejects an invalid timestamp without changing clock state: %s',
    (timestampMs) => {
      const clock = createFrameClock({ maxDeltaSeconds: TEST_MAX_DELTA_SECONDS });
      clock.calculateFrameTime(1000);

      expect(() => clock.calculateFrameTime(timestampMs)).toThrow(
        expect.objectContaining({
          name: 'CodedError',
          code: FRAME_CLOCK_ERROR_CODES.INVALID_TIMESTAMP,
        })
      );
      expect(() => clock.calculateFrameTime(timestampMs)).toThrow(CodedError);
      expect(clock.calculateFrameTime(1016)).toEqual({
        deltaSeconds: 0.016,
        elapsedSeconds: 0.016,
      });
    }
  );
});
