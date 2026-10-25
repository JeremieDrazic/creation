// oxlint-disable-next-line no-restricted-imports -- Synchronizes the DOM-owned development panel with React mounting and cleanup.
import { useEffect } from 'react';

import { mountDevelopmentPanel } from './mount-development-panel';

/** Loaded only in development; the DOM panel persists across route and language changes. */
export default function DevelopmentPanel() {
  useEffect(mountDevelopmentPanel, []);
  return null;
}
