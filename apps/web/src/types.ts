import type { WebGPURenderer } from 'three/webgpu';

import type { FrameTime, RenderingViewport } from '@creation/rendering/types';

/**
 * Read-only rendering lifecycle information exposed to the UI. Publish only when this status
 * changes; frame updates and experience-owned artistic phases stay outside this contract.
 */
export type RenderingRuntimeStatus =
  | Readonly<{
      /** The renderer and initial experience are being prepared. */
      status: 'preparing';
      /** Measured preparation progress from 0 to 1; null when progress cannot be measured. */
      progress: number | null;
    }>
  | Readonly<{
      /** Initial preparation succeeded; does not describe drawing or artistic reveal progress. */
      status: 'ready';
    }>
  | Readonly<{
      /** A terminal initialization or rendering failure prevents further rendering. */
      status: 'failed';
      /** Original failure for diagnostics; visitor-facing messages belong to localized UI. */
      error: unknown;
    }>;

/** Application-owned rendering session and experience resources attached to one canvas. */
export interface RenderingRuntime {
  /**
   * Selects graphics without recreating the rendering session. Null clears active graphics;
   * otherwise the coordinator keeps the current experience until its replacement is ready.
   * Selection failures reject to the caller, including supersession. Does not publish navigation
   * progress through the startup status. Rejects when the runtime is no longer available.
   */
  selectExperience(prepareExperience: PrepareCreationExperience | null): Promise<void>;

  /** Stops frames before releasing resources. Repeated calls share one promise. */
  dispose(): Promise<void>;
}

/** Shared inputs for static async preparation, such as IntroCreation.prepare(options). */
export type CreationExperiencePreparationOptions = Readonly<{
  /** Initialized renderer borrowed for resource/shader preparation; never disposed by an experience. */
  renderer: WebGPURenderer;
  /** Current drawable dimensions and drawing resolution used to prepare cameras/effects. */
  viewport: RenderingViewport;
  /** Cancels preparation; failure/cancellation must release partially created resources. */
  signal: AbortSignal;
}>;

/**
 * Common contract implemented by prepared experience classes. The application calls these methods;
 * experiences never create their own graphics loop. Scenes, cameras, simulation, local effects and
 * their resources belong to the experience. Renderer/canvas lifetime belongs to the rendering
 * session; application coordination owns navigation, suspension order and audio services.
 *
 * Static prepare() returns a ready instance before activation. It is not an instance method in this
 * interface. Artistic reveal/withdrawal functions remain specific to each experience, separate from
 * activation and resumption. Runtime methods below are synchronous.
 */
export interface CreationExperience {
  /** Enables designated experience work/inputs; does not start its artistic reveal. */
  activate(): void;

  /**
   * Advances simulation and visual state before drawing, within the shared frame callback. Frame
   * time is in seconds and belongs to the session. elapsedSeconds is not this experience's age; use
   * deltaSeconds to advance an experience-owned clock when needed.
   */
  update(frameTime: FrameTime): void;

  /** Draws current visual state with the borrowed renderer; does not replace its animation callback. */
  render(renderer: WebGPURenderer): void;

  /**
   * Adjusts cameras/effects before the first draw and after resize; never resizes the shared
   * canvas.
   */
  resize(viewport: RenderingViewport): void;

  /** Pauses experience-owned work/inputs/animations while preserving resources and artistic state. */
  suspend(): void;

  /** Continues preserved work after suspension; does not replay the reveal or catch up hidden time. */
  resume(): void;

  /**
   * Permanently releases owned resources, listeners and animations. Repeated calls are safe.
   * Application coordination must stop using this experience before disposing it. Shared renderer,
   * canvas and audio-service resources remain with their respective owners.
   */
  dispose(): void;
}

/** Prepares a ready experience using resources borrowed from the application. */
export type PrepareCreationExperience = (
  options: CreationExperiencePreparationOptions
) => Promise<CreationExperience>;

/** Initial coordinator contract; implementation and remaining operations follow separate reviews. */
export interface ExperienceCoordinator {
  /**
   * Keeps the current experience usable while preparing the requested one. Resolves once the ready
   * instance is activated and selected; does not wait for drawing or an artistic reveal.
   * Preparation/activation failure rejects without replacing the current experience. After
   * selection, releases the previous instance; its cleanup failure rejects while keeping the new
   * instance active. A newer request cancels obsolete preparation; its promise rejects with the
   * cancellation reason.
   */
  prepareAndActivateExperience(prepareExperience: PrepareCreationExperience): Promise<void>;

  /**
   * Cancels pending preparation and releases the active experience, leaving the coordinator
   * reusable. Late preparation results are released by their existing cancellation path; this
   * method does not wait for them. Does not clear canvas pixels or dispose the borrowed renderer.
   * Repeated calls and calls after disposal do nothing when no experience remains.
   */
  clearActiveExperience(): void;

  /** Updates only the active instance. Call before renderActiveExperience in the session frame. */
  updateActiveExperience(frameTime: FrameTime): void;

  /** Draws only the active instance using the borrowed renderer; owns no frame scheduling. */
  renderActiveExperience(): void;

  /**
   * Remembers drawable dimensions for preparation and forwards them to the active instance. The
   * caller owns resizing the renderer; this operation adjusts experience cameras/effects only.
   */
  resizeActiveExperience(viewport: RenderingViewport): void;

  /** Blocks update/render and suspends the active instance once; does not stop the shared loop. */
  suspendActiveExperience(): void;

  /** Resumes the instance before allowing update/render again; repeated calls have no effect. */
  resumeActiveExperience(): void;

  /**
   * Permanently blocks calls, cancels/awaits preparation and releases owned experience resources.
   * Repeated calls share one promise. The borrowed renderer remains owned by the rendering
   * session.
   */
  dispose(): Promise<void>;
}
