/** Executes tasks one at a time in the order they are submitted. */
export type AsyncTaskQueue = Readonly<{
  /**
   * Adds a task without running it immediately. It starts after previously submitted tasks settle.
   * The returned promise preserves this task's result or failure; failure does not block later
   * tasks. Tasks may return synchronously or asynchronously. Await all work that must finish before
   * the next task starts. Do not await a task submitted to this same queue from inside a running
   * task: that would wait for work which cannot start until the current task finishes.
   */
  enqueueTask: <Result>(task: () => Result | PromiseLike<Result>) => Promise<Result>;
}>;

/**
 * Creates an independent task queue without browser dependencies, cancellation or error wrapping.
 * The queue owns execution order only; callers own task resources and observe returned promises.
 */
export function createAsyncTaskQueue(): AsyncTaskQueue {
  let previousTaskCompletion = Promise.resolve();

  function enqueueTask<Result>(task: () => Result | PromiseLike<Result>): Promise<Result> {
    // Run the new task only after the previous task has finished.
    const taskResult = previousTaskCompletion.then(task);

    // Both success and failure release the next task. The original result remains in taskResult.
    previousTaskCompletion = taskResult.then(
      () => undefined,
      () => undefined
    );

    return taskResult;
  }

  return { enqueueTask };
}
