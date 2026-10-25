/** Small authored strokes, independent of a font glyph or external icon package. */
export function createPanelIcon(document: Document, collapsed: boolean): SVGElement {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS(namespace, 'path');
  path.setAttribute(
    'd',
    collapsed ? 'M8 8 4 4m0 4V4h4m4 8 4 4m-4 0h4v-4' : 'M4 4 8 8M4 8h4V4m8 12-4-4m0 4v-4h4'
  );
  svg.append(path);
  return svg;
}
