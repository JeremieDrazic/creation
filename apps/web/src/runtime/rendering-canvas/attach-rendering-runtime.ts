import type { RenderingRuntime } from '../../types';
import {
  createRenderingRuntime,
  type RenderingRuntimeOptions,
} from '../rendering-runtime/rendering-runtime';

/**
 * Starts a runtime on an existing canvas and immediately returns a synchronous detach function.
 * Owns startup cancellation and disposal of ready or late results; the caller owns canvas DOM.
 * Callbacks must not throw. Expected cancellation is silent; other failures reach onError.
 */
export function attachRenderingRuntime(
  options: Omit<RenderingRuntimeOptions, 'signal'>
): () => void {
  const controller = new AbortController();
  let runtime: RenderingRuntime | undefined;

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

  return detachRuntime;
}
