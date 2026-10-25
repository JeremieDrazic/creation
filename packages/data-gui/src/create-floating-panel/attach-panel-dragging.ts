import { getElementWindow } from '@creation/utils/dom/get-element-window';

import { clampPanelPosition, type PanelPosition } from './panel-position';

const KEY_DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Owns pointer capture and resize listeners; moves only the floating surface, never its content. */
export function attachPanelDragging(panel: HTMLElement, handle: HTMLElement): () => void {
  const viewport = getElementWindow(panel, 'DATA_GUI_PANEL_WINDOW_UNAVAILABLE');
  const controller = new viewport.AbortController();
  const listenerOptions = { signal: controller.signal };
  let position: PanelPosition = { x: viewport.innerWidth - panel.offsetWidth - 24, y: 112 };
  let drag: { pointerId: number; x: number; y: number; origin: PanelPosition } | undefined;

  function moveTo(next: PanelPosition): void {
    const bounds = panel.getBoundingClientRect();
    position = clampPanelPosition(
      next,
      { width: Math.ceil(bounds.width), height: Math.ceil(bounds.height) },
      { width: viewport.innerWidth, height: viewport.innerHeight }
    );
    panel.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }

  function stopDragging(): void {
    const pointerId = drag?.pointerId;
    drag = undefined;
    panel.removeAttribute('data-dragging');
    if (pointerId !== undefined && handle.hasPointerCapture(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }
  }

  handle.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || !event.isPrimary) {
        return;
      }
      handle.focus({ preventScroll: true });
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: position };
      handle.setPointerCapture(event.pointerId);
      panel.setAttribute('data-dragging', '');
      event.preventDefault();
    },
    listenerOptions
  );

  handle.addEventListener(
    'pointermove',
    (event) => {
      if (drag?.pointerId === event.pointerId) {
        moveTo({
          x: drag.origin.x + event.clientX - drag.x,
          y: drag.origin.y + event.clientY - drag.y,
        });
      }
    },
    listenerOptions
  );
  handle.addEventListener('pointerup', stopDragging, listenerOptions);
  handle.addEventListener('pointercancel', stopDragging, listenerOptions);
  handle.addEventListener('lostpointercapture', stopDragging, listenerOptions);
  handle.addEventListener(
    'keydown',
    (event) => {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction !== undefined) {
        const step = event.shiftKey ? 40 : 10;
        moveTo({ x: position.x + direction[0] * step, y: position.y + direction[1] * step });
        event.preventDefault();
      }
    },
    listenerOptions
  );

  const keepVisible = () => moveTo(position);
  viewport.addEventListener('resize', keepVisible, listenerOptions);
  const resizeObserver = new viewport.ResizeObserver(keepVisible);
  resizeObserver.observe(panel);
  keepVisible();

  return () => {
    stopDragging();
    controller.abort();
    resizeObserver.disconnect();
  };
}
