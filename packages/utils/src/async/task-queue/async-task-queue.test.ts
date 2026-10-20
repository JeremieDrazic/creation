import { describe, expect, test, vi } from 'vitest';

import { createAsyncTaskQueue } from './async-task-queue';

describe('task order and results', () => {
  test('waits for a running task before starting the next and preserves their results', async () => {
    const queue = createAsyncTaskQueue();
    const firstTaskCompletion = Promise.withResolvers<string>();
    const order: string[] = [];
    const firstResult = queue.enqueueTask(() => {
      order.push('first');
      return firstTaskCompletion.promise;
    });
    const secondResult = queue.enqueueTask(() => {
      order.push('second');
      return 42;
    });
    const thirdResult = queue.enqueueTask(async () => {
      order.push('third');
      return 'done';
    });

    expect(order).toEqual([]);
    await Promise.resolve();
    expect(order).toEqual(['first']);
    firstTaskCompletion.resolve('ready');

    await expect(firstResult).resolves.toBe('ready');
    await expect(secondResult).resolves.toBe(42);
    await expect(thirdResult).resolves.toBe('done');
    expect(order).toEqual(['first', 'second', 'third']);
  });

  test('keeps queues independent when one task is still pending', async () => {
    const blockedQueue = createAsyncTaskQueue();
    const availableQueue = createAsyncTaskQueue();
    const blockedTaskCompletion = Promise.withResolvers<void>();
    const blockedTask = blockedQueue.enqueueTask(() => blockedTaskCompletion.promise);

    await expect(availableQueue.enqueueTask(() => 'available')).resolves.toBe('available');
    blockedTaskCompletion.resolve();
    await blockedTask;
  });
});

describe('task failures', () => {
  test('preserves a synchronous failure and still executes the following task', async () => {
    const queue = createAsyncTaskQueue();
    const cause = new Error('Task failed.');
    const failedTask = queue.enqueueTask(() => {
      throw cause;
    });
    const nextTask = queue.enqueueTask(() => 'next');

    await expect(failedTask).rejects.toBe(cause);
    await expect(nextTask).resolves.toBe('next');
  });

  test('preserves an asynchronous failure and still executes the following task', async () => {
    const queue = createAsyncTaskQueue();
    const taskCompletion = Promise.withResolvers<void>();
    const cause = new Error('Async task failed.');
    const failedTask = queue.enqueueTask(() => taskCompletion.promise);
    const rejection = expect(failedTask).rejects.toBe(cause);
    const nextTaskCallback = vi.fn(() => 'next');
    const nextTask = queue.enqueueTask(nextTaskCallback);

    await Promise.resolve();
    expect(nextTaskCallback).not.toHaveBeenCalled();
    taskCompletion.reject(cause);

    await rejection;
    await expect(nextTask).resolves.toBe('next');
    expect(nextTaskCallback).toHaveBeenCalledOnce();
  });

  test('can accept further work after several consecutive failures', async () => {
    const queue = createAsyncTaskQueue();
    const firstCause = new Error('First failure.');
    const secondCause = new Error('Second failure.');
    const firstTask = queue.enqueueTask(() => {
      throw firstCause;
    });
    const secondTask = queue.enqueueTask(() => {
      throw secondCause;
    });

    await Promise.all([
      expect(firstTask).rejects.toBe(firstCause),
      expect(secondTask).rejects.toBe(secondCause),
    ]);
    await expect(queue.enqueueTask(() => 'recovered')).resolves.toBe('recovered');
  });
});
