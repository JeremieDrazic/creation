import { CodedError } from '@creation/utils/errors/coded-errors';

import type { RenderingHost, RenderingLoop } from '../../types';

/**
 * Removes the frame callback before releasing its renderer; preserves failures from both steps.
 * Reports cleanup failures under the caller-supplied error code.
 */
export async function disposeRenderingLoopAndHost<Code extends string>(
  loop: RenderingLoop | undefined,
  host: RenderingHost,
  disposalErrorCode: Code
): Promise<void> {
  const failures: unknown[] = [];
  try {
    await loop?.dispose();
  } catch (cause) {
    failures.push(cause);
  }
  try {
    await host.dispose();
  } catch (cause) {
    failures.push(cause);
  }
  if (failures.length > 0) {
    throw new CodedError<Code>(disposalErrorCode, {
      cause: new AggregateError(failures, 'Rendering session cleanup failed.'),
    });
  }
}
