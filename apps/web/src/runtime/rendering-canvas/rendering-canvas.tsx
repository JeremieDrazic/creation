import * as stylex from '@stylexjs/stylex';
// oxlint-disable-next-line no-restricted-imports -- Synchronizes the canvas DOM with the external rendering runtime, including cancellation and cleanup.
import { useEffect, useEffectEvent, useRef } from 'react';

import type { PrepareCreationExperience, RenderingRuntimeStatus } from '../../types';
import {
  attachRenderingRuntime,
  type RenderingRuntimeAttachment,
} from './attach-rendering-runtime';

export type RenderingCanvasProps = Readonly<{
  /** Requested graphics; changes select an experience within the existing runtime. Null clears it. */
  prepareExperience: PrepareCreationExperience | null;
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
 * changes only prepareExperience. The parent provides drawable dimensions. Resolution-reader,
 * frame-delta and status-publisher changes still restart the runtime.
 */
export function RenderingCanvas({
  prepareExperience,
  readPixelRatio,
  maxDeltaSeconds,
  publishStatus,
  onError,
}: RenderingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const attachmentRef = useRef<RenderingRuntimeAttachment | null>(null);

  // Startup reads the current choice; subsequent choices have their own reactive Effect below.
  const readInitialExperience = useEffectEvent(() => prepareExperience);

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

    const attachment = attachRenderingRuntime({
      canvas,
      prepareInitialExperience: readInitialExperience(),
      readPixelRatio,
      maxDeltaSeconds,
      publishStatus,
      onError: reportLifecycleError,
    });
    attachmentRef.current = attachment;

    return () => {
      attachmentRef.current = null;
      attachment.dispose();
      canvas.remove();
    };
  }, [readPixelRatio, maxDeltaSeconds, publishStatus]);

  useEffect(() => {
    attachmentRef.current?.selectExperience(prepareExperience);
  }, [prepareExperience]);

  return <div {...stylex.props(styles.container)} ref={containerRef} />;
}
