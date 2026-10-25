import type { PrepareCreationExperience } from '../../types';

const prepareIntro: PrepareCreationExperience = async (options) => {
  options.signal.throwIfAborted();
  const { IntroCreation } = await import('../../experiences/intro/intro-creation');
  options.signal.throwIfAborted();
  return IntroCreation.prepare(options);
};

const EXPERIENCE_PREPARATION_BY_PATH: Readonly<Record<string, PrepareCreationExperience | null>> = {
  '/': prepareIntro,
  // Fireflies currently has route UI but no graphics experience to prepare.
  '/fireflies': null,
};

/**
 * Resolves a router pathname to its graphics preparation function without loading the experience.
 * Null means there is no graphics experience for this route, including unknown routes. Search
 * parameters and hashes belong to the router location, not this pathname lookup.
 */
export function resolveRouteExperience(pathname: string): PrepareCreationExperience | null {
  if (!Object.hasOwn(EXPERIENCE_PREPARATION_BY_PATH, pathname)) {
    return null;
  }

  return EXPERIENCE_PREPARATION_BY_PATH[pathname] ?? null;
}
