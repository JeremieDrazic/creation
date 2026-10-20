import type { Meta, StoryObj } from '@storybook/react';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import { useStore } from 'zustand';

import { CodedError } from '@creation/utils/errors/coded-errors';

import { RenderingProbeCreation } from '../../rendering-probe/rendering-probe-creation';
import type { PrepareCreationExperience } from '../../types';
import { createRenderingRuntimeStore } from '../rendering-runtime-store/rendering-runtime-store';
import { RenderingCanvas, type RenderingCanvasProps } from './rendering-canvas';

const STORY_PREPARATION_ERROR = new CodedError('STORY_RENDERING_PREPARATION_FAILED');
const STORY_MAX_FRAME_DELTA_SECONDS = 0.05;

const styles = stylex.create({
  fixture: { display: 'grid', gap: '1rem' },
  controls: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
  viewport: { width: '640px', maxWidth: '100%', height: '360px', backgroundColor: '#000000' },
  narrowViewport: { width: '320px' },
});

function readStoryPixelRatio(): number {
  return 1;
}

const prepareStaticTriangle: PrepareCreationExperience = (options) =>
  RenderingProbeCreation.prepare(options);

const rejectPreparation: PrepareCreationExperience = async () => {
  throw STORY_PREPARATION_ERROR;
};

type RenderingCanvasStoryProps = Pick<RenderingCanvasProps, 'prepareInitialExperience' | 'onError'>;

/** Temporary technical fixture using the real runtime; not intro artwork or production controls. */
function RenderingCanvasStory({ prepareInitialExperience, onError }: RenderingCanvasStoryProps) {
  const [store] = useState(createRenderingRuntimeStore);
  const status = useStore(store.statusStore);
  const [isMounted, setIsMounted] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  return (
    <section {...stylex.props(styles.fixture)}>
      <p>
        Temporary static triangle. Tests the React canvas lifecycle with the real rendering runtime.
      </p>
      <div {...stylex.props(styles.controls)}>
        <button type="button" onClick={() => setIsMounted((mounted) => !mounted)}>
          {isMounted ? 'Unmount canvas' : 'Mount canvas'}
        </button>
        <button type="button" onClick={() => setIsNarrow((narrow) => !narrow)}>
          Resize canvas
        </button>
        <button type="button" onClick={() => setRenderCount((count) => count + 1)}>
          Rerender interface ({renderCount})
        </button>
      </div>
      <output aria-label="Rendering status">{status.status}</output>
      <div {...stylex.props(styles.viewport, isNarrow && styles.narrowViewport)}>
        {isMounted && (
          <RenderingCanvas
            prepareInitialExperience={prepareInitialExperience}
            readPixelRatio={readStoryPixelRatio}
            maxDeltaSeconds={STORY_MAX_FRAME_DELTA_SECONDS}
            publishStatus={store.publishStatus}
            onError={(error) => onError(error)}
          />
        )}
      </div>
    </section>
  );
}

const meta = {
  title: 'Runtime/RenderingCanvas',
  component: RenderingCanvasStory,
  args: { prepareInitialExperience: prepareStaticTriangle, onError: fn() },
} satisfies Meta<typeof RenderingCanvasStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StaticTriangle: Story = {
  play: async ({ canvas, canvasElement, args }) => {
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Rendering status' })).toHaveTextContent('ready')
    );
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    await expect(canvasElement.querySelector('canvas')?.width).toBe(640);
    await expect(canvas.getByRole('button', { name: 'Rerender interface (0)' })).toBeVisible();
    await expect(args.onError).not.toHaveBeenCalled();
  },
};

/** Runs in the component test suite without changing the browsable static preview. */
export const LifecycleChecks: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, canvasElement, userEvent, args }) => {
    const status = canvas.getByRole('status', { name: 'Rendering status' });
    await waitFor(() => expect(status).toHaveTextContent('ready'));
    await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
    const drawingCanvas = canvasElement.querySelector('canvas');
    await expect(drawingCanvas).not.toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Rerender interface (0)' }));
    await expect(canvasElement.querySelector('canvas')).toBe(drawingCanvas);
    await userEvent.click(canvas.getByRole('button', { name: 'Resize canvas' }));
    await waitFor(() => expect(drawingCanvas?.width).toBe(320));
    await expect(canvasElement.querySelector('canvas')).toBe(drawingCanvas);

    for (let cycle = 0; cycle < 2; cycle += 1) {
      await userEvent.click(canvas.getByRole('button', { name: 'Unmount canvas' }));
      await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(0);
      await userEvent.click(canvas.getByRole('button', { name: 'Mount canvas' }));
      await waitFor(() => expect(status).toHaveTextContent('ready'));
      await expect(canvasElement.querySelectorAll('canvas')).toHaveLength(1);
      await expect(canvasElement.querySelector('canvas')).not.toBe(drawingCanvas);
    }

    await expect(args.onError).not.toHaveBeenCalled();
  },
};

export const PreparationFailure: Story = {
  args: { prepareInitialExperience: rejectPreparation },
  play: async ({ canvas, args }) => {
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Rendering status' })).toHaveTextContent('failed')
    );
    await waitFor(() => expect(args.onError).toHaveBeenCalledWith(STORY_PREPARATION_ERROR));
  },
};
