/**
 * An operational error with a domain-owned code and optional diagnostic cause. Code typing helps
 * callers handle known failures; it does not validate external data at runtime. The message
 * contains the technical code. Visitor-facing translations belong to the UI. This module has no
 * dependency on a browser, graphics backend or particular domain.
 */
export class CodedError<Code extends string = string> extends Error {
  readonly code: Code;

  /**
   * @param code - Stable identifier defined by the owning domain.
   * @param options - Native Error options; use cause to preserve the underlying failure.
   */
  constructor(code: Code, options?: ErrorOptions) {
    super(code, options);
    this.name = 'CodedError';
    this.code = code;
  }
}
