import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import type { SettingsControls } from '../create-settings-controls/create-settings-controls';
import { createPresetManager } from './create-preset-manager';
import type { PresetStorage } from './preset-data';
import { PresetForm } from './preset-form';

type PresetControlsOptions = Readonly<{
  container: HTMLElement;
  source: SettingsControls;
  storage: PresetStorage;
  translate: (key: string) => string;
  setStatus: (key: string) => void;
  onError: (error: unknown) => void;
}>;

type ViewState = { isDisposed: boolean; busy: boolean; ready: boolean };

async function runPresetOperation(
  state: ViewState,
  operation: () => Promise<void>,
  successKey: string,
  callbacks: Pick<PresetControlsOptions, 'setStatus' | 'onError'> & { refresh: () => void }
): Promise<void> {
  if (state.busy && state.ready) {
    return;
  }
  state.busy = true;
  callbacks.refresh();
  try {
    await operation();
    if (!state.isDisposed) {
      callbacks.setStatus(successKey);
    }
  } catch (error) {
    callbacks.onError(error);
    if (!state.isDisposed) {
      callbacks.setStatus('presets.failed');
    }
  } finally {
    state.busy = false;
    callbacks.refresh();
  }
}

/** Connects the React presentation to the framework-independent preset manager and DOM workbench. */
export function createPresetControls(options: PresetControlsOptions) {
  const { container, source, storage, translate, setStatus, onError } = options;
  const document = container.ownerDocument;
  const manager = createPresetManager(source, storage);
  const host = document.createElement('div');
  container.append(host);
  const root = createRoot(host);
  const state: ViewState = { isDisposed: false, busy: true, ready: false };
  let nameDraft = '';

  function exportPresets(): void {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(manager.getCollection(), null, 2)], { type: 'application/json' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${source.id}-presets.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function refreshLabels(): void {
    if (state.isDisposed) {
      return;
    }
    const run = (operation: () => Promise<void>, key: string) =>
      runPresetOperation(state, operation, key, { setStatus, onError, refresh: refreshLabels });
    root.render(
      createElement(PresetForm, {
        presets: manager.getCollection().presets,
        selectedId: manager.getSelectedId(),
        name: nameDraft,
        modified: manager.isModified(),
        disabled: state.busy || !state.ready,
        portalContainer: document.body,
        translate,
        onSelect(id) {
          nameDraft =
            manager.getCollection().presets.find((preset) => preset.id === id)?.name ?? '';
          manager.select(id);
          setStatus('presets.applied');
        },
        onNameChange(value) {
          nameDraft = value;
          refreshLabels();
        },
        onSave() {
          void run(() => manager.save(nameDraft), 'presets.saved');
        },
        onRename() {
          void run(() => manager.rename(nameDraft), 'presets.renamed');
        },
        onRemove() {
          nameDraft = '';
          void run(() => manager.remove(), 'presets.removed');
        },
        onExport: exportPresets,
        onImport(file) {
          void run(async () => {
            const value: unknown = JSON.parse(await file.text());
            await manager.importCollection(value);
          }, 'presets.imported');
        },
      })
    );
  }

  const unsubscribe = manager.subscribe(refreshLabels);
  refreshLabels();
  void runPresetOperation(
    state,
    async () => {
      await manager.load();
      state.ready = true;
    },
    '',
    { setStatus, onError, refresh: refreshLabels }
  );
  return {
    refreshLabels,
    resetSelection() {
      nameDraft = '';
      manager.select('');
    },
    dispose() {
      state.isDisposed = true;
      unsubscribe();
      manager.dispose();
      // The host may dispose us during its own React commit; release our owned root afterward.
      queueMicrotask(() => root.unmount());
      host.remove();
    },
  };
}
