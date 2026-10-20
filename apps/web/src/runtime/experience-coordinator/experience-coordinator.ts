import type { WebGPURenderer } from 'three/webgpu';

import type { FrameTime, RenderingViewport } from '@creation/rendering/types';
import { CodedError } from '@creation/utils/errors/coded-errors';

import type {
  CreationExperience,
  CreationExperiencePreparationOptions,
  ExperienceCoordinator as ExperienceCoordinatorContract,
  PrepareCreationExperience,
} from '../../types';
import { EXPERIENCE_COORDINATOR_ERROR_CODES } from './experience-coordinator-errors';

/**
 * Prepares and owns one active experience, keeping it usable until its replacement is ready. A
 * newer request cancels obsolete preparation. Used by the temporary rendering probe, not production
 * routing.
 */
export class ExperienceCoordinator implements ExperienceCoordinatorContract {
  private readonly renderer: WebGPURenderer;
  private readonly externalPreparationSignal: AbortSignal;
  private preparationAbortController: AbortController | undefined;
  private readonly pendingPreparations = new Map<Promise<void>, AbortSignal>();
  private disposalPromise: Promise<void> | undefined;
  private isDisposed = false;
  private currentViewport: RenderingViewport;
  private activeExperience: CreationExperience | undefined;
  private isSuspended = false;

  /** Borrows the renderer and preparation signal; copies the supplied viewport. */
  constructor(options: CreationExperiencePreparationOptions) {
    this.renderer = options.renderer;
    this.externalPreparationSignal = options.signal;
    this.currentViewport = { ...options.viewport };
  }

  updateActiveExperience(frameTime: FrameTime): void {
    if (this.isDisposed || this.isSuspended) {
      return;
    }

    this.activeExperience?.update(frameTime);
  }

  renderActiveExperience(): void {
    if (this.isDisposed || this.isSuspended) {
      return;
    }

    this.activeExperience?.render(this.renderer);
  }

  resizeActiveExperience(viewport: RenderingViewport): void {
    if (this.isDisposed) {
      return;
    }

    this.currentViewport = { ...viewport };
    this.activeExperience?.resize({ ...this.currentViewport });
  }

  suspendActiveExperience(): void {
    if (this.isDisposed || this.isSuspended) {
      return;
    }

    this.isSuspended = true;
    this.activeExperience?.suspend();
  }

  resumeActiveExperience(): void {
    if (this.isDisposed || !this.isSuspended) {
      return;
    }

    this.activeExperience?.resume();
    this.isSuspended = false;
  }

  async prepareAndActivateExperience(prepareExperience: PrepareCreationExperience): Promise<void> {
    if (this.isDisposed) {
      throw new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED);
    }

    const previousPreparationAbortController = this.preparationAbortController;
    const preparationAbortController = new AbortController();
    this.preparationAbortController = preparationAbortController;

    // Either the caller or this coordinator can cancel this preparation.
    const preparationSignal = AbortSignal.any([
      this.externalPreparationSignal,
      preparationAbortController.signal,
    ]);

    // Register the pending operation before the preparer can call back into this coordinator.
    const preparationPromise = Promise.resolve().then(() =>
      this.prepareAndActivateRequestedExperience(prepareExperience, preparationSignal)
    );
    this.pendingPreparations.set(preparationPromise, preparationSignal);

    previousPreparationAbortController?.abort(
      new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_SUPERSEDED)
    );

    try {
      await preparationPromise;
    } finally {
      this.pendingPreparations.delete(preparationPromise);
      if (this.preparationAbortController === preparationAbortController) {
        this.preparationAbortController = undefined;
      }
    }
  }

  /** Blocks use immediately; repeated calls share cleanup, including a failed cleanup result. */
  dispose(): Promise<void> {
    if (this.disposalPromise === undefined) {
      this.isDisposed = true;
      const cancellationReason = new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSED);
      const pendingPreparations = [...this.pendingPreparations];

      this.disposalPromise = Promise.resolve().then(async () => {
        const failures: unknown[] = [];

        await Promise.all(
          pendingPreparations.map(async ([preparationPromise, preparationSignal]) => {
            try {
              await preparationPromise;
            } catch (cause) {
              // Expected cancellation does not hide a different preparation or cleanup failure.
              if (!preparationSignal.aborted || cause !== preparationSignal.reason) {
                failures.push(cause);
              }
            }
          })
        );

        const experience = this.activeExperience;
        this.activeExperience = undefined;

        try {
          experience?.dispose();
        } catch (cause) {
          failures.push(cause);
        }

        if (failures.length > 0) {
          throw new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.DISPOSAL_FAILED, {
            cause: new AggregateError(failures, 'Experience coordinator cleanup failed.'),
          });
        }
      });

      this.preparationAbortController?.abort(cancellationReason);
    }

    return this.disposalPromise;
  }

  private async prepareAndActivateRequestedExperience(
    prepareExperience: PrepareCreationExperience,
    preparationSignal: AbortSignal
  ): Promise<void> {
    let preparedExperience: CreationExperience | undefined;

    try {
      preparationSignal.throwIfAborted();

      preparedExperience = await prepareExperience({
        renderer: this.renderer,
        viewport: { ...this.currentViewport },
        signal: preparationSignal,
      });

      preparationSignal.throwIfAborted();
      preparedExperience.resize({ ...this.currentViewport });
      preparationSignal.throwIfAborted();
      preparedExperience.activate();

      if (this.isSuspended) {
        preparedExperience.suspend();
      }

      preparationSignal.throwIfAborted();
    } catch (cause) {
      try {
        preparedExperience?.dispose();
      } catch (cleanupCause) {
        throw new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.PREPARATION_AND_CLEANUP_FAILED, {
          cause: new AggregateError(
            [cause, cleanupCause],
            'Experience preparation and cleanup failed.'
          ),
        });
      }

      throw cause;
    }

    const previousExperience = this.activeExperience;
    this.activeExperience = preparedExperience;

    // Selection has succeeded: an outgoing cleanup failure must not release the new instance.
    try {
      previousExperience?.dispose();
    } catch (cause) {
      throw new CodedError(EXPERIENCE_COORDINATOR_ERROR_CODES.PREVIOUS_EXPERIENCE_DISPOSAL_FAILED, {
        cause,
      });
    }
  }
}
