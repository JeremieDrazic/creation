import { expect, expectTypeOf, test } from 'vitest';

import { CodedError } from './coded-error';

const TEST_ERROR_CODES = {
  SOURCE_FAILED: 'TEST_SOURCE_FAILED',
  OPERATION_FAILED: 'TEST_OPERATION_FAILED',
} as const;

type TestErrorCode = (typeof TEST_ERROR_CODES)[keyof typeof TEST_ERROR_CODES];

test('remains a native Error with a technical code and no required cause', () => {
  const error = new CodedError(TEST_ERROR_CODES.OPERATION_FAILED);

  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(CodedError);
  expect(error.name).toBe('CodedError');
  expect(error.code).toBe(TEST_ERROR_CODES.OPERATION_FAILED);
  expect(error.message).toBe(TEST_ERROR_CODES.OPERATION_FAILED);
  expect(error.cause).toBeUndefined();
});

test('retains the original diagnostic failure through multiple wrapping boundaries', () => {
  const originalCause = new Error('External operation failed.');
  const sourceError = new CodedError(TEST_ERROR_CODES.SOURCE_FAILED, { cause: originalCause });
  const operationError = new CodedError(TEST_ERROR_CODES.OPERATION_FAILED, { cause: sourceError });

  expect(operationError.cause).toBe(sourceError);
  expect(sourceError.cause).toBe(originalCause);
  expect(originalCause.message).toBe('External operation failed.');
});

test('preserves non-Error diagnostic data without converting it to visitor text', () => {
  const diagnostic = { reason: 'External system rejected the request.' };
  const error = new CodedError(TEST_ERROR_CODES.OPERATION_FAILED, { cause: diagnostic });

  expect(error.cause).toBe(diagnostic);
  expect(error.message).toBe(TEST_ERROR_CODES.OPERATION_FAILED);
});

test('preserves the domain code union and literal inference at compile time', () => {
  const domainError = new CodedError<TestErrorCode>(TEST_ERROR_CODES.OPERATION_FAILED);
  const inferredError = new CodedError(TEST_ERROR_CODES.SOURCE_FAILED);

  // These assertions are checked by TypeScript in pnpm check, not by executing JavaScript alone.
  expectTypeOf(domainError.code).toEqualTypeOf<TestErrorCode>();
  expectTypeOf(inferredError.code).toEqualTypeOf<typeof TEST_ERROR_CODES.SOURCE_FAILED>();
});
