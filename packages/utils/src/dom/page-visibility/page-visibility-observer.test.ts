import { describe, expect, test, vi } from 'vitest';

import { createPageVisibilityObserver } from './page-visibility-observer';

/** Uses real event dispatch with an explicitly controlled visibility property, without a browser. */
function createPageDocument(hidden = false) {
  return Object.assign(new EventTarget(), { hidden });
}

describe('page visibility', () => {
  test.each([false, true])('reports the initial state when hidden is %s', (hidden) => {
    const document = createPageDocument(hidden);
    const onVisibilityChange = vi.fn();
    const observer = createPageVisibilityObserver({ document, onVisibilityChange });

    expect(onVisibilityChange).toHaveBeenCalledExactlyOnceWith(!hidden);
    observer.dispose();
  });

  test('reports hide and return, and ignores focus and blur', () => {
    const document = createPageDocument();
    const onVisibilityChange = vi.fn();
    const observer = createPageVisibilityObserver({ document, onVisibilityChange });

    document.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('focus'));
    expect(onVisibilityChange).toHaveBeenCalledOnce();

    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onVisibilityChange.mock.calls).toEqual([[true], [false], [true]]);
    observer.dispose();
  });

  test('removes its exact listener once and stops notifications after disposal', () => {
    const document = createPageDocument();
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const onVisibilityChange = vi.fn();
    const observer = createPageVisibilityObserver({ document, onVisibilityChange });

    observer.dispose();
    observer.dispose();
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));

    expect(removeListener).toHaveBeenCalledExactlyOnceWith(
      'visibilitychange',
      addListener.mock.calls[0]?.[1]
    );
    expect(onVisibilityChange).toHaveBeenCalledOnce();
  });

  test('releases the listener if the initial callback fails and preserves the original cause', () => {
    const document = createPageDocument();
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const cause = new Error('Initial visibility handling failed.');
    const onVisibilityChange = vi.fn(() => {
      throw cause;
    });

    expect(() => createPageVisibilityObserver({ document, onVisibilityChange })).toThrow(cause);
    expect(removeListener).toHaveBeenCalledOnce();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(onVisibilityChange).toHaveBeenCalledOnce();
  });
});
