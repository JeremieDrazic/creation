import { CodedError } from '@creation/utils/errors/coded-errors';

import type { PrepareCreationExperience, RenderingRuntime } from '../../types';
import { EXPERIENCE_COORDINATOR_ERROR_CODES } from '../experience-coordinator/experience-coordinator-errors';
import {
  createRenderingRuntime,
  type RenderingRuntimeOptions,
} from '../rendering-runtime/rendering-runtime';

export type RenderingRuntimeAttachment = Readonly<{
  /** Selects graphics, or remembers the latest selection until startup completes. */
  selectExperience: (prepareExperience: PrepareCreationExperience | null) => void;
  /** Cancels startup and releases a ready or late runtime. Repeated calls are safe. */
  detach: () => void;
}>;

/**
 * Starts a runtime on an existing canvas and immediately returns selection/detach commands. Owns
 * startup cancellation and disposal of ready or late results; the caller owns canvas DOM. Repeated
 * selection of the same preparation function is ignored. During startup only the latest request is
 * retained; it is applied after initial preparation completes, without restarting it. Callbacks
 * must not throw. Expected cancellation is silent; other failures reach onError.
 */
export function attachRenderingRuntime(
  options: Omit<RenderingRuntimeOptions, 'signal'>
): RenderingRuntimeAttachment {
  const controller = new AbortController();
  let runtime: RenderingRuntime | undefined;
  let requestedExperience = options.prepareInitialExperience;

  function forwardSelection(prepareExperience: PrepareCreationExperience | null): void {
    if (runtime === undefined) {
      return;
    }

    void runtime.selectExperience(prepareExperience).catch((error: unknown) => {
      const wasSuperseded =
        error instanceof CodedError &&
        error.code === EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED;
      const wasDetached =
        controller.signal.aborted &&
        (error === controller.signal.reason ||
          (error instanceof CodedError &&
            error.code === EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED));

      if (!wasSuperseded && !wasDetached) {
        options.onError(error);
      }
    });
  }

  function selectExperience(prepareExperience: PrepareCreationExperience | null): void {
    if (controller.signal.aborted || requestedExperience === prepareExperience) {
      return;
    }

    requestedExperience = prepareExperience;
    forwardSelection(prepareExperience);
  }

  async function startRuntime(): Promise<void> {
    try {
      const preparedRuntime = await createRenderingRuntime({
        ...options,
        signal: controller.signal,
        publishStatus: (status) => {
          // Cancelled startup/cleanup must not overwrite the next runtime's status.
          if (!controller.signal.aborted) {
            options.publishStatus(status);
          }
        },
      });

      if (controller.signal.aborted) {
        await preparedRuntime.dispose();
        return;
      }

      runtime = preparedRuntime;
      if (requestedExperience !== options.prepareInitialExperience) {
        forwardSelection(requestedExperience);
      }
    } catch (error) {
      if (!controller.signal.aborted || error !== controller.signal.reason) {
        options.onError(error);
      }
    }
  }

  function detachRuntime(): void {
    if (controller.signal.aborted) {
      return;
    }

    controller.abort();

    if (runtime !== undefined) {
      void runtime.dispose().catch(options.onError);
    }
  }

  void startRuntime();

  return { selectExperience, detach: detachRuntime };
}
