import { attachPanelDragging } from './attach-panel-dragging';
import { createPanelIcon } from './panel-icon';
import './floating-panel.css';

export type FloatingPanel = Readonly<{
  /** Mount controls here; the panel does not own those controls or their state. */
  content: HTMLElement;
  actions: HTMLElement;
  setSubtitle: (subtitle: string) => void;
  setStatus: (status: string) => void;
  updateLabels: (title: string, labels: PanelLabels) => void;
  dispose: () => void;
}>;

export type PanelLabels = Readonly<{
  move: string;
  moveHint: string;
  collapse: string;
  expand: string;
  footer: string;
}>;

/** Framework-independent, draggable control surface. The caller owns container and content cleanup. */
export function createFloatingPanel(
  options: Readonly<{
    container: HTMLElement;
    title: string;
    labels?: PanelLabels;
    displayFont?: string;
  }>
): FloatingPanel {
  let labels = options.labels ?? {
    move: 'Move panel',
    moveHint: 'Drag to move · Arrow keys · Shift for larger steps',
    collapse: 'Collapse panel',
    expand: 'Expand panel',
    footer: 'Live controls',
  };
  const document = options.container.ownerDocument;
  const panel = document.createElement('aside');
  panel.className = 'creation-floating-panel';
  if (options.displayFont !== undefined) {
    panel.style.setProperty('--panel-display-font', options.displayFont);
  }
  panel.setAttribute('aria-label', options.title);

  const header = document.createElement('header');
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'creation-panel-handle';
  handle.setAttribute('aria-label', labels.move);
  handle.title = labels.moveHint;
  const grip = document.createElement('span');
  grip.className = 'creation-panel-grip';
  grip.setAttribute('aria-hidden', 'true');
  const title = document.createElement('span');
  title.textContent = options.title;
  handle.append(grip, title);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'creation-panel-toggle';
  toggle.setAttribute('aria-label', labels.collapse);
  toggle.title = labels.collapse;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.append(createPanelIcon(document, false));
  header.append(handle, toggle);

  const body = document.createElement('div');
  body.className = 'creation-panel-body';
  const subtitle = document.createElement('p');
  subtitle.className = 'creation-panel-subtitle';
  const content = document.createElement('div');
  content.className = 'creation-panel-content';
  body.append(subtitle, content);
  const footer = document.createElement('p');
  footer.className = 'creation-panel-footer';
  footer.textContent = labels.footer;
  const actions = document.createElement('div');
  actions.className = 'creation-panel-actions';
  const status = document.createElement('p');
  status.className = 'creation-panel-status';
  status.setAttribute('role', 'status');
  body.append(actions, footer, status);
  panel.append(header, body);
  options.container.append(panel);
  const stopDragging = attachPanelDragging(panel, handle);

  function toggleCollapsed(): void {
    body.hidden = !body.hidden;
    panel.toggleAttribute('data-collapsed', body.hidden);
    toggle.setAttribute('aria-expanded', String(!body.hidden));
    toggle.setAttribute('aria-label', body.hidden ? labels.expand : labels.collapse);
    toggle.title = body.hidden ? labels.expand : labels.collapse;
    toggle.replaceChildren(createPanelIcon(document, body.hidden));
  }
  toggle.addEventListener('click', toggleCollapsed);

  return {
    content,
    actions,
    setSubtitle(text) {
      subtitle.textContent = text;
    },
    setStatus(text) {
      status.textContent = text;
    },
    updateLabels(nextTitle, nextLabels) {
      labels = nextLabels;
      title.textContent = nextTitle;
      panel.setAttribute('aria-label', nextTitle);
      handle.setAttribute('aria-label', labels.move);
      handle.title = labels.moveHint;
      toggle.setAttribute('aria-label', body.hidden ? labels.expand : labels.collapse);
      toggle.title = body.hidden ? labels.expand : labels.collapse;
      footer.textContent = labels.footer;
    },
    dispose() {
      stopDragging();
      toggle.removeEventListener('click', toggleCollapsed);
      panel.remove();
    },
  };
}
