import type { WebGPURenderer } from 'three/webgpu';

import type { FrameTime, RenderingViewport } from '@creation/rendering/types';

import type { CreationExperience, CreationExperiencePreparationOptions } from '../types';
import { createRenderingProbe, type RenderingProbe } from './rendering-probe';

/**
 * Temporary implementation of the experience contract using the existing static triangle. Owns its
 * scene resources, borrows the renderer and never schedules frames. This validates the contract
 * before an artistic experience is implemented; it is not intro artwork.
 */
export class RenderingProbeCreation implements CreationExperience {
  private readonly probe: RenderingProbe;
  private isDisposed = false;

  private constructor(probe: RenderingProbe) {
    this.probe = probe;
  }

  /**
   * Returns a ready scene through the future experiences' async preparation API. Construction is
   * synchronous for this triangle; it needs no asset loading or renderer preparation.
   */
  static async prepare({
    viewport,
    signal,
  }: CreationExperiencePreparationOptions): Promise<RenderingProbeCreation> {
    signal.throwIfAborted();

    const probe = createRenderingProbe(viewport.widthCssPx / viewport.heightCssPx);
    return new RenderingProbeCreation(probe);
  }

  activate(): void {
    // This static probe has no inputs or other work to enable.
  }

  update(_frameTime: FrameTime): void {
    // Deliberately static: frame time does not change the triangle.
  }

  render(renderer: WebGPURenderer): void {
    if (this.isDisposed) {
      return;
    }

    renderer.render(this.probe.scene, this.probe.camera);
  }

  resize(viewport: RenderingViewport): void {
    if (this.isDisposed) {
      return;
    }

    this.probe.resize(viewport.widthCssPx / viewport.heightCssPx);
  }

  suspend(): void {
    // This probe has no autonomous work; the application stops calling render while hidden.
  }

  resume(): void {
    // There is no paused animation or input to resume.
  }

  /** Releases the scene once. The borrowed renderer remains application-owned. */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.probe.dispose();
  }
}
