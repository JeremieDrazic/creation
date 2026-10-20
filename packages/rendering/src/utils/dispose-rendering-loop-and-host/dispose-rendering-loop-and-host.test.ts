import { describe, expect, it, vi } from 'vitest';

import type { RenderingHost, RenderingLoop } from '../../types';
import { disposeRenderingLoopAndHost } from './dispose-rendering-loop-and-host';

describe('disposeRenderingLoopAndHost', () => {
  it('waits for callback removal before disposing the renderer', async () => {
    let completeLoopDisposal: () => void = () => {};
    const loopDisposal = new Promise<void>((resolve) => {
      completeLoopDisposal = resolve;
    });
    const loop = { dispose: vi.fn(() => loopDisposal) };
    const host = { dispose: vi.fn(async () => {}) };

    const disposal = disposeRenderingLoopAndHost(
      loop as unknown as RenderingLoop,
      host as unknown as RenderingHost,
      'TEST_DISPOSAL_FAILED'
    );
    expect(loop.dispose).toHaveBeenCalledOnce();
    expect(host.dispose).not.toHaveBeenCalled();

    completeLoopDisposal();
    await disposal;
    expect(host.dispose).toHaveBeenCalledOnce();
  });

  it('still releases the renderer and retains both causes if both cleanup steps fail', async () => {
    const loopCause = new Error('Loop cleanup failed.');
    const hostCause = new Error('Host cleanup failed.');
    const loop = {
      dispose: vi.fn(async () => {
        throw loopCause;
      }),
    };
    const host = {
      dispose: vi.fn(async () => {
        throw hostCause;
      }),
    };

    await expect(
      disposeRenderingLoopAndHost(
        loop as unknown as RenderingLoop,
        host as unknown as RenderingHost,
        'TEST_DISPOSAL_FAILED'
      )
    ).rejects.toMatchObject({
      code: 'TEST_DISPOSAL_FAILED',
      cause: { errors: [loopCause, hostCause] },
    });
    expect(host.dispose).toHaveBeenCalledOnce();
  });

  it('disposes an acquired host even when no loop was created', async () => {
    const host = { dispose: vi.fn(async () => {}) };

    await disposeRenderingLoopAndHost(
      undefined,
      host as unknown as RenderingHost,
      'TEST_DISPOSAL_FAILED'
    );
    expect(host.dispose).toHaveBeenCalledOnce();
  });
});
