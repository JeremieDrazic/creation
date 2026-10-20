import * as stylex from '@stylexjs/stylex';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the canvas DOM with the external rendering runtime, including cancellation and cleanup.
import { useEffect, useEffectEvent, useRef } from 'react';

import type { PrepareCreationExperience, RenderingRuntimeStatus } from '../../types';
import { attachRenderingRuntime } from './attach-rendering-runtime';

export type RenderingCanvasProps = Readonly<{
  /** Stable preparation function; changing it recreates the runtime, not a navigation operation. */
  prepareInitialExperience: PrepareCreationExperience;
  /** Stable resolution reader forwarded to the session. */
  readPixelRatio: () => number;
  /** Maximum accepted frame delta, in seconds; changing it recreates the runtime. */
  maxDeltaSeconds: number;
  /** Stable store publisher; changing the destination recreates the runtime. Must not throw. */
  publishStatus: (status: RenderingRuntimeStatus) => void;
  /** Receives startup, rendering and cleanup failures; must not throw. */
  onError: (error: unknown) => void;
}>;

const styles = stylex.create({
  container: {
    width: '100%',
    height: '100%',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
});

/**
 * Owns one canvas/runtime per Effect setup. Keep above route-specific UI; experience navigation
 * must not replace this component or its startup inputs. The parent provides drawable dimensions.
 */
export function RenderingCanvas({
  prepareInitialExperience,
  readPixelRatio,
  maxDeltaSeconds,
  publishStatus,
  onError,
}: RenderingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Report to the latest handler without rebuilding the renderer when that handler changes.
  const reportLifecycleError = useEffectEvent((error: unknown) => {
    onError(error);
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    // StrictMode rehearsals receive distinct canvases, avoiding overlapping renderer ownership.
    const canvas = container.ownerDocument.createElement('canvas');
    canvas.className = stylex.props(styles.canvas).className ?? '';
    container.append(canvas);

    const detachRuntime = attachRenderingRuntime({
      canvas,
      prepareInitialExperience,
      readPixelRatio,
      maxDeltaSeconds,
      publishStatus,
      onError: reportLifecycleError,
    });

    return () => {
      detachRuntime();
      canvas.remove();
    };
  }, [prepareInitialExperience, readPixelRatio, maxDeltaSeconds, publishStatus]);

  return <div {...stylex.props(styles.container)} ref={containerRef} />;
}
