export type PanelPosition = Readonly<{ x: number; y: number }>;
type Size = Readonly<{ width: number; height: number }>;

/** Keeps the panel inside the viewport, including when its content or the viewport changes size. */
export function clampPanelPosition(
  position: PanelPosition,
  panel: Size,
  viewport: Size
): PanelPosition {
  const gutter = 12;
  return {
    x: Math.max(gutter, Math.min(position.x, viewport.width - panel.width - gutter)),
    y: Math.max(gutter, Math.min(position.y, viewport.height - panel.height - gutter)),
  };
}
