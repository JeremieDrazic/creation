import { fileURLToPath } from 'node:url';

import stylex from '@stylexjs/unplugin';
import type { PluginOption } from 'vite';

/**
 * Create the shared compiler for source styles and exported workspace tokens.
 *
 * @param mode - Vite mode; development enables compiler diagnostics.
 * @returns A new plugin for each application configuration, with extracted CSS in both modes.
 */
export function createStylexPlugin(mode: string): PluginOption {
  return stylex.vite({
    dev: mode === 'development',
    runtimeInjection: false,
    useCSSLayers: { before: ['reset', 'base'] },
    unstable_moduleResolution: {
      type: 'commonJS',
      rootDir: fileURLToPath(new URL('../../../../', import.meta.url)),
    },
    // The universal adapter currently exposes an untyped Vite return value.
  }) as PluginOption;
}
