import { describe, expect, test } from 'vitest';

import { createRequestTracker } from './request-tracker';

describe('request tracking', () => {
  test('keeps a request current until a newer request is registered', () => {
    const tracker = createRequestTracker();
    const firstRequest = tracker.registerRequest();
    expect(firstRequest.isLatestRequest()).toBe(true);
    expect(firstRequest.isLatestRequest()).toBe(true);

    const secondRequest = tracker.registerRequest();
    expect(firstRequest.isLatestRequest()).toBe(false);
    expect(secondRequest.isLatestRequest()).toBe(true);

    const thirdRequest = tracker.registerRequest();
    expect(firstRequest.isLatestRequest()).toBe(false);
    expect(secondRequest.isLatestRequest()).toBe(false);
    expect(thirdRequest.isLatestRequest()).toBe(true);
  });

  test('can check a delayed result against requests registered while its work was pending', async () => {
    const tracker = createRequestTracker();
    const completion = Promise.withResolvers<void>();
    const firstRequest = tracker.registerRequest();
    const delayedResult = completion.promise.then(() => firstRequest.isLatestRequest());
    const newerRequest = tracker.registerRequest();

    completion.resolve();
    await expect(delayedResult).resolves.toBe(false);
    expect(newerRequest.isLatestRequest()).toBe(true);
  });

  test('keeps trackers independent', () => {
    const firstTracker = createRequestTracker();
    const secondTracker = createRequestTracker();
    const firstRequest = firstTracker.registerRequest();

    secondTracker.registerRequest();
    secondTracker.registerRequest();
    expect(firstRequest.isLatestRequest()).toBe(true);

    firstTracker.registerRequest();
    expect(firstRequest.isLatestRequest()).toBe(false);
  });
});
