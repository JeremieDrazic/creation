import stylex from '@stylexjs/unplugin';
import { fileURLToPath } from 'node:url';
import type { PluginOption } from 'vite';

/** Both applications compile workspace styles from source with the same rules. */
export function createStylexPlugin(mode: string): PluginOption {
  return stylex.vite({
    dev: mode === 'development',
    runtimeInjection: false,
    useCSSLayers: { before: ['reset', 'base'] },
    unstable_moduleResolution: {
      type: 'commonJS',
      rootDir: fileURLToPath(new URL('../../../', import.meta.url)),
    },
    // The universal adapter currently exposes an untyped Vite return value.
  }) as PluginOption;
}
