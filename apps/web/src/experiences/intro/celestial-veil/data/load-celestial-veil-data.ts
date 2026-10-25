import { CodedError } from '@creation/utils/errors/coded-errors';

import assetUrl from '../../assets/celestial-veil/celestial-veil-data.json?url';
import { parseCelestialVeilData, type CelestialVeilData } from './celestial-veil-data';

export const CELESTIAL_VEIL_DATA_ERROR_CODES = {
  LOAD_FAILED: 'CELESTIAL_VEIL_DATA_LOAD_FAILED',
} as const;

/** Fetches/validates the asset; failures retain their cause and cancellation retains its reason. */
export async function loadCelestialVeilData(signal: AbortSignal): Promise<CelestialVeilData> {
  signal.throwIfAborted();

  try {
    const response = await fetch(assetUrl, { signal });
    if (!response.ok) {
      throw new Error(`Celestial veil asset request failed with HTTP ${response.status}.`);
    }
    const value: unknown = await response.json();
    signal.throwIfAborted();
    return parseCelestialVeilData(value);
  } catch (cause) {
    signal.throwIfAborted();
    throw new CodedError(CELESTIAL_VEIL_DATA_ERROR_CODES.LOAD_FAILED, { cause });
  }
}
