import { expect, test, vi } from 'vitest';

import { reportRenderingFrameFailure } from './report-rendering-frame-failure';

test('waits for frame shutdown before delivering the original failure', async () => {
  const cause = new Error('Frame failed.');
  const shutdown = Promise.withResolvers<void>();
  const stopRenderingFrames = vi.fn(() => shutdown.promise);
  const onError = vi.fn();

  const report = reportRenderingFrameFailure(
    cause,
    stopRenderingFrames,
    onError,
    'TEST_FRAME_FAILED'
  );
  expect(stopRenderingFrames).toHaveBeenCalledOnce();
  expect(onError).not.toHaveBeenCalled();

  shutdown.resolve();
  await report;
  expect(onError).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'TEST_FRAME_FAILED', cause })
  );
});

test('also retains a synchronous shutdown failure with the original frame failure', async () => {
  const cause = new Error('Frame failed.');
  const removalFailure = new Error('Shutdown threw.');
  const stopRenderingFrames = vi.fn<() => Promise<void>>(() => {
    throw removalFailure;
  });
  const onError = vi.fn<Parameters<typeof reportRenderingFrameFailure>[2]>();

  await reportRenderingFrameFailure(cause, stopRenderingFrames, onError, 'TEST_FRAME_FAILED');
  expect(onError).toHaveBeenCalledOnce();
  const failure = onError.mock.calls[0]?.[0];
  expect(failure?.code).toBe('TEST_FRAME_FAILED');
  if (!(failure?.cause instanceof AggregateError)) {
    throw new Error('Expected both failures to be preserved.');
  }
  expect(failure.cause.errors).toEqual([cause, removalFailure]);
});
