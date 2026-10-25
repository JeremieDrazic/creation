import { createStore } from 'zustand/vanilla';

import type { SettingsControls } from '@creation/data-gui/create-settings-controls';

export type ExperienceControls = SettingsControls;

/** Development-only bridge: the active experience publishes controls without owning panel UI. */
export const experienceControlsStore = createStore<{ source: ExperienceControls | null }>(() => ({
  source: null,
}));

/** A stale release cannot remove a newer experience's controls. */
export function registerExperienceControls(source: ExperienceControls): () => void {
  experienceControlsStore.setState({ source });
  return () => {
    if (experienceControlsStore.getState().source === source) {
      experienceControlsStore.setState({ source: null });
    }
  };
}
