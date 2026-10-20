import { expect, test, vi } from 'vitest';

import { createRenderingRuntimeStore } from './rendering-runtime-store';

test('keeps runtime stores isolated and exposes only reads to consumers', () => {
  const first = createRenderingRuntimeStore();
  const second = createRenderingRuntimeStore();

  first.publishStatus({ status: 'ready' });

  expect(second.statusStore.getState()).toEqual({ status: 'preparing', progress: null });
  expect(first.statusStore).not.toHaveProperty('setState');
  expect(first.statusStore.getInitialState()).toEqual({ status: 'preparing', progress: null });
});

test('notifies only for changed values and supports unsubscribe', () => {
  const { publishStatus, statusStore } = createRenderingRuntimeStore();
  const listener = vi.fn();
  const unsubscribe = statusStore.subscribe(listener);
  const initialSnapshot = statusStore.getState();

  publishStatus({ status: 'preparing', progress: null });
  expect(statusStore.getState()).toBe(initialSnapshot);
  expect(listener).not.toHaveBeenCalled();

  publishStatus({ status: 'preparing', progress: 0.4 });
  const progressSnapshot = statusStore.getState();
  publishStatus({ status: 'preparing', progress: 0.4 });
  expect(statusStore.getState()).toBe(progressSnapshot);
  expect(listener).toHaveBeenCalledOnce();

  unsubscribe();
  publishStatus({ status: 'ready' });
  expect(listener).toHaveBeenCalledOnce();
});

test('replaces status fields and preserves the original failure', () => {
  const { publishStatus, statusStore } = createRenderingRuntimeStore();
  const error = new Error('Rendering failed.');
  const listener = vi.fn();
  statusStore.subscribe(listener);

  publishStatus({ status: 'failed', error });
  expect(statusStore.getState()).toEqual({ status: 'failed', error });
  publishStatus({ status: 'failed', error });
  expect(listener).toHaveBeenCalledOnce();

  publishStatus({ status: 'ready' });
  expect(statusStore.getState()).toEqual({ status: 'ready' });
});

test('protects published snapshots from caller mutations', () => {
  const { publishStatus, statusStore } = createRenderingRuntimeStore();
  const status = { status: 'preparing', progress: 0.4 } as const;

  publishStatus(status);
  Object.assign(status, { progress: 0.8 });

  expect(statusStore.getState()).toEqual({ status: 'preparing', progress: 0.4 });
  expect(Object.isFrozen(statusStore.getState())).toBe(true);
  expect(Object.isFrozen(statusStore.getInitialState())).toBe(true);
});
