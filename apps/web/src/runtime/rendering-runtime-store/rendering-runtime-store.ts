import { createStore } from 'zustand/vanilla';
import { shallow } from 'zustand/vanilla/shallow';

import type { RenderingRuntimeStatus } from '../../types';

/**
 * Creates an isolated status store for one rendering runtime. Give publishStatus to the runtime and
 * statusStore to UI consumers; statusStore exposes no write operation.
 */
export function createRenderingRuntimeStore() {
  const store = createStore<RenderingRuntimeStatus>(() =>
    Object.freeze({ status: 'preparing', progress: null })
  );

  /** Publishes a snapshot only when its values change; does not control runtime operations. */
  function publishStatus(status: RenderingRuntimeStatus): void {
    if (shallow(store.getState(), status)) {
      return;
    }

    // Copy to prevent later caller mutations; replace to remove fields from the previous status.
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
