import type { WebGPURenderer } from 'three/webgpu';

import type { FrameTime, RenderingViewport } from '@creation/rendering/types';

import type { CreationExperience, CreationExperiencePreparationOptions } from '../../types';
import { createCelestialVeil, type CelestialVeil } from './celestial-veil/celestial-veil';
import { loadCelestialVeilData } from './celestial-veil/data/load-celestial-veil-data';

/**
 * Static intro using the shared renderer and an offline-prepared asset. Orthographic framing
 * contains the reference without stretching; artistic placement and perspective/parallax remain
 * separate increments. The application selects and mounts this experience through its route map.
 */
export class IntroCreation implements CreationExperience {
  private readonly veil: CelestialVeil;
  private isDisposed = false;

  private constructor(veil: CelestialVeil) {
    this.veil = veil;
  }

  /** Loads and compiles a ready scene; cancellation/failure releases newly constructed resources. */
  static async prepare({
    renderer,
    signal,
    viewport,
  }: CreationExperiencePreparationOptions): Promise<IntroCreation> {
    const data = await loadCelestialVeilData(signal);
    signal.throwIfAborted();
    const veil = createCelestialVeil(data);

    try {
      veil.resize(viewport);
      await renderer.compileAsync(veil.scene, veil.camera);
      signal.throwIfAborted();
    } catch (error) {
      veil.dispose();
      throw error;
    }

    return new IntroCreation(veil);
  }

  activate(): void {
    // No input handlers or autonomous work exist in the static tableau.
  }

  update(_frameTime: FrameTime): void {
    // Appearance is precomputed; the tableau has no animated state to advance.
  }

  render(renderer: WebGPURenderer): void {
    if (!this.isDisposed) {
      renderer.render(this.veil.scene, this.veil.camera);
    }
  }

  resize(viewport: RenderingViewport): void {
    this.veil.resize(viewport);
  }

  suspend(): void {
    // The shared coordinator stops render calls; there is no local work to suspend.
  }

  resume(): void {
    // The static scene is preserved; no entrance is replayed.
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.veil.dispose();
  }
}
