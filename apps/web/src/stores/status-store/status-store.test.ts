import { expect, test, vi } from 'vitest';

import { createStatusStore } from './status-store';

type TestStatus =
  | { status: 'preparing'; progress: number | null }
  | { status: 'ready' }
  | { status: 'failed'; error: unknown };

function createTestStatusStore() {
  return createStatusStore<TestStatus>({ status: 'preparing', progress: null });
}

test('keeps stores isolated and exposes only reads to consumers', () => {
  const first = createTestStatusStore();
  const second = createTestStatusStore();

  first.publishStatus({ status: 'ready' });

  expect(second.statusStore.getState()).toEqual({ status: 'preparing', progress: null });
  expect(first.statusStore).not.toHaveProperty('setState');
  expect(first.statusStore.getInitialState()).toEqual({ status: 'preparing', progress: null });
});

test('notifies only for changed values and supports unsubscribe', () => {
  const { publishStatus, statusStore } = createTestStatusStore();
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
  const { publishStatus, statusStore } = createTestStatusStore();
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
  const { publishStatus, statusStore } = createTestStatusStore();
  const status = { status: 'preparing', progress: 0.4 } as const;

  publishStatus(status);
  Object.assign(status, { progress: 0.8 });

  expect(statusStore.getState()).toEqual({ status: 'preparing', progress: 0.4 });
  expect(Object.isFrozen(statusStore.getState())).toBe(true);
  expect(Object.isFrozen(statusStore.getInitialState())).toBe(true);
});

test('accepts a caller-owned status shape without rendering-specific fields', () => {
  const { publishStatus, statusStore } = createStatusStore({ connected: false, attempts: 0 });
  publishStatus({ connected: true, attempts: 1 });
  expect(statusStore.getState()).toEqual({ connected: true, attempts: 1 });
});

test('copies the initial status without freezing or retaining the caller object', () => {
  const initialStatus = { connected: false };
  const { statusStore } = createStatusStore(initialStatus);
  initialStatus.connected = true;
  expect(Object.isFrozen(initialStatus)).toBe(false);
  expect(statusStore.getInitialState()).toEqual({ connected: false });
  expect(statusStore.getState()).toBe(statusStore.getInitialState());
});
