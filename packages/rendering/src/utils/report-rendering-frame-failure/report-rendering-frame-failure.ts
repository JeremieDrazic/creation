import { CodedError } from '@creation/utils/errors/coded-errors';

/**
 * Stops frame work before notifying the caller. Preserves the original frame failure and any
 * failure during callback removal. Dependencies are supplied explicitly; this function owns no loop
 * state. The caller supplies the reported error code. onError must return synchronously without
 * throwing.
 */
export async function reportRenderingFrameFailure<Code extends string>(
  cause: unknown,
  stopRenderingFrames: () => Promise<void>,
  onError: (error: CodedError<Code>) => void,
  frameFailureErrorCode: Code
): Promise<void> {
  let failureCause = cause;

  try {
    await stopRenderingFrames();
  } catch (removalFailure) {
    failureCause = new AggregateError(
      [cause, removalFailure],
      'Frame and callback removal failed.'
    );
  }

  onError(
    new CodedError<Code>(frameFailureErrorCode, {
      cause: failureCause,
    })
  );
}
