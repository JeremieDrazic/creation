import {
  createRenderingSession,
  type RenderingSession,
} from '@creation/rendering/rendering-session';
import { RENDERING_SESSION_ERROR_CODES } from '@creation/rendering/rendering-session/errors';
import { getElementWindow } from '@creation/utils/dom/get-element-window';

import { ExperienceCoordinator } from '../runtime/experience-coordinator/experience-coordinator';
import { RenderingProbeCreation } from './rendering-probe-creation';

const MAX_PROBE_PIXEL_RATIO = 2;
// Temporary test configuration; the static triangle does not use frame time for movement.
const MAX_PROBE_FRAME_DELTA_SECONDS = 0.05;

/** Temporary browser integration, not the production experience lifecycle. */
export type MountedRenderingProbe = Readonly<{
  /** Releases the rendering session before scene resources; leaves the DOM canvas intact. */
  dispose: () => Promise<void>;
}>;

/**
 * Connects a temporary static triangle to the production rendering session. The session owns
 * scheduling, viewport measurements, visibility subscriptions and renderer cleanup. Scene creation
 * runs through RenderingProbeCreation.prepare after renderer initialization, before activation and
 * frame registration. The coordinator owns the prepared instance and forwards lifecycle calls; the
 * creation owns its scene/camera. This adapter selects the test resolution. Each frame calls update
 * before render. Visibility callbacks suspend/resume the experience while the session owns frame
 * stopping/restarting. Runtime failures are logged; the temporary React harness does not yet
 * display those later errors. The signal cancels creation only; after readiness, the caller must
 * await dispose().
 */
export async function mountRenderingProbe(
  canvas: HTMLCanvasElement,
  signal: AbortSignal
): Promise<MountedRenderingProbe> {
  const browserWindow = getElementWindow(canvas, RENDERING_SESSION_ERROR_CODES.UNAVAILABLE_WINDOW);
  let coordinator: ExperienceCoordinator | undefined;
  let session: RenderingSession;

  try {
    session = await createRenderingSession({
      canvas,
      signal,
      readPixelRatio: () => Math.min(browserWindow.devicePixelRatio, MAX_PROBE_PIXEL_RATIO),
      maxDeltaSeconds: MAX_PROBE_FRAME_DELTA_SECONDS,
      prepareRendering: async (context) => {
        coordinator = new ExperienceCoordinator(context);
        await coordinator.prepareAndActivateExperience((options) =>
          RenderingProbeCreation.prepare(options)
        );
      },
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
        console.error('Rendering POC rendering failed', error);
      },
    });
  } catch (cause) {
    try {
      await coordinator?.dispose();
    } catch (cleanupCause) {
      throw new AggregateError([cause, cleanupCause], 'Probe creation and cleanup failed.');
    }
    throw cause;
  }

  let disposalPromise: Promise<void> | undefined;

  function dispose(): Promise<void> {
    if (disposalPromise === undefined) {
      disposalPromise = Promise.resolve().then(async () => {
        const failures: unknown[] = [];

        try {
          await session.dispose();
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
          throw new AggregateError(failures, 'Probe session and scene cleanup failed.');
        }
      });
    }

    return disposalPromise;
  }

  return { dispose };
}
