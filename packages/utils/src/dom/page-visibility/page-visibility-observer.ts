/** A page document's visibility and event subscription surface. */
export type PageVisibilityDocument = Pick<Document, 'hidden'> &
  Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

export type PageVisibilityObserverOptions = Readonly<{
  /** Supplied explicitly so tests and isolated browser instances choose their own document. */
  document: PageVisibilityDocument;
  /** Called synchronously with the initial visibility, then on each visibilitychange event. */
  onVisibilityChange: (isPageVisible: boolean) => void;
}>;

/** Owns one visibilitychange listener; the caller owns scene/audio suspension policy. */
export type PageVisibilityObserver = Readonly<{
  /** Removes the listener once and prevents later notifications. */
  dispose: () => void;
}>;

/**
 * Observes page visibility without polling, scheduling frames or responding to focus/blur.
 * Registers the listener before reporting the initial state. If initial reporting throws, the
 * listener is removed and the original failure is rethrown. Later callback failures propagate
 * through the document's event dispatch; the callback must handle its own asynchronous failures.
 */
export function createPageVisibilityObserver({
  document,
  onVisibilityChange,
}: PageVisibilityObserverOptions): PageVisibilityObserver {
  let isDisposed = false;

  function reportPageVisibility(): void {
    if (isDisposed) {
      return;
    }

    onVisibilityChange(!document.hidden);
  }

  function dispose(): void {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    document.removeEventListener('visibilitychange', reportPageVisibility);
  }

  document.addEventListener('visibilitychange', reportPageVisibility);

  try {
    reportPageVisibility();
  } catch (cause) {
    dispose();
    throw cause;
  }

  return { dispose };
}
