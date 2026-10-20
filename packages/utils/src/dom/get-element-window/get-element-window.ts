import { CodedError } from '../../errors/coded-errors/coded-error';

/**
 * Gets an HTML element's own browser window, including when it belongs to an iframe. The caller
 * supplies its domain's error code; this utility knows no rendering-specific codes.
 *
 * @throws {CodedError} With unavailableWindowErrorCode when the document has no browser window.
 */
export function getElementWindow<Code extends string>(
  element: HTMLElement,
  unavailableWindowErrorCode: Code
): Window & typeof globalThis {
  const browserWindow = element.ownerDocument.defaultView;

  if (browserWindow === null) {
    throw new CodedError<Code>(unavailableWindowErrorCode);
  }

  return browserWindow;
}
