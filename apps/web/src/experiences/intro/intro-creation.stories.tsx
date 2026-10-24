import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import { useStore } from 'zustand';

import { RenderingCanvas } from '../../runtime/rendering-canvas/rendering-canvas';
import { createStatusStore } from '../../stores/status-store/status-store';
import type { PrepareCreationExperience, RenderingRuntimeStatus } from '../../types';
import { createCelestialVeil } from './celestial-veil/celestial-veil';
import type { CelestialVeilGrainData } from './celestial-veil/data/celestial-veil-data';
import { loadCelestialVeilData } from './celestial-veil/data/load-celestial-veil-data';
import { IntroCreation } from './intro-creation';

const PREVIEW_MAX_DELTA_SECONDS = 0.05;
const prepareIntro: PrepareCreationExperience = (options) => IntroCreation.prepare(options);
const styles = stylex.create({
  preview: { display: 'grid', gap: '1rem' },
  viewport: { width: '100%', maxWidth: '96rem', aspectRatio: '3 / 1', backgroundColor: '#03090e' },
});

/** Temporary comparison: scales authored edge softness, retaining differences between grains. */
function createContourPreviewPreparation(softnessScale: number): PrepareCreationExperience {
  return async ({ renderer, signal }) => {
    const data = await loadCelestialVeilData(signal);
    signal.throwIfAborted();
    const grains = data.grains.map((grain): CelestialVeilGrainData => {
      const [x, y, z, diameter, red, green, blue, opacity, softness] = grain;
      return [x, y, z, diameter, red, green, blue, opacity, softness * softnessScale];
    });
    const veil = createCelestialVeil({ ...data, grains });
    try {
      await renderer.compileAsync(veil.scene, veil.camera);
      signal.throwIfAborted();
    } catch (error) {
      veil.dispose();
      throw error;
    }

    let isDisposed = false;
    return {
      activate() {},
      update() {},
      resize(viewport) {
        veil.resize(viewport);
      },
      suspend() {},
      resume() {},
      render(borrowedRenderer) {
        if (!isDisposed) {
          borrowedRenderer.render(veil.scene, veil.camera);
        }
      },
      dispose() {
        isDisposed = true;
        veil.dispose();
      },
    };
  };
}

function readPreviewPixelRatio(): number {
  return window.devicePixelRatio;
}

/** Temporary fixed-frame review fixture, not the final application layout or loading UI. */
function CelestialVeilPreview({
  onError,
  softnessScale,
}: Readonly<{ onError: (error: unknown) => void; softnessScale: number }>) {
  const [store] = useState(() =>
    createStatusStore<RenderingRuntimeStatus>({ status: 'preparing', progress: null })
  );
  const status = useStore(store.statusStore);
  const preparePreview = useMemo(
    () => (softnessScale === 1 ? prepareIntro : createContourPreviewPreparation(softnessScale)),
    [softnessScale]
  );

  return (
    <section {...stylex.props(styles.preview)}>
      <p>
        Temporary edge comparison: {Math.round(softnessScale * 100)}% of authored softness. Same
        framing, positions, diameters and display density. No bloom, motion or audio.
      </p>
      <output aria-label="Rendering status">{status.status}</output>
      <div {...stylex.props(styles.viewport)}>
        <RenderingCanvas
          prepareExperience={preparePreview}
          readPixelRatio={readPreviewPixelRatio}
          maxDeltaSeconds={PREVIEW_MAX_DELTA_SECONDS}
          publishStatus={store.publishStatus}
          onError={onError}
        />
      </div>
    </section>
  );
}

const meta = {
  title: 'Experiences/Intro/CelestialVeil',
  component: CelestialVeilPreview,
  args: { onError: fn(), softnessScale: 0.8 },
  argTypes: {
    softnessScale: {
      name: 'Douceur des contours',
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Temporary comparison: 0 = sharp, 0.5 = intermediate, 1 = authored softness.',
    },
  },
} satisfies Meta<typeof CelestialVeilPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, canvasElement, args }) => {
    await waitFor(
      () =>
        expect(canvas.getByRole('status', { name: 'Rendering status' })).toHaveTextContent('ready'),
      { timeout: 15000 }
    );
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    const renderingCanvas = canvasElement.querySelector('canvas');
    const previewWindow = canvasElement.ownerDocument.defaultView;
    if (!renderingCanvas || !previewWindow) {
      throw new Error('The veil preview requires a canvas attached to a browser window.');
    }
    await waitFor(async () => {
      const pixelRatio = previewWindow.devicePixelRatio;
      await expect(renderingCanvas.width).toBe(
        Math.floor(renderingCanvas.clientWidth * pixelRatio)
      );
      await expect(renderingCanvas.height).toBe(
        Math.floor(renderingCanvas.clientHeight * pixelRatio)
      );
    });
    await expect(args.onError).not.toHaveBeenCalled();
  },
};
