/** A registered request whose current status can be checked when its work finishes. */
export type TrackedRequest = Readonly<{
  /** True until another request is registered with the same tracker; completion does not affect it. */
  isLatestRequest: () => boolean;
}>;

/** Tracks which request was registered most recently, without executing or cancelling work. */
export type RequestTracker = Readonly<{
  /** Registers a new request immediately, making every previously registered request obsolete. */
  registerRequest: () => TrackedRequest;
}>;

/**
 * Creates an independent tracker. Register each request when it is received, before awaiting or
 * queuing its work. Later, check isLatestRequest before applying results that could override newer
 * intent. The tracker owns request order only; callers own scheduling, errors and cancellation.
 */
export function createRequestTracker(): RequestTracker {
  let registeredRequestCount = 0;

  function registerRequest(): TrackedRequest {
    registeredRequestCount += 1;
    // This number belongs to this request and stays unchanged when later requests arrive.
    const requestNumber = registeredRequestCount;

    function isLatestRequest(): boolean {
      return requestNumber === registeredRequestCount;
    }

    return { isLatestRequest };
  }

  return { registerRequest };
}
