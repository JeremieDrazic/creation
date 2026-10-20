// oxlint-disable-next-line no-restricted-imports -- Synchronizes the temporary canvas with its external renderer lifecycle.
import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { mountRenderingProbe, type MountedRenderingProbe } from './mount-rendering-probe';

const CANVAS_STYLE = {
  display: 'block',
  width: '100%',
  height: '70vh',
  backgroundColor: '#000000',
} as const;

/** Temporary manual test harness; its wording and controls are not product UI. */
function ProbeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Initializing');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    // Each effect owns a distinct canvas, including StrictMode's setup/cleanup rehearsal.
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, CANVAS_STYLE);
    canvas.setAttribute('aria-label', 'White triangle rendering test');
    container.append(canvas);
    const controller = new AbortController();
    let mounted: MountedRenderingProbe | undefined;

    async function start(targetCanvas: HTMLCanvasElement): Promise<void> {
      try {
        const nextMounted = await mountRenderingProbe(targetCanvas, controller.signal);
        if (controller.signal.aborted) {
          await nextMounted.dispose();
          return;
        }
        mounted = nextMounted;
        setStatus('Ready');
      } catch (cause) {
        if (!controller.signal.aborted) {
          console.error('Rendering POC failed', cause);
          setStatus('Failed — inspect the browser console');
        }
      }
    }

    void start(canvas);
    return () => {
      controller.abort();
      canvas.remove();
      if (mounted) {
        void mounted.dispose().catch((cause: unknown) => {
          console.error('Rendering POC cleanup failed', cause);
        });
      }
    };
  }, []);

  return (
    <>
      <output>{status}</output>
      <div ref={containerRef} />
    </>
  );
}

function ProbePage() {
  const [isMounted, setIsMounted] = useState(true);
  return (
    <main>
      <h1>Rendering POC</h1>
      <p>Temporary technical test. Resize the window, then unmount and remount the canvas.</p>
      <button type="button" onClick={() => setIsMounted((previous) => !previous)}>
        {isMounted ? 'Unmount canvas' : 'Mount canvas'}
      </button>
      {isMounted && <ProbeCanvas />}
    </main>
  );
}

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing rendering POC root.');
}
if (!import.meta.env.DEV) {
  throw new Error('The rendering POC is available in development only.');
}
createRoot(root).render(
  <StrictMode>
    <ProbePage />
  </StrictMode>
);
