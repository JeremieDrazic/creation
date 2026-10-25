import { afterEach, expect, test, vi } from 'vitest';

import { CodedError } from '@creation/utils/errors/coded-errors';

import { CELESTIAL_VEIL_GRAIN_COLUMNS } from './celestial-veil-data';
import { CELESTIAL_VEIL_DATA_ERROR_CODES, loadCelestialVeilData } from './load-celestial-veil-data';

const ASSET = {
  schemaVersion: 1,
  frame: { widthPx: 10, heightPx: 10 },
  depthSpanWorldUnits: 100,
  columns: CELESTIAL_VEIL_GRAIN_COLUMNS,
  grains: [[1.5, 2.5, 10, 2, 0.2, 0.3, 0.4, 0.5, 0.6]],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test('downloads and validates the external asset with the caller cancellation signal', async () => {
  const fetchAsset = vi.fn<typeof fetch>().mockResolvedValue(Response.json(ASSET));
  vi.stubGlobal('fetch', fetchAsset);
  const controller = new AbortController();
  expect(await loadCelestialVeilData(controller.signal)).toEqual(ASSET);
  expect(fetchAsset).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
});

test('does not start a request when already cancelled', async () => {
  const fetchAsset = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchAsset);
  const reason = new Error('Obsolete preparation');
  await expect(loadCelestialVeilData(AbortSignal.abort(reason))).rejects.toBe(reason);
  expect(fetchAsset).not.toHaveBeenCalled();
});

test('identifies loading failure while preserving the original request cause', async () => {
  const failure = new Error('Connection failed');
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(failure));
  await expect(loadCelestialVeilData(new AbortController().signal)).rejects.toMatchObject({
    name: 'CodedError',
    code: CELESTIAL_VEIL_DATA_ERROR_CODES.LOAD_FAILED,
    cause: failure,
  });
});

test('rejects unsuccessful HTTP status and invalid asset data', async () => {
  const fetchAsset = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response('', { status: 404 }))
    .mockResolvedValueOnce(Response.json({ schemaVersion: 999 }));
  vi.stubGlobal('fetch', fetchAsset);
  await expect(loadCelestialVeilData(new AbortController().signal)).rejects.toMatchObject({
    code: CELESTIAL_VEIL_DATA_ERROR_CODES.LOAD_FAILED,
    cause: expect.objectContaining({
      message: expect.stringContaining('HTTP 404') as unknown,
    }) as unknown,
  });
  await expect(loadCelestialVeilData(new AbortController().signal)).rejects.toMatchObject({
    code: CELESTIAL_VEIL_DATA_ERROR_CODES.LOAD_FAILED,
    cause: expect.any(RangeError) as unknown,
  });
});

test('rejects a result cancelled while its body was being read', async () => {
  const controller = new AbortController();
  const reason = new Error('Cancelled during JSON read');
  const response = Response.json(ASSET);
  vi.spyOn(response, 'json').mockImplementation(async () => {
    controller.abort(reason);
    return ASSET;
  });
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response));
  await expect(loadCelestialVeilData(controller.signal)).rejects.toBe(reason);
});

test('wraps malformed JSON in the same operational error', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('{')));
  const failure = await loadCelestialVeilData(new AbortController().signal).catch(
    (error: unknown) => error
  );
  expect(failure).toBeInstanceOf(CodedError);
  expect(failure).toMatchObject({
    code: CELESTIAL_VEIL_DATA_ERROR_CODES.LOAD_FAILED,
    cause: expect.any(SyntaxError) as unknown,
  });
});

test('keeps the caller cancellation reason when the request rejects after cancellation', async () => {
  const controller = new AbortController();
  const reason = new Error('Obsolete preparation');
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockImplementation(async () => {
      controller.abort(reason);
      throw new DOMException('Request aborted', 'AbortError');
    })
  );
  await expect(loadCelestialVeilData(controller.signal)).rejects.toBe(reason);
});
