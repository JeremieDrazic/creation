import { createDataGui, type DataGui } from '../create-data-gui/create-data-gui';
import { createFloatingPanel } from '../create-floating-panel/create-floating-panel';
import type { SettingsControls } from '../create-settings-controls/create-settings-controls';
import { createPresetControls } from '../presets/create-preset-controls';
import type { PresetStorage } from '../presets/preset-data';

export type WorkbenchOptions = Readonly<{
  container: HTMLElement;
  translate: (key: string) => string;
  storage: PresetStorage;
  displayFont?: string;
  onError: (error: unknown) => void;
}>;

export type Workbench = Readonly<{
  setSource: (source: SettingsControls | null) => void;
  refreshLabels: () => void;
  dispose: () => void;
}>;

/** Reusable control workbench. Application code only supplies a source, translation and storage. */
export function createWorkbench(options: WorkbenchOptions): Workbench {
  const { translate, onError } = options;
  const document = options.container.ownerDocument;
  const panel = createFloatingPanel({
    container: options.container,
    title: translate('title'),
    displayFont: options.displayFont,
  });
  const reset = document.createElement('button');
  reset.type = 'button';
  const copy = document.createElement('button');
  copy.type = 'button';
  panel.actions.append(reset, copy);
  let source: SettingsControls | null = null;
  let gui: DataGui | undefined;
  let presets: ReturnType<typeof createPresetControls> | undefined;
  let unsubscribeSource: (() => void) | undefined;
  let fields: HTMLElement | undefined;
  let isDisposed = false;

  const setStatus = (key: string) => panel.setStatus(key ? translate(key) : '');

  function rebuildFields(): void {
    gui?.dispose();
    gui = undefined;
    if (source !== null && fields !== undefined) {
      gui = createDataGui({ title: translate(source.titleKey), container: fields });
      source.addControls(gui, translate);
    }
  }

  function refreshLabels(): void {
    if (isDisposed) {
      return;
    }
    panel.updateLabels(translate('title'), {
      move: translate('move'),
      moveHint: translate('moveHint'),
      collapse: translate('collapse'),
      expand: translate('expand'),
      footer: translate('footer'),
    });
    reset.textContent = translate('reset');
    copy.textContent = translate('copy');
    reset.disabled = source === null;
    copy.disabled = source === null;
    panel.setSubtitle(source === null ? translate('emptyTitle') : translate(source.titleKey));
    panel.setStatus('');
    if (source === null) {
      panel.content.textContent = translate('empty');
    } else {
      rebuildFields();
      presets?.refreshLabels();
    }
  }

  function setSource(nextSource: SettingsControls | null): void {
    if (isDisposed || (nextSource === source && fields !== undefined)) {
      return;
    }
    unsubscribeSource?.();
    presets?.dispose();
    gui?.dispose();
    presets = undefined;
    gui = undefined;
    fields = undefined;
    source = nextSource;
    panel.content.replaceChildren();
    if (source !== null) {
      const presetContainer = document.createElement('div');
      fields = document.createElement('div');
      panel.content.append(presetContainer, fields);
      presets = createPresetControls({
        container: presetContainer,
        source,
        storage: options.storage,
        translate,
        setStatus,
        onError,
      });
      unsubscribeSource = source.subscribe(() => gui?.refreshValues());
    }
    refreshLabels();
  }

  function resetSettings(): void {
    presets?.resetSelection();
    setStatus('resetDone');
  }

  async function copySettings(): Promise<void> {
    const selectedSource = source;
    if (selectedSource === null) {
      return;
    }
    try {
      const data = JSON.stringify(
        { version: 1, experience: selectedSource.id, settings: selectedSource.getSettings() },
        null,
        2
      );
      const clipboard = document.defaultView?.navigator.clipboard;
      if (clipboard === undefined) {
        throw new Error('Clipboard is unavailable.');
      }
      await clipboard.writeText(data);
      if (!isDisposed && source === selectedSource) {
        setStatus('copied');
      }
    } catch (error) {
      onError(error);
      if (!isDisposed && source === selectedSource) {
        setStatus('copyFailed');
      }
    }
  }
  const onCopy = () => {
    void copySettings();
  };
  reset.addEventListener('click', resetSettings);
  copy.addEventListener('click', onCopy);
  refreshLabels();
  return {
    setSource,
    refreshLabels,
    dispose() {
      isDisposed = true;
      unsubscribeSource?.();
      presets?.dispose();
      gui?.dispose();
      reset.removeEventListener('click', resetSettings);
      copy.removeEventListener('click', onCopy);
      panel.dispose();
    },
  };
}
