import {
  createRenderingSession,
  type RenderingPreparationContext,
} from '@creation/rendering/rendering-session';
import type { RenderingSession } from '@creation/rendering/types';
import { CodedError } from '@creation/utils/errors/coded-errors';

import type {
  PrepareCreationExperience,
  RenderingRuntime,
  RenderingRuntimeStatus,
} from '../../types';
import { ExperienceCoordinator } from '../experience-coordinator/experience-coordinator';
import { RENDERING_RUNTIME_ERROR_CODES } from './rendering-runtime-errors';

/** Inputs needed to start one experience in a caller-owned canvas. */
export type RenderingRuntimeOptions = Readonly<{
  /** React owns the canvas layout and DOM removal; the runtime owns its rendering resources. */
  canvas: HTMLCanvasElement;

  /** Prepares the first experience after renderer initialization. */
  prepareInitialExperience: PrepareCreationExperience;

  /** Reads the selected drawing resolution ratio; the runtime imposes no quality cap. */
  readPixelRatio: () => number;

  /** Caps accepted time between frames, in seconds; forwarded to the rendering session. */
  maxDeltaSeconds: number;

  /** Cancels startup; once started, the caller must release the runtime through dispose(). */
  signal: AbortSignal;

  /** Publishes lifecycle snapshots to the caller's status store; must not throw. */
  publishStatus: (status: RenderingRuntimeStatus) => void;

  /** Receives terminal rendering failures after startup; must not throw. */
  onError: (error: unknown) => void;
}>;

/** Attempts both cleanups, in order, even when session disposal fails. */
async function disposeRuntimeResources(
  session: RenderingSession | undefined,
  coordinator: ExperienceCoordinator | undefined
): Promise<void> {
  const failures: unknown[] = [];

  try {
    await session?.dispose();
  } catch (cause) {
    failures.push(cause);
  }

  try {
    await coordinator?.dispose();
  } catch (cause) {
    failures.push(cause);
  }

  if (failures.length === 1) {
    throw failures[0];
  }
  if (failures.length > 1) {
    throw new CodedError(RENDERING_RUNTIME_ERROR_CODES.DISPOSAL_FAILED, {
      cause: new AggregateError(failures, 'Rendering runtime cleanup failed.'),
    });
  }
}

/**
 * Prepares the initial experience and connects it to the shared rendering session. Startup failures
 * reject after cleanup; later rendering failures reach onError. The caller owns canvas DOM removal
 * and must dispose a successfully created runtime, including when cancellation arrives just after
 * startup. The signal cancels startup only. Publishes preparation/readiness/failure, without
 * inventing progress measurements or triggering an artistic reveal. Expected cancellation does not
 * publish failed; cancellation combined with cleanup failure does.
 */
export async function createRenderingRuntime({
  canvas,
  prepareInitialExperience,
  readPixelRatio,
  maxDeltaSeconds,
  signal,
  publishStatus,
  onError,
}: RenderingRuntimeOptions): Promise<RenderingRuntime> {
  signal.throwIfAborted();
  publishStatus({ status: 'preparing', progress: null });

  let coordinator: ExperienceCoordinator | undefined;
  let session: RenderingSession;

  async function prepareInitialRenderingExperience(
    context: RenderingPreparationContext
  ): Promise<void> {
    coordinator = new ExperienceCoordinator(context);

    await coordinator.prepareAndActivateExperience(prepareInitialExperience);
  }

  try {
    session = await createRenderingSession({
      canvas,
      readPixelRatio,
      maxDeltaSeconds,
      signal,
      prepareRendering: prepareInitialRenderingExperience,
      onViewportChange: (viewport) => {
        coordinator?.resizeActiveExperience(viewport);
      },
      onFrame: (_renderer, frameTime) => {
        coordinator?.updateActiveExperience(frameTime);
        coordinator?.renderActiveExperience();
      },
      onSuspend: () => {
        coordinator?.suspendActiveExperience();
      },
      onResume: () => {
        coordinator?.resumeActiveExperience();
      },
      onError: (error) => {
        publishStatus({ status: 'failed', error });
        onError(error);
      },
    });
  } catch (cause) {
    let failure = cause;

    // Failed session creation already releases session resources; experience cleanup stays here.
    try {
      await disposeRuntimeResources(undefined, coordinator);
    } catch (cleanupCause) {
      failure = new CodedError(RENDERING_RUNTIME_ERROR_CODES.CREATION_AND_CLEANUP_FAILED, {
        cause: new AggregateError([cause, cleanupCause], 'Runtime creation and cleanup failed.'),
      });
    }
    if (!signal.aborted || failure !== signal.reason) {
      publishStatus({ status: 'failed', error: failure });
    }

    throw failure;
  }

  publishStatus({ status: 'ready' });

  let disposalPromise: Promise<void> | undefined;

  function dispose(): Promise<void> {
    if (disposalPromise === undefined) {
      disposalPromise = disposeRuntimeResources(session, coordinator);
    }

    return disposalPromise;
  }

  return { dispose };
}
