import { describe, expect, it } from 'vitest';

import { CodedError } from '../../errors/coded-errors/coded-error';
import { getElementWindow } from './get-element-window';

describe('getElementWindow', () => {
  it('returns the window belonging to any HTML element without a global window', () => {
    const iframeWindow = {};
    const element = { ownerDocument: { defaultView: iframeWindow } };

    expect(getElementWindow(element as unknown as HTMLElement, 'APP_UNAVAILABLE_WINDOW')).toBe(
      iframeWindow
    );
  });

  it('throws a coded error with the caller-selected domain code when no window exists', () => {
    const element = { ownerDocument: { defaultView: null } };

    for (const code of ['RENDERING_SESSION_UNAVAILABLE_WINDOW', 'UI_UNAVAILABLE_WINDOW']) {
      const getWindow = () => getElementWindow(element as unknown as HTMLElement, code);

      expect(getWindow).toThrow(CodedError);
      expect(getWindow).toThrow(expect.objectContaining({ code }));
    }
  });
});
