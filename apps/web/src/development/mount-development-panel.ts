import { createWorkbench } from '@creation/data-gui/create-workbench';
import { createFilePresetStorage } from '@creation/data-gui/presets';

import { i18n } from '../utils/localization/i18n';
import { experienceControlsStore } from './experience-controls';
import english from './locales/en.json';
import french from './locales/fr.json';

/** Application bridge only: the package owns controls, actions, presets and their UI. */
export function mountDevelopmentPanel(): () => void {
  i18n.addResourceBundle('fr', 'development', french, true, true);
  i18n.addResourceBundle('en', 'development', english, true, true);
  const workbench = createWorkbench({
    container: document.body,
    translate: (key) => i18n.t(key, { ns: 'development' }),
    storage: createFilePresetStorage(),
    displayFont: '"Creation Cormorant Study", Georgia, serif',
    onError: (error) => console.error('DEVELOPMENT_CONTROLS_FAILED', error),
  });
  const selectSource = () => workbench.setSource(experienceControlsStore.getState().source);
  selectSource();
  const unsubscribe = experienceControlsStore.subscribe(selectSource);
  i18n.on('languageChanged', workbench.refreshLabels);
  return () => {
    unsubscribe();
    i18n.off('languageChanged', workbench.refreshLabels);
    workbench.dispose();
  };
}
