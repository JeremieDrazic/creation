import { createStore } from 'zustand/vanilla';
import { shallow } from 'zustand/vanilla/shallow';

/**
 * Creates an isolated observable status with a caller-owned shape and initial value. Snapshots are
 * flat records: copying, freezing and equality checks are shallow. Nested values retain their
 * identity and must be treated as immutable. Consumers receive only read/subscription methods.
 */
export function createStatusStore<Status extends object>(initialStatus: Status) {
  const store = createStore<Readonly<Status>>(() => Object.freeze({ ...initialStatus }));

  /** Publishes a snapshot only when its field values change; does not control domain operations. */
  function publishStatus(status: Status): void {
    if (shallow(store.getState(), status)) {
      return;
    }

    // Replace the snapshot to remove fields that belonged only to the previous status.
    store.setState(Object.freeze({ ...status }), true);
  }

  return {
    publishStatus,
    statusStore: {
      getState: store.getState,
      getInitialState: store.getInitialState,
      subscribe: store.subscribe,
    },
  };
}
