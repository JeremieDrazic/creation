import { createSettingsControls } from '@creation/data-gui/create-settings-controls';

import { registerExperienceControls } from '../../development/experience-controls';
import type { CelestialVeil } from './celestial-veil/celestial-veil';
import { createCelestialVeilComposition } from './celestial-veil/celestial-veil-composition';

/** Only the intro's fields and scene binding belong here; the package owns the control behavior. */
export function attachIntroDevelopmentControls(veil: CelestialVeil): () => void {
  return registerExperienceControls(
    createSettingsControls({
      id: 'intro',
      titleKey: 'veil.title',
      defaults: createCelestialVeilComposition(),
      onChange: (values) => veil.setComposition(values),
      fields: [
        { property: 'rotationDegrees', labelKey: 'veil.rotation', min: -90, max: 90, step: 1 },
        { property: 'scale', labelKey: 'veil.scale', min: 0.25, max: 4, step: 0.01 },
        { property: 'offsetXViewportRatio', labelKey: 'veil.offsetX', min: -1, max: 1, step: 0.01 },
        { property: 'offsetYViewportRatio', labelKey: 'veil.offsetY', min: -1, max: 1, step: 0.01 },
        { property: 'grainScale', labelKey: 'veil.grainScale', min: 0.1, max: 2, step: 0.01 },
      ],
    })
  );
}
