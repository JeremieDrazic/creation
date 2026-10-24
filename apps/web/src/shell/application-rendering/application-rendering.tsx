import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { useStore } from 'zustand';

import { RenderingCanvas } from '../../runtime/rendering-canvas/rendering-canvas';
import { createStatusStore } from '../../stores/status-store/status-store';
import type { PrepareCreationExperience, RenderingRuntimeStatus } from '../../types';

const MAX_FRAME_DELTA_SECONDS = 0.05;

const styles = stylex.create({
  surface: {
    width: '100%',
    height: '100%',
  },
});

function readApplicationPixelRatio(): number {
  return window.devicePixelRatio;
}

function reportRenderingError(error: unknown): void {
  console.error('APPLICATION_RENDERING_FAILED', error);
}

type ApplicationRenderingProps = Readonly<{
  /** Graphics selected by the application; null keeps the renderer without an active experience. */
  prepareExperience: PrepareCreationExperience | null;
}>;

/**
 * Connects application-selected graphics to the persistent canvas and lifecycle status. The parent
 * owns route selection and viewport-sized layout. Loading UI and experience framing are separate
 * responsibilities; this component does not import concrete experiences.
 */
export function ApplicationRendering({ prepareExperience }: ApplicationRenderingProps) {
  const [runtimeStatusStore] = useState(() =>
    createStatusStore<RenderingRuntimeStatus>({ status: 'preparing', progress: null })
  );
  const status = useStore(runtimeStatusStore.statusStore);

  return (
    <div data-rendering-status={status.status} {...stylex.props(styles.surface)}>
      <RenderingCanvas
        prepareExperience={prepareExperience}
        readPixelRatio={readApplicationPixelRatio}
        maxDeltaSeconds={MAX_FRAME_DELTA_SECONDS}
        publishStatus={runtimeStatusStore.publishStatus}
        onError={reportRenderingError}
      />
    </div>
  );
}
